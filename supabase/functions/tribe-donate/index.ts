import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { donor_id, tribe_id, amount, currency, message, is_anonymous } = await req.json()

    if (!donor_id || !tribe_id || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields', code: 'INVALID_REQUEST' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get donor wallet
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('id, balance, status')
      .eq('user_id', donor_id)
      .eq('currency', currency)
      .single()

    if (walletError || !wallet) {
      return new Response(
        JSON.stringify({ error: 'Wallet not found', code: 'WALLET_MISSING' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (wallet.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Wallet frozen', code: 'WALLET_FROZEN' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (wallet.balance < amount) {
      return new Response(
        JSON.stringify({ error: 'Insufficient balance', code: 'INSUFFICIENT_FUNDS' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deduct from donor wallet
    const { error: debitError } = await supabaseClient
      .from('wallets')
      .update({ balance: wallet.balance - amount, updated_at: new Date().toISOString() })
      .eq('id', wallet.id)

    if (debitError) throw debitError

    // Get tribe creator wallet
    const { data: tribe } = await supabaseClient
      .from('tribes')
      .select('creator_id')
      .eq('id', tribe_id)
      .single()

    if (!tribe) {
      return new Response(
        JSON.stringify({ error: 'Tribe not found', code: 'TRIBE_NOT_FOUND' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: creatorWallet } = await supabaseClient
      .from('wallets')
      .select('id')
      .eq('user_id', tribe.creator_id)
      .eq('currency', currency)
      .single()

    // Create transaction
    const txId = crypto.randomUUID()
    await supabaseClient.from('transactions').insert({
      id: txId,
      user_id: donor_id,
      wallet_id: wallet.id,
      type: 'tribe_donation',
      amount,
      currency,
      fee: 0,
      net_amount: amount,
      status: 'completed',
      metadata: { tribe_id, recipient_id: tribe.creator_id },
      description: `Donation to tribe`,
    })

    // Credit creator wallet (if exists)
    if (creatorWallet) {
      await supabaseClient.rpc('credit_wallet', {
        p_wallet_id: creatorWallet.id,
        p_amount: amount,
      })
    }

    // Record donation
    await supabaseClient.from('tribe_donations').insert({
      tribe_id,
      donor_id,
      amount,
      currency,
      message: message || null,
      is_anonymous: is_anonymous || false,
      status: 'completed',
      transaction_id: txId,
    })

    // Audit log
    await supabaseClient.from('audit_logs').insert({
      user_id: donor_id,
      action: 'tribe_donation',
      entity_type: 'tribe',
      entity_id: tribe_id,
      details: { amount, currency, is_anonymous, transaction_id: txId },
    })

    return new Response(
      JSON.stringify({ success: true, transaction_id: txId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
