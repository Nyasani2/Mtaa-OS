// supabase/functions/device-register/index.ts
// MERGED: Handles register, trust, and revoke actions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (!action || !['register', 'trust', 'revoke'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'action must be register, trust, or revoke' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── REGISTER ──
    if (action === 'register') {
      const {
        device_name,
        platform,
        device_model,
        os_version,
        app_version,
        public_key,
        ip_address,
        user_agent,
      } = body;

      const { data: existing } = await supabaseClient
        .from('user_devices')
        .select('id, is_trusted, revoked_at')
        .eq('user_id', user.id)
        .eq('device_name', device_name)
        .eq('platform', platform)
        .maybeSingle();

      if (existing && !existing.revoked_at) {
        await supabaseClient
          .from('user_devices')
          .update({
            last_active_at: new Date().toISOString(),
            is_current: true,
            os_version,
            app_version,
          })
          .eq('id', existing.id);

        await supabaseClient
          .from('user_devices')
          .update({ is_current: false })
          .eq('user_id', user.id)
          .neq('id', existing.id);

        await supabaseClient.from('security_audit_logs').insert({
          user_id: user.id,
          device_id: existing.id,
          event_type: 'device_registered',
          metadata: { device_name, platform, is_trusted: existing.is_trusted, action: 'reactivate' },
          ip_address,
          user_agent,
        });

        return new Response(
          JSON.stringify({
            success: true,
            device_id: existing.id,
            is_trusted: existing.is_trusted,
            message: 'Device already registered',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabaseClient
        .from('user_devices')
        .update({ is_current: false })
        .eq('user_id', user.id);

      const { data: device, error } = await supabaseClient
        .from('user_devices')
        .insert({
          user_id: user.id,
          device_name,
          platform,
          device_model,
          os_version,
          app_version,
          public_key,
          ip_address,
          user_agent,
          is_trusted: false,
          is_current: true,
        })
        .select()
        .single();

      if (error) throw error;

      await supabaseClient.from('security_audit_logs').insert({
        user_id: user.id,
        device_id: device.id,
        event_type: 'device_registered',
        metadata: { device_name, platform, is_trusted: false },
        ip_address,
        user_agent,
      });

      return new Response(
        JSON.stringify({
          success: true,
          device_id: device.id,
          is_trusted: false,
          message: 'New device registered. Email verification required to trust.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── TRUST / REVOKE ──
    // These require service role for security
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { device_id } = body;
    if (!device_id) {
      return new Response(
        JSON.stringify({ error: 'device_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: device } = await serviceClient
      .from('user_devices')
      .select('*')
      .eq('id', device_id)
      .eq('user_id', user.id)
      .single();

    if (!device) {
      return new Response(
        JSON.stringify({ error: 'Device not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'trust') {
      const { error } = await serviceClient
        .from('user_devices')
        .update({ is_trusted: true, revoked_at: null, revoked_reason: null })
        .eq('id', device_id);

      if (error) throw error;

      await serviceClient.from('security_audit_logs').insert({
        user_id: user.id,
        device_id,
        event_type: 'device_trusted',
        metadata: { device_name: device.device_name, platform: device.platform },
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Device trusted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'revoke') {
      const { error } = await serviceClient
        .from('user_devices')
        .update({
          is_trusted: false,
          revoked_at: new Date().toISOString(),
          revoked_reason: body.reason || 'User revoked',
        })
        .eq('id', device_id);

      if (error) throw error;

      await serviceClient.from('security_audit_logs').insert({
        user_id: user.id,
        device_id,
        event_type: 'device_revoked',
        metadata: { device_name: device.device_name, platform: device.platform, reason: body.reason },
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Device revoked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
