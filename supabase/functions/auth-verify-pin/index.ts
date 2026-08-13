import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

/**
 * MTAA Auth Verify PIN — Production Hardened
 * 
 * Security:
 * - Rate limiting: 5 attempts per device per 15 minutes
 * - Account lockout: 5 failed attempts = 15-minute lock
 * - PBKDF2-SHA256 server-side verification
 * - Audit logging for every attempt
 * - Device fingerprint tracking
 */

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const WINDOW_MINUTES = 15;

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { p_user_id, p_pin, p_device_id } = await req.json();

    if (!p_user_id || !p_pin || !p_device_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // ─── Rate Limiting Check ─────────────────────────────────────────────
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

    const { data: recentAttempts, error: attemptError } = await supabase
      .from('pin_attempts')
      .select('*')
      .eq('device_id', p_device_id)
      .gte('created_at', windowStart)
      .order('created_at', { ascending: false });

    if (attemptError) {
      console.error('Rate limit check failed:', attemptError);
    }

    const failedAttempts = recentAttempts?.filter((a: any) => !a.success) || [];

    if (failedAttempts.length >= MAX_ATTEMPTS) {
      const lastAttempt = failedAttempts[0];
      const lockoutEnd = new Date(
        new Date(lastAttempt.created_at).getTime() + LOCKOUT_MINUTES * 60 * 1000
      );

      if (lockoutEnd > new Date()) {
        // Log blocked attempt
        await supabase.from('pin_attempts').insert({
          user_id: p_user_id,
          device_id: p_device_id,
          success: false,
          blocked: true,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown',
        });

        return new Response(
          JSON.stringify({
            valid: false,
            locked_until: lockoutEnd.toISOString(),
            attempts_remaining: 0,
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // ─── Check Active Lockout ──────────────────────────────────────────────
    const { data: lockout } = await supabase
      .from('pin_lockouts')
      .select('*')
      .eq('user_id', p_user_id)
      .eq('device_id', p_device_id)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (lockout) {
      await supabase.from('pin_attempts').insert({
        user_id: p_user_id,
        device_id: p_device_id,
        success: false,
        blocked: true,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      });

      return new Response(
        JSON.stringify({
          valid: false,
          locked_until: lockout.expires_at,
          attempts_remaining: 0,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ─── Fetch Stored PIN Hash ────────────────────────────────────────────
    const { data: pinRecord, error: pinError } = await supabase
      .from('user_pin_hashes')
      .select('pin_hash, salt, created_at')
      .eq('user_id', p_user_id)
      .single();

    if (pinError || !pinRecord) {
      // No PIN set — log and return
      await supabase.from('pin_attempts').insert({
        user_id: p_user_id,
        device_id: p_device_id,
        success: false,
        reason: 'pin_not_set',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      });

      return new Response(
        JSON.stringify({ valid: false, error: 'PIN not set' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ─── PBKDF2-SHA256 Server-Side Verification ──────────────────────────
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(p_pin),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const computedHash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode(pinRecord.salt),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const computedHashHex = Array.from(new Uint8Array(computedHash))
      .map((b: any) => b.toString(16).padStart(2, '0'))
      .join('');

    const valid = computedHashHex === pinRecord.pin_hash;

    // ─── Log Attempt ──────────────────────────────────────────────────────
    await supabase.from('pin_attempts').insert({
      user_id: p_user_id,
      device_id: p_device_id,
      success: valid,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    if (!valid) {
      // Check if we need to create a lockout
      const { count } = await supabase
        .from('pin_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', p_user_id)
        .eq('device_id', p_device_id)
        .eq('success', false)
        .gte('created_at', windowStart);

      const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - (count || 0));

      if ((count || 0) >= MAX_ATTEMPTS) {
        // Create lockout
        const expiresAt = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        await supabase.from('pin_lockouts').insert({
          user_id: p_user_id,
          device_id: p_device_id,
          expires_at: expiresAt.toISOString(),
          reason: 'too_many_failed_attempts',
        });

        // Log security event
        await supabase.from('security_events').insert({
          user_id: p_user_id,
          event_type: 'pin_lockout',
          severity: 'high',
          details: { device_id: p_device_id, attempts: count },
        });

        return new Response(
          JSON.stringify({
            valid: false,
            locked_until: expiresAt.toISOString(),
            attempts_remaining: 0,
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          valid: false,
          attempts_remaining: attemptsRemaining,
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ─── Success — Update Device Trust ───────────────────────────────────
    await supabase.from('device_trust').upsert({
      user_id: p_user_id,
      device_id: p_device_id,
      last_verified: new Date().toISOString(),
      failed_attempts: 0,
      trust_score: supabase.rpc('calculate_trust_score', { p_user_id, p_device_id }),
    }, { onConflict: 'user_id,device_id' });

    // ─── Success Response ───────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        valid: true,
        pin_hash: pinRecord.pin_hash,
        salt: pinRecord.salt,
        attempts_remaining: MAX_ATTEMPTS,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auth verify PIN error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
