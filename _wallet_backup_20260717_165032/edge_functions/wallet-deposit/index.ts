// Edge Function: wallet-deposit
// Unified deposit handler: M-Pesa STK, Card, Bank, Crypto
// Multi-country support — flagship Kenya (M-Pesa)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DepositRequest {
  user_id: string
  amount: number
  currency: string
  method: 'mpesa' | 'card' | 'bank' | 'crypto'
  phone_number?: string
  card_token?: string
  bank_account?: {
    bank_name: string
    account_number: string
    account_name: string
  }
  crypto_address?: string
  crypto_network?: string
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

    const {
      user_id,
      amount,
      currency,
      method,
      phone_number,
      card_token,
      bank_account,
      crypto_address,
      crypto_network,
      metadata,
    }: DepositRequest = await req.json()

    // ─── VALIDATION ───
    if (!user_id || !amount || amount <= 0 || !currency || !method) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields', code: 'INVALID_REQUEST' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (amount < 10) {
      return new Response(
        JSON.stringify({ error: 'Minimum deposit is 10', code: 'MIN_AMOUNT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── GET WALLET ───
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('id, balance, available_balance, currency, status, wallet_type')
      .eq('user_id', user_id)
      .eq('is_default', true)
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

    const depositId = crypto.randomUUID()
    const reference = `DEP_${method.toUpperCase()}_${user_id.slice(0, 8)}_${Date.now()}`

    // ─── CREATE PENDING DEPOSIT RECORD ───
    await supabaseClient.from('wallet_deposits').insert({
      id: depositId,
      user_id,
      wallet_id: wallet.id,
      amount,
      currency,
      provider_name: method,
      channel: method,
      status: 'pending',
      external_reference: reference,
      requested_by: user_id,
      requested_at: new Date().toISOString(),
      metadata: {
        ...metadata,
        phone_number: phone_number || null,
        bank_account: bank_account || null,
        crypto_address: crypto_address || null,
        crypto_network: crypto_network || null,
        user_agent: req.headers.get('user-agent'),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown',
      },
    })

    // ─── METHOD-SPECIFIC HANDLING ───
    let result: any = {}

    switch (method) {
      case 'mpesa': {
        if (!phone_number) {
          return new Response(
            JSON.stringify({ error: 'Phone number required for M-Pesa', code: 'PHONE_REQUIRED' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Call M-Pesa STK Push edge function internally
        const stkRes = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-stk-push`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone: phone_number, amount }),
          }
        )

        const stkData = await stkRes.json()

        if (!stkData.success) {
          await supabaseClient.from('wallet_deposits')
            .update({ status: 'failed', failure_reason: stkData.error, failed_at: new Date().toISOString(), failed_by: user_id })
            .eq('id', depositId)

          return new Response(
            JSON.stringify({ error: stkData.error, code: 'STK_FAILED', detail: stkData }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update deposit with STK reference
        await supabaseClient.from('wallet_deposits')
          .update({
            status: 'processing',
            processing_at: new Date().toISOString(),
            processed_by: user_id,
            external_reference: stkData.checkoutRequestID || reference,
            metadata: {
              checkoutRequestID: stkData.checkoutRequestID,
              merchantRequestID: stkData.merchantRequestID,
              responseDescription: stkData.message,
            },
          })
          .eq('id', depositId)

        result = {
          checkoutRequestID: stkData.checkoutRequestID,
          merchantRequestID: stkData.merchantRequestID,
          message: stkData.message || 'STK Push sent to your phone. Enter PIN to complete.',
        }
        break
      }

      case 'card': {
        // TODO: Integrate Stripe/Paystack for card payments
        result = {
          message: 'Card payment integration coming soon. Use M-Pesa for now.',
          redirect_url: null,
        }
        break
      }

      case 'bank': {
        // Return bank transfer instructions
        const bankInstructions = {
          bank_name: 'KCB Bank',
          account_name: 'MTAA Wallet Ltd',
          account_number: '1234567890',
          branch_code: '001',
          reference: reference,
          instructions: `Transfer ${currency} ${amount} to the above account. Use ${reference} as the reference. Funds will reflect within 1-24 hours.`,
        }

        await supabaseClient.from('wallet_deposits')
          .update({
            status: 'awaiting_bank_transfer',
            metadata: { bank_instructions: bankInstructions },
          })
          .eq('id', depositId)

        result = {
          instructions: bankInstructions,
          message: 'Please complete the bank transfer using the provided details.',
        }
        break
      }

      case 'crypto': {
        // Return crypto deposit address
        const cryptoAddress = 'TYvQ...x9Z2' // TODO: Generate real address from crypto wallet
        const cryptoInstructions = {
          network: crypto_network || 'USDT (TRC20)',
          address: crypto_address || cryptoAddress,
          min_deposit: 10,
          confirmations_required: 12,
          reference: reference,
          instructions: `Send ${amount} USDT to the above address on ${crypto_network || 'TRC20'} network. Funds will reflect after ${12} confirmations.`,
        }

        await supabaseClient.from('wallet_deposits')
          .update({
            status: 'awaiting_crypto_transfer',
            metadata: { crypto_instructions: cryptoInstructions },
          })
          .eq('id', depositId)

        result = {
          instructions: cryptoInstructions,
          message: 'Please send crypto to the provided address.',
        }
        break
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown deposit method', code: 'UNKNOWN_METHOD' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // ─── EVENT LOG ───
    await supabaseClient.from('wallet_deposit_events').insert({
      deposit_id: depositId,
      actor_user_id: user_id,
      event_type: 'deposit_initiated',
      note: `Deposit of ${currency} ${amount} via ${method} initiated`,
      metadata: { reference, amount, currency, method, ...result },
    })

    // ─── RECEIPT PREVIEW (will be finalized on callback) ───
    // wallet_receipts schema: id, reference, user_id (text), phone (text), amount (numeric), status (text), receipt_code (text), meta (jsonb), created_at
    await supabaseClient.from('wallet_receipts').insert({
      reference,
      user_id: user_id,  // text type in schema
      phone: phone_number || '',
      amount,
      status: 'pending',
      receipt_code: `RCP-${Date.now()}`,
      meta: {
        deposit_id: depositId,
        method,
        currency,
        wallet_id: wallet.id,
        preview: true,
        ...result,
      },
    })

    // ─── NOTIFICATION ───
    await supabaseClient.from('wallet_notifications').insert({
      user_id,
      title: 'Deposit Initiated',
      message: `Your ${method.toUpperCase()} deposit of ${currency} ${amount} is being processed.`,
      type: 'deposit_initiated',
    })

    return new Response(
      JSON.stringify({
        success: true,
        deposit_id: depositId,
        reference,
        status: method === 'mpesa' ? 'processing' : 'pending',
        amount,
        currency,
        method,
        ...result,
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
