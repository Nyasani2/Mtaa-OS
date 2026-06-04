import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// M-Pesa / Daraja Configuration
const MPESA_CONFIG = {
  // Production credentials - Till Number
  PRODUCTION_SHORTCODE: '9767587',
  STORE_NUMBER: '7840528',

  // Sandbox credentials (for testing)
  SANDBOX_SHORTCODE: '174379',

  // API endpoints
  SANDBOX_BASE_URL: 'https://sandbox.safaricom.co.ke',
  PRODUCTION_BASE_URL: 'https://api.safaricom.co.ke',

  AUTH_URL: '/oauth/v1/generate?grant_type=client_credentials',
  STK_PUSH_URL: '/mpesa/stkpush/v1/processrequest',

  // Transaction type
  TRANSACTION_TYPE: 'CustomerPayBillOnline',
}

function getBaseUrl(): string {
  const env = Deno.env.get('MPESA_ENV') || 'sandbox'
  return env === 'production' 
    ? MPESA_CONFIG.PRODUCTION_BASE_URL 
    : MPESA_CONFIG.SANDBOX_BASE_URL
}

function getShortcode(): string {
  // Priority: env var > production till > sandbox fallback
  return Deno.env.get('MPESA_SHORTCODE') 
    || MPESA_CONFIG.PRODUCTION_SHORTCODE 
    || MPESA_CONFIG.SANDBOX_SHORTCODE
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, amount, accountReference, transactionDesc, userId } = await req.json()

    // Validate required fields
    if (!phone || !amount) {
      return new Response(
        JSON.stringify({ error: 'Phone and amount are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get credentials from environment
    const CONSUMER_KEY = Deno.env.get('MPESA_CONSUMER_KEY')
    const CONSUMER_SECRET = Deno.env.get('MPESA_CONSUMER_SECRET')
    const PASSKEY = Deno.env.get('MPESA_PASSKEY')
    const SHORTCODE = getShortcode()
    const CALLBACK_URL = Deno.env.get('MPESA_CALLBACK_URL') || 
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/daraja-till-callback`

    // Check credentials
    if (!CONSUMER_KEY || !CONSUMER_SECRET || !PASSKEY) {
      return new Response(
        JSON.stringify({ 
          error: 'M-Pesa credentials not configured',
          details: 'Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, and MPESA_PASSKEY environment variables'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const baseUrl = getBaseUrl()

    // Step 1: Get OAuth token
    const authString = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`)
    const authResponse = await fetch(`${baseUrl}${MPESA_CONFIG.AUTH_URL}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${authString}`,
      },
    })

    if (!authResponse.ok) {
      const authError = await authResponse.text()
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: authError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authData = await authResponse.json()
    const accessToken = authData.access_token

    // Step 2: Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
    const passwordString = `${SHORTCODE}${PASSKEY}${timestamp}`
    const password = btoa(passwordString)

    // Step 3: Format phone number
    let formattedPhone = phone.replace(/^\+/, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1)
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone
    }

    // Step 4: Build STK push payload
    const stkPayload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: MPESA_CONFIG.TRANSACTION_TYPE,
      Amount: Math.round(parseFloat(amount)),
      PartyA: formattedPhone,
      PartyB: SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: accountReference || 'MTAA-WALLET',
      TransactionDesc: transactionDesc || 'MTAA Wallet Deposit',
    }

    // Step 5: Make STK push request
    const stkResponse = await fetch(`${baseUrl}${MPESA_CONFIG.STK_PUSH_URL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    })

    const stkData = await stkResponse.json()

    if (!stkResponse.ok || stkData.ResponseCode !== '0') {
      return new Response(
        JSON.stringify({
          error: 'STK push failed',
          responseCode: stkData.ResponseCode,
          responseDescription: stkData.ResponseDescription,
          merchantRequestID: stkData.MerchantRequestID,
          checkoutRequestID: stkData.CheckoutRequestID,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 6: Log transaction to database (optional)
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

      if (supabaseUrl && supabaseServiceKey && userId) {
        await fetch(`${supabaseUrl}/rest/v1/wallet_transactions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
          },
          body: JSON.stringify({
            user_id: userId,
            type: 'deposit',
            amount: parseFloat(amount),
            currency: 'KES',
            status: 'pending',
            description: `M-Pesa STK push - ${stkData.CheckoutRequestID}`,
            reference_id: stkData.CheckoutRequestID,
            reference_type: 'mpesa_stk',
            metadata: {
              merchantRequestID: stkData.MerchantRequestID,
              checkoutRequestID: stkData.CheckoutRequestID,
              phone: formattedPhone,
              shortcode: SHORTCODE,
            },
          }),
        })
      }
    } catch (logError) {
      console.error('Failed to log transaction:', logError)
      // Non-critical, continue
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        status: 'PENDING',
        merchantRequestID: stkData.MerchantRequestID,
        checkoutRequestID: stkData.CheckoutRequestID,
        responseCode: stkData.ResponseCode,
        responseDescription: stkData.ResponseDescription,
        customerMessage: stkData.CustomerMessage,
        shortcode: SHORTCODE,
        phone: formattedPhone,
        amount: amount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('MPESA STK ERROR:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
