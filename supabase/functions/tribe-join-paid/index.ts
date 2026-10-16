import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    
    const authenticatedUserId = user.id
    const { tribe_id, amount, currency } = await req.json()
    const user_id = authenticatedUserId

    if (!tribe_id || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields', code: 'INVALID_REQUEST' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: wallet, error: walletError } = await supabaseAdmin.from('wallets').select('id, balance, status').eq('user_id', user_id).eq('currency', currency).single()
    if (walletError || !wallet) return new Response(JSON.stringify({ error: 'Wallet not found', code: 'WALLET_MISSING' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    if (wallet.status !== 'active') return new Response(JSON.stringify({ error: 'Wallet frozen', code: 'WALLET_FROZEN' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    if (wallet.balance < amount) return new Response(JSON.stringify({ error: 'Insufficient balance', code: 'INSUFFICIENT_FUNDS' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { error: debitError } = await supabaseAdmin.from('wallets').update({ balance: wallet.balance - amount, updated_at: new Date().toISOString() }).eq('id', wallet.id)
    if (debitError) throw debitError

    const txId = crypto.randomUUID()
    await supabaseAdmin.from('transactions').insert({ id: txId, user_id, wallet_id: wallet.id, type: 'tribe_membership', amount, currency, fee: 0, net_amount: amount, status: 'completed', metadata: { tribe_id }, description: 'Tribe membership payment' })
    await supabaseAdmin.from('tribe_members').upsert({ tribe_id, user_id, role: 'member', status: 'active', payment_status: 'paid', joined_at: new Date().toISOString() }, { onConflict: 'tribe_id,user_id' })
    await supabaseAdmin.from('audit_logs').insert({ user_id, action: 'tribe_join_paid', entity_type: 'tribe', entity_id: tribe_id, details: { amount, currency, transaction_id: txId } })

    return new Response(JSON.stringify({ success: true, transaction_id: txId }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, code: 'INTERNAL_ERROR' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
