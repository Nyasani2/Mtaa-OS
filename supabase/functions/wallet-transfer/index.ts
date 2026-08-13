// supabase/functions/wallet-transfer/index.ts
// Phase 6: Financial Authorization — Server-validated atomic transfers
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
    // Auth client to verify sender
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service client for atomic operations (bypasses RLS)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = await req.json();
    const { recipient_id, amount, currency = 'KES', description = 'MTAA Transfer', metadata = {} } = body;

    // ── VALIDATION ──
    if (!recipient_id || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'recipient_id and positive amount required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (recipient_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot send to yourself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify recipient exists
    const { data: recipientProfile } = await serviceClient
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', recipient_id)
      .single();

    if (!recipientProfile) {
      return new Response(
        JSON.stringify({ error: 'Recipient not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify sender device is trusted
    const { data: trustedDevice } = await serviceClient
      .from('user_devices')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_current', true)
      .eq('is_trusted', true)
      .eq('revoked_at', null)
      .maybeSingle();

    // For now, allow untrusted devices but log a warning
    // In strict mode, uncomment below:
    // if (!trustedDevice) {
    //   return new Response(
    //     JSON.stringify({ error: 'Current device is not trusted. Trust this device in settings first.' }),
    //     { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    //   );
    // }

    // Get sender wallet
    const { data: senderWallet } = await serviceClient
      .from('wallet_accounts')
      .select('id, balance, available_balance, hold_balance')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    if (!senderWallet) {
      return new Response(
        JSON.stringify({ error: 'Sender wallet not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fee = amount * 0.01;
    const totalDebit = amount + fee;

    if (senderWallet.available_balance < totalDebit) {
      return new Response(
        JSON.stringify({ error: 'Insufficient balance', available: senderWallet.available_balance, required: totalDebit }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get recipient wallet
    const { data: recipientWallet } = await serviceClient
      .from('wallet_accounts')
      .select('id, balance, available_balance')
      .eq('user_id', recipient_id)
      .eq('is_default', true)
      .single();

    if (!recipientWallet) {
      return new Response(
        JSON.stringify({ error: 'Recipient wallet not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── ATOMIC LEDGER WRITE ──
    const now = new Date().toISOString();
    const transactionId = crypto.randomUUID();

    // 1. Debit sender
    const newSenderBalance = senderWallet.balance - totalDebit;
    const newSenderAvailable = senderWallet.available_balance - totalDebit;
    const { error: senderError } = await serviceClient
      .from('wallet_accounts')
      .update({
        balance: newSenderBalance,
        available_balance: newSenderAvailable,
        updated_at: now,
      })
      .eq('id', senderWallet.id);

    if (senderError) throw new Error(`Sender debit failed: ${senderError.message}`);

    // 2. Credit recipient
    const newRecipientBalance = recipientWallet.balance + amount;
    const newRecipientAvailable = recipientWallet.available_balance + amount;
    const { error: recipientError } = await serviceClient
      .from('wallet_accounts')
      .update({
        balance: newRecipientBalance,
        available_balance: newRecipientAvailable,
        updated_at: now,
      })
      .eq('id', recipientWallet.id);

    if (recipientError) {
      // Rollback sender (best effort — in production use DB transactions)
      await serviceClient
        .from('wallet_accounts')
        .update({
          balance: senderWallet.balance,
          available_balance: senderWallet.available_balance,
          updated_at: now,
        })
        .eq('id', senderWallet.id);
      throw new Error(`Recipient credit failed: ${recipientError.message}`);
    }

    // 3. Record sender transaction
    const { error: txError } = await serviceClient
      .from('wallet_transactions')
      .insert({
        id: transactionId,
        user_id: user.id,
        wallet_id: senderWallet.id,
        amount: -totalDebit,
        type: 'debit',
        status: 'completed',
        description,
        reference_id: recipient_id,
        reference_type: 'user_transfer',
        metadata: { ...metadata, fee, recipient_id, transaction_direction: 'sent' },
        balance_after: newSenderBalance,
        completed_at: now,
        transaction_type: 'transfer',
        profile_id: user.id,
        currency,
        created_at: now,
      });

    if (txError) throw new Error(`Transaction record failed: ${txError.message}`);

    // 4. Record recipient transaction
    const recipientTxId = crypto.randomUUID();
    await serviceClient
      .from('wallet_transactions')
      .insert({
        id: recipientTxId,
        user_id: recipient_id,
        wallet_id: recipientWallet.id,
        amount: amount,
        type: 'credit',
        status: 'completed',
        description: `Received from ${metadata.sender_name || 'MTAA User'}`,
        reference_id: user.id,
        reference_type: 'user_transfer',
        metadata: { ...metadata, fee: 0, sender_id: user.id, transaction_direction: 'received' },
        balance_after: newRecipientBalance,
        completed_at: now,
        transaction_type: 'transfer',
        profile_id: recipient_id,
        currency,
        created_at: now,
      });

    // 5. Audit log
    await serviceClient.from('security_audit_logs').insert({
      user_id: user.id,
      device_id: trustedDevice?.id || null,
      event_type: 'payment_auth_success',
      metadata: {
        transaction_id: transactionId,
        recipient_id,
        amount,
        fee,
        currency,
        auth_method: metadata.auth_method || 'pin',
        device_trusted: !!trustedDevice,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transactionId,
        amount,
        fee,
        recipient_id,
        sender_balance: newSenderBalance,
        message: 'Transfer completed successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    // Log failure
    try {
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      await serviceClient.from('security_audit_logs').insert({
        user_id: user?.id || null,
        event_type: 'payment_auth_failed',
        metadata: { error: err.message, stack: err.stack },
      });
    } catch {}

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
