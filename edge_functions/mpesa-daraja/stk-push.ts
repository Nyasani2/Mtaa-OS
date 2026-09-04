// M-Pesa Daraja 3.0 STK Push Handler
// FIXED: Added validation, error handling, wallet transaction creation

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MPESA_CONFIG = {
  sandbox: {
    baseUrl: 'https://sandbox.safaricom.co.ke',
    consumerKey: Deno.env.get('MPESA_CONSUMER_KEY') ?? '',
    consumerSecret: Deno.env.get('MPESA_CONSUMER_SECRET') ?? '',
    shortCode: Deno.env.get('MPESA_SHORT_CODE') ?? '174379',
    passkey: Deno.env.get('MPESA_PASSKEY') ?? '',
    callbackUrl: Deno.env.get('MPESA_CALLBACK_URL') ?? ''
  },
  production: {
    baseUrl: 'https://api.safaricom.co.ke',
    consumerKey: Deno.env.get('MPESA_CONSUMER_KEY_PROD') ?? '',
    consumerSecret: Deno.env.get('MPESA_CONSUMER_SECRET_PROD') ?? '',
    shortCode: Deno.env.get('MPESA_SHORT_CODE_PROD') ?? '',
    passkey: Deno.env.get('MPESA_PASSKEY_PROD') ?? '',
    callbackUrl: Deno.env.get('MPESA_CALLBACK_URL_PROD') ?? ''
  }
}

async function getAccessToken(isProduction: boolean): Promise<string> {
  const config = isProduction ? MPESA_CONFIG.production : MPESA_CONFIG.sandbox
  const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`)
  const response = await fetch(`${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` }
  })

  if (!response.ok) {
    throw new Error(`Failed to get M-Pesa access token: ${response.status}`)
  }

  const data = await response.json()
  if (!data.access_token) {
    throw new Error('No access token in M-Pesa response')
  }

  return data.access_token
}

function generatePassword(shortCode: string, passkey: string, timestamp: string): string {
  return btoa(`${shortCode}${passkey}${timestamp}`)
}

export async function handleStkPush(req: Request, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const {
      phone_number,
      amount,
      account_reference = 'MTAA Wallet',
      transaction_desc = 'Wallet Deposit',
      user_id,
      wallet_id,
      is_production = false
    } = await req.json()

    // Validation
    if (!phone_number || !amount || !user_id || !wallet_id) {
      return new Response(JSON.stringify({ error: 'phone_number, amount, user_id, wallet_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (amount <= 0) {
      return new Response(JSON.stringify({ error: 'Amount must be greater than 0' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (amount > 150000) {
      return new Response(JSON.stringify({ error: 'Amount exceeds M-Pesa limit of KES 150,000' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const config = is_production ? MPESA_CONFIG.production : MPESA_CONFIG.sandbox

    // Validate config
    if (!config.consumerKey || !config.consumerSecret || !config.passkey) {
      return new Response(JSON.stringify({ error: 'M-Pesa configuration incomplete' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const accessToken = await getAccessToken(is_production)

    const formattedPhone = phone_number.replace(/^\+?254/, '254').replace(/^0/, '254')
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password = generatePassword(config.shortCode, config.passkey, timestamp)

    const stkPayload = {
      BusinessShortCode: config.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: config.shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${config.callbackUrl}/callback`,
      AccountReference: account_reference.slice(0, 12),
      TransactionDesc: transaction_desc.slice(0, 13)
    }

    const response = await fetch(`${config.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkPayload)
    })

    const result = await response.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (result.ResponseCode === '0') {
      // Create provider transaction record
      const { error: providerError } = await supabase.from('provider_transactions').insert({
        provider_code: 'mpesa_daraja',
        provider_transaction_id: result.CheckoutRequestID,
        transaction_type: 'stk_push',
        user_id,
        wallet_id,
        amount,
        request_payload: stkPayload,
        response_payload: result,
        status: 'pending'
      })

      if (providerError) {
        console.error('[stk-push] Provider transaction error:', providerError)
      }

      // Create pending wallet transaction
      const { error: walletTxError } = await supabase.from('wallet_transactions').insert({
        wallet_id,
        user_id,
        transaction_type: 'deposit',
        direction: 'credit',
        amount,
        net_amount: amount,
        status: 'pending',
        description: `M-Pesa deposit via STK push`,
        metadata: {
          checkout_request_id: result.CheckoutRequestID,
          merchant_request_id: result.MerchantRequestID,
          phone_number: formattedPhone,
          provider: 'mpesa_daraja'
        }
      })

      if (walletTxError) {
        console.error('[stk-push] Wallet transaction error:', walletTxError)
      }

      return new Response(JSON.stringify({
        success: true,
        checkout_request_id: result.CheckoutRequestID,
        merchant_request_id: result.MerchantRequestID,
        response_description: result.ResponseDescription,
        message: 'STK push sent. Check your phone to complete payment.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } else {
      // Log failed attempt
      await supabase.from('provider_transactions').insert({
        provider_code: 'mpesa_daraja',
        transaction_type: 'stk_push',
        user_id,
        wallet_id,
        amount,
        request_payload: stkPayload,
        response_payload: result,
        status: 'failed',
        error_code: result.ResponseCode,
        error_message: result.ResponseDescription || result.errorMessage
      }).catch(err => console.error('[stk-push] Failed attempt log error:', err))

      return new Response(JSON.stringify({
        success: false,
        error_code: result.ResponseCode,
        error_message: result.ResponseDescription || result.errorMessage
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('[stk-push] Unhandled error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
