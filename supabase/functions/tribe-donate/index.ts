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
    const { tribe_id, amount, currency, message, is_anonymous } = await req.json()
    const donor_id = authenticatedUserId

    if (!tribe_id || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields', code: 'INVALID_REQUEST' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: wallet, error: walletError } = await supabaseAdmin.from('wallets').select('id, balance, status').eq('user_id', donor_id).eq('currency', currency).single()
    if (walletError || !wallet) return new Response(JSON.stringify({ error: 'Wallet not found', code: 'WALLET_MISSING' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    if (wallet.status !== 'active') return new Response(JSON.stringify({ error: 'Wallet frozen', code: 'WALLET_FROZEN' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    if (wallet.balance < amount) return new Response(JSON.stringify({ error: 'Insufficient balance', code: 'INSUFFICIENT_FUNDS' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { error: debitError } = await supabaseAdmin.from('wallets').update({ balance: wallet.balance - amount, updated_at: new Date().toISOString() }).eq('id', wallet.id)
    if (debitError) throw debitError

    const { data: tribe } = await supabaseAdmin.from('tribes').select('creator_id').eq('id', tribe_id).single()
    if (!tribe) return new Response(JSON.stringify({ error: 'Tribe not found', code: 'TRIBE_NOT_FOUND' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: creatorWallet } = await supabaseAdmin.from('wallets').select('id').eq('user_id', tribe.creator_id).eq('currency', currency).single()
    const txId = crypto.randomUUID()

    await supabaseAdmin.from('transactions').insert({ id: txId, user_id: donor_id, wallet_id: wallet.id, type: 'tribe_donation', amount, currency, fee: 0, net_amount: amount, status: 'completed', metadata: { tribe_id, recipient_id: tribe.creator_id }, description: 'Donation to tribe' })
    if (creatorWallet) await supabaseAdmin.rpc('credit_wallet', { p_wallet_id: creatorWallet.id, p_amount: amount })
    await supabaseAdmin.from('tribe_donations').insert({ tribe_id, donor_id, amount, currency, message: message || null, is_anonymous: is_anonymous || false, status: 'completed', transaction_id: txId })
    await supabaseAdmin.from('audit_logs').insert({ user_id: donor_id, action: 'tribe_donation', entity_type: 'tribe', entity_id: tribe_id, details: { amount, currency, is_anonymous, transaction_id: txId } })

    return new Response(JSON.stringify({ success: true, transaction_id: txId }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, code: 'INTERNAL_ERROR' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
