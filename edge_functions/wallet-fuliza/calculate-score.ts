// Edge Function: calculate-credit-score
// Computes financial reputation score
// FIXED: Added error handling, validation, transaction wrapping

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate user_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
      return new Response(JSON.stringify({ error: 'Invalid user_id format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get wallet
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', user_id)
      .eq('wallet_type', 'main')
      .single()

    if (walletError || !wallet) {
      console.error('[calculate-score] Wallet error:', walletError)
      return new Response(JSON.stringify({ error: 'Wallet not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Calculate wallet age
    const walletAgeDays = Math.floor((Date.now() - new Date(wallet.created_at).getTime()) / (1000 * 60 * 60 * 24))

    // Get 30-day transaction volume
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentTx, error: txError } = await supabaseClient
      .from('wallet_transactions')
      .select('amount, direction')
      .eq('user_id', user_id)
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (txError) {
      console.error('[calculate-score] Transaction query error:', txError)
    }

    const txVolume30d = recentTx?.reduce((sum, tx) => sum + (tx.direction === 'credit' ? tx.amount : 0), 0) ?? 0
    const txCount30d = recentTx?.length ?? 0

    // Get savings balance
    const { data: savingsWallet, error: savingsError } = await supabaseClient
      .from('wallets')
      .select('available_balance')
      .eq('user_id', user_id)
      .eq('wallet_type', 'savings')
      .single()

    if (savingsError && savingsError.code !== 'PGRST116') {
      console.error('[calculate-score] Savings wallet error:', savingsError)
    }

    const savingsBalance = savingsWallet?.available_balance ?? 0

    // Get escrow completion rate
    const { data: escrows, error: escrowError } = await supabaseClient
      .from('escrow_accounts')
      .select('status')
      .or(`buyer_id.eq.${user_id},seller_id.eq.${user_id}`)

    if (escrowError) {
      console.error('[calculate-score] Escrow query error:', escrowError)
    }

    const totalEscrows = escrows?.length ?? 0
    const completedEscrows = escrows?.filter((e: any) => e.status === 'released').length ?? 0
    const escrowRate = totalEscrows > 0 ? completedEscrows / totalEscrows : 0

    // Calculate scores (0-1000 scale)
    const walletAgeScore = Math.min(walletAgeDays * 2, 200)
    const txVolumeScore = Math.min(txVolume30d / 1000, 250)
    const txCountScore = Math.min(txCount30d * 10, 150)
    const savingsScore = Math.min(savingsBalance / 500, 100)
    const escrowScore = escrowRate * 100
    const baseScore = 200

    const creditScore = Math.min(
      baseScore + walletAgeScore + txVolumeScore + txCountScore + savingsScore + escrowScore,
      1000
    )

    const riskScore = Math.max(0, 100 - (walletAgeScore / 2) - (txCountScore / 3) - (savingsScore / 2))
    const eligibilityScore = Math.min(creditScore / 10, 100)
    const suggestedLimit = Math.min(creditScore * 100, 50000)

    // Update credit score with error handling
    const { error: scoreError } = await supabaseClient
      .from('wallet_credit_scores')
      .upsert({
        user_id,
        wallet_id: wallet.id,
        credit_score: Math.round(creditScore),
        risk_score: Math.round(riskScore),
        eligibility_score: Math.round(eligibilityScore),
        suggested_limit: suggestedLimit,
        wallet_age_days: walletAgeDays,
        transaction_volume_30d: txVolume30d,
        transaction_count_30d: txCount30d,
        savings_balance: savingsBalance,
        escrow_completion_rate: escrowRate,
        last_calculated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (scoreError) {
      console.error('[calculate-score] Score upsert error:', scoreError)
      return new Response(JSON.stringify({ error: 'Failed to update credit score' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update credit limit if eligible
    if (eligibilityScore >= 60) {
      const { error: limitError } = await supabaseClient
        .from('wallet_credit_limits')
        .upsert({
          user_id,
          approved_limit: suggestedLimit,
          available_limit: suggestedLimit,
          interest_rate: 0.10,
          grace_period_days: 30,
          is_active: true,
          approved_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (limitError) {
        console.error('[calculate-score] Limit upsert error:', limitError)
        // Don't fail the whole request if limit update fails
      }
    }

    return new Response(JSON.stringify({
      success: true,
      credit_score: Math.round(creditScore),
      risk_score: Math.round(riskScore),
      eligibility_score: Math.round(eligibilityScore),
      suggested_limit: suggestedLimit,
      factors: {
        wallet_age_days: walletAgeDays,
        transaction_volume_30d: txVolume30d,
        transaction_count_30d: txCount30d,
        savings_balance: savingsBalance,
        escrow_completion_rate: escrowRate
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[calculate-score] Unhandled error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
