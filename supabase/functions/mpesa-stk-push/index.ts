/**
 * MTAA OS — MPESA STK PUSH (Fixed for Deno.serve)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Validate request body exists
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Content-Type must be application/json' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let body
    try {
      body = await req.json()
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON body: ' + (e as Error).message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { phone, amount } = body

    if (!phone || !amount) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing phone or amount' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 🔐 1. VERIFY AUTH USER
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    let user_id = (body as any).user_id as string | undefined
    if (token !== Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      const { data: userData, error: userError } = await supabase.auth.getUser(token)
      if (userError || !userData?.user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized user' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }
      user_id = userData.user.id
    }
    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing user' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 🧠 2. GENERATE SAFE REFERENCE
    const reference = `MPESA_${user_id}_${Date.now()}`

    // 💳 3. GET WALLET
    const { data: wrows } = await supabase
      .from('wallet_accounts')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: true })
      .limit(1)
    const wallet = wrows && wrows[0]

    if (!wallet) {
      return new Response(
        JSON.stringify({ success: false, error: 'Wallet not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 📌 4. CREATE PENDING TRANSACTION
    await supabase.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      user_id,
      transaction_type: 'deposit',
      direction: 'credit',
      amount,
      currency: 'KES',
      balance_after: wallet.balance,
      status: 'PENDING',
      reference,
      description: 'MPESA STK Push',
      metadata: { phone },
    })

    // 🔑 5. MPESA CREDENTIALS
    const CONSUMER_KEY = Deno.env.get('MPESA_CONSUMER_KEY')
    const CONSUMER_SECRET = Deno.env.get('MPESA_CONSUMER_SECRET')
    const PASSKEY = Deno.env.get('MPESA_PASSKEY')
    const SHORTCODE = Deno.env.get('MPESA_SHORTCODE')
    const CALLBACK_URL = Deno.env.get('MPESA_CALLBACK_URL')
    const MPESA_ENV = Deno.env.get('MPESA_ENV') || 'sandbox'

    if (!CONSUMER_KEY || !CONSUMER_SECRET || !PASSKEY || !SHORTCODE) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing MPESA credentials' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`)
    const baseUrl = MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke'

    const tokenRes = await fetch(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${auth}` } }
    )

    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get MPESA access token', details: tokenData }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    const access_token = tokenData.access_token

    // ⏱ 6. TIMESTAMP
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, '')
      .slice(0, 14)

    const password = btoa(SHORTCODE + PASSKEY + timestamp)

    // 🚀 7. STK PUSH
    const stkRes = await fetch(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amount,
          PartyA: phone,
          PartyB: SHORTCODE,
          PhoneNumber: phone,
          CallBackURL: CALLBACK_URL,
          AccountReference: reference,
          TransactionDesc: 'MTAA Wallet Topup',
        }),
      }
    )

    const stkData = await stkRes.json()

    // 🔗 8. LINK CALLBACK ID TO TRANSACTION
    await supabase
      .from('wallet_transactions')
      .update({
        metadata: {
          checkoutRequestID: stkData.CheckoutRequestID,
          merchantRequestID: stkData.MerchantRequestID,
          responseCode: stkData.ResponseCode,
          responseDescription: stkData.ResponseDescription,
        },
      })
      .eq('reference', reference)

    return new Response(
      JSON.stringify({
        success: stkData.ResponseCode === '0',
        reference,
        checkoutRequestID: stkData.CheckoutRequestID,
        merchantRequestID: stkData.MerchantRequestID,
        message: stkData.ResponseDescription,
        data: stkData,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Unknown error',
        stack: err?.stack,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
