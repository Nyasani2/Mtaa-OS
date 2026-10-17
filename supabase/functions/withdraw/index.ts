import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

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

    // 2. Force user_id
    const { amount, currency, method, destination, metadata } = await req.json();
    const user_id = user.id;

    if (!amount || amount <= 0 || !currency || !method || !destination) {
      return new Response(JSON.stringify({ error: 'Missing required fields', code: 'INVALID_REQUEST' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Get Wallet
    const { data: wallet, error: walletError } = await supabaseAdmin.from('wallets').select('id, balance, currency, status').eq('user_id', user_id).eq('currency', currency).single();
    if (walletError || !wallet) return new Response(JSON.stringify({ error: 'Wallet not found', code: 'WALLET_MISSING' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (wallet.balance < amount) return new Response(JSON.stringify({ error: 'Insufficient balance', code: 'INSUFFICIENT_FUNDS' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const transactionId = crypto.randomUUID();
    const fee = Math.round(amount * 0.02 * 100) / 100; // 2% fee example
    const netAmount = amount - fee;

    // 4. Create Transaction
    await supabaseAdmin.from('transactions').insert({
      id: transactionId, user_id, wallet_id: wallet.id, type: 'withdrawal', amount, currency, fee, net_amount: netAmount, status: 'pending', metadata: { ...metadata, destination }, description: `Withdrawal via ${method}`,
    });

    // 5. Reserve Funds
    await supabaseAdmin.rpc('reserve_withdrawal_funds', { p_wallet_id: wallet.id, p_amount: amount, p_transaction_id: transactionId }).catch(() => {});

    return new Response(JSON.stringify({ success: true, transaction_id: transactionId, status: 'pending', amount, fee, net_amount }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
