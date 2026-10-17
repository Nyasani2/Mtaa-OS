import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // 2. Force user_id from authenticated user
    const { amount, currency, method, phone_number, card_token, bank_account, crypto_address, crypto_network, metadata } = await req.json();
    const user_id = user.id;

    if (!amount || amount <= 0 || !currency || !method) {
      return new Response(JSON.stringify({ error: 'Missing required fields', code: 'INVALID_REQUEST' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Get Wallet
    const { data: wallet, error: walletError } = await supabaseAdmin.from("wallet_accounts").select('id, balance, available_balance, currency, status, wallet_type').eq('user_id', user_id).eq('is_default', true).single();
    if (walletError || !wallet) return new Response(JSON.stringify({ error: 'Wallet not found', code: 'WALLET_MISSING' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (wallet.status !== 'active') return new Response(JSON.stringify({ error: 'Wallet is frozen', code: 'WALLET_FROZEN' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const depositId = crypto.randomUUID();
    const reference = `DEP_${method.toUpperCase()}_${user_id.slice(0, 8)}_${Date.now()}`;

    // 4. Create Pending Deposit Record
    await supabaseAdmin.from('wallet_deposits').insert({
      id: depositId, user_id, wallet_id: wallet.id, amount, currency, provider_name: method, channel: method, status: 'pending', external_reference: reference, requested_by: user_id, requested_at: new Date().toISOString(),
      metadata: { ...metadata, phone_number: phone_number || null, user_agent: req.headers.get('user-agent'), ip_address: req.headers.get('x-forwarded-for') || 'unknown' },
    });

    // 5. Method Handling (M-Pesa example)
    let result: any = {};
    if (method === 'mpesa') {
      if (!phone_number) return new Response(JSON.stringify({ error: 'Phone number required', code: 'PHONE_REQUIRED' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      
      const stkRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-stk-push`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone_number, amount, user_id }),
      });
      const stkData = await stkRes.json();
      if (!stkData.success) {
        await supabaseAdmin.from('wallet_deposits').update({ status: 'failed', failure_reason: stkData.error }).eq('id', depositId);
        return new Response(JSON.stringify({ error: stkData.error }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      result = { checkoutRequestID: stkData.checkoutRequestID, message: stkData.message };
    }

    return new Response(JSON.stringify({ success: true, deposit_id: depositId, reference, status: 'pending', ...result }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
