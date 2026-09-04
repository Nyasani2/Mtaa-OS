import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WithdrawRequest {
  user_id: string
  amount: number
  currency: string
  method: 'bank_transfer' | 'mobile_money' | 'crypto'
  destination: {
    bank_name?: string
    account_number?: string
    account_name?: string
    branch_code?: string
    mobile_network?: string
    phone_number?: string
    crypto_address?: string
    crypto_network?: string
  }
  metadata?: Record<string, any>
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

    const { user_id, amount, currency, method, destination, metadata }: WithdrawRequest = await req.json()

    // ─── VALIDATION ───
    if (!user_id || !amount || amount <= 0 || !currency || !method || !destination) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields', code: 'INVALID_REQUEST' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (amount < 100) {
      return new Response(
        JSON.stringify({ error: 'Minimum withdrawal is 100', code: 'MIN_AMOUNT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── KYC CHECK ───
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('kyc_level, kyc_verified_at, first_name, last_name')
      .eq('id', user_id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found', code: 'PROFILE_MISSING' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (profile.kyc_level < 2) {
      return new Response(
        JSON.stringify({ 
          error: 'KYC Level 2 required for withdrawals', 
          code: 'KYC_INSUFFICIENT',
          current_level: profile.kyc_level,
          required_level: 2
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── BALANCE CHECK ───
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('id, balance, currency, status')
      .eq('user_id', user_id)
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
        JSON.stringify({ error: 'Wallet is frozen or suspended', code: 'WALLET_FROZEN' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── FEE CALCULATION ───
    const feeRates: Record<string, number> = {
      bank_transfer: 0.015,      // 1.5%
      mobile_money: 0.02,        // 2%
      crypto: 0.01,              // 1%
    }
    const feeRate = feeRates[method] ?? 0.02
    const platformFee = Math.round(amount * feeRate * 100) / 100
    const netAmount = amount - platformFee

    const minFees: Record<string, number> = {
      bank_transfer: 50,
      mobile_money: 20,
      crypto: 100,
    }
    const minFee = minFees[method] ?? 50
    const finalFee = Math.max(platformFee, minFee)
    const finalNet = amount - finalFee

    if (finalNet <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount too small after fees', code: 'AMOUNT_TOO_SMALL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (wallet.balance < amount) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient balance', 
          code: 'INSUFFICIENT_FUNDS',
          balance: wallet.balance,
          requested: amount
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── DAILY LIMIT CHECK ───
    const today = new Date().toISOString().split('T')[0]
    const { data: dailyWithdrawals } = await supabaseClient
      .from('transactions')
      .select('amount')
      .eq('user_id', user_id)
      .eq('type', 'withdrawal')
      .eq('status', 'completed')
      .gte('created_at', `${today}T00:00:00Z`)

    const dailyTotal = (dailyWithdrawals || []).reduce((sum, t) => sum + (t.amount || 0), 0)
    const dailyLimit = 500000 // 500,000 per day

    if (dailyTotal + amount > dailyLimit) {
      return new Response(
        JSON.stringify({ 
          error: 'Daily withdrawal limit exceeded', 
          code: 'DAILY_LIMIT',
          limit: dailyLimit,
          used: dailyTotal,
          remaining: dailyLimit - dailyTotal
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── CREATE WITHDRAWAL TRANSACTION ───
    const transactionId = crypto.randomUUID()
    const { data: transaction, error: txError } = await supabaseClient
      .from('transactions')
      .insert({
        id: transactionId,
        user_id: user_id,
        wallet_id: wallet.id,
        type: 'withdrawal',
        amount: amount,
        currency: currency,
        fee: finalFee,
        net_amount: finalNet,
        status: 'pending',
        method: method,
        destination: destination,
        metadata: {
          ...metadata,
          kyc_level: profile.kyc_level,
          daily_total_before: dailyTotal,
          platform_fee_rate: feeRate,
        },
        description: `Withdrawal via ${method.replace('_', ' ')}`,
      })
      .select()
      .single()

    if (txError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction', code: 'TX_CREATE_FAILED', detail: txError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── RESERVE FUNDS (debit wallet, credit escrow) ───
    const { error: reserveError } = await supabaseClient.rpc('reserve_withdrawal_funds', {
      p_wallet_id: wallet.id,
      p_amount: amount,
      p_transaction_id: transactionId,
    })

    if (reserveError) {
      // Rollback transaction status
      await supabaseClient
        .from('transactions')
        .update({ status: 'failed', metadata: { ...transaction.metadata, fail_reason: reserveError.message } })
        .eq('id', transactionId)

      return new Response(
        JSON.stringify({ error: 'Failed to reserve funds', code: 'RESERVE_FAILED', detail: reserveError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── AUDIT LOG ───
    await supabaseClient.from('audit_logs').insert({
      user_id: user_id,
      action: 'withdrawal_requested',
      entity_type: 'transaction',
      entity_id: transactionId,
      details: {
        amount,
        currency,
        method,
        fee: finalFee,
        net_amount: finalNet,
        destination,
      },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown',
    })

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transactionId,
        status: 'pending',
        amount,
        fee: finalFee,
        net_amount: finalNet,
        currency,
        method,
        message: 'Withdrawal request submitted. Processing typically takes 1-24 hours.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR', detail: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
