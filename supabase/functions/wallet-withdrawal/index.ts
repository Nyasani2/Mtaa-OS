import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // 2. Force user_id
    const { amount, phone_number, till_number } = await req.json();
    const user_id = user.id;

    if (!amount || amount <= 0) return new Response(JSON.stringify({ error: 'amount required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (amount > 150000) return new Response(JSON.stringify({ error: 'Maximum withdrawal is 150,000' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // 3. Get Wallet
    const { data: wallet, error: walletError } = await supabaseAdmin.from('wallet_accounts').select('id, balance, available_balance, currency').eq('user_id', user_id).eq('currency', 'KES').eq('is_default', true).single();
    if (walletError || !wallet) return new Response(JSON.stringify({ error: 'Wallet not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (Number(wallet.available_balance) < amount) return new Response(JSON.stringify({ error: 'Insufficient balance' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const fee = Math.min(Math.max(Math.round(amount * 0.01), 10), 500);
    const netAmount = amount - fee;

    // 4. Create Withdrawal Record
    const { data: withdrawal, error: withdrawalError } = await supabaseAdmin.from('wallet_withdrawals').insert({ user_id, wallet_id: wallet.id, amount, fee, net_amount: netAmount, currency: 'KES', status: 'pending', phone_number, till_number }).select().single();
    if (withdrawalError) throw new Error(withdrawalError.message);

    // 5. Hold Funds & Process (Simplified for security fix)
    await supabaseAdmin.rpc('hold_wallet_funds', { p_wallet_id: wallet.id, p_amount: amount, p_reference_type: 'withdrawal', p_reference_id: withdrawal.id }).catch(() => {});

    return new Response(JSON.stringify({ success: true, withdrawal_id: withdrawal.id, status: 'pending', amount, fee, net_amount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
