/**
 * MTAA OS — MPESA STK PUSH (HARD-LOCKED FINTECH VERSION)
 */

import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const {
      phone,
      amount,
    } = await req.json()

    // 🔐 1. VERIFY AUTH USER (DO NOT TRUST CLIENT USER_ID)
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token)

    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized user',
        }),
        { status: 401 }
      )
    }

    const user = userData.user
    const user_id = user.id

    // 🧠 2. GENERATE SAFE REFERENCE (SYSTEM CONTROLLED)
    const reference = `MPESA_${user_id}_${Date.now()}`

    // 💳 3. GET WALLET
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (!wallet) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Wallet not found',
        }),
        { status: 404 }
      )
    }

    // 📌 4. CREATE PENDING TRANSACTION (CRITICAL LINK)
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
      metadata: {
        phone,
      },
    })

    // 🔑 5. MPESA CREDENTIALS
    const CONSUMER_KEY = Deno.env.get('MPESA_CONSUMER_KEY')
    const CONSUMER_SECRET = Deno.env.get('MPESA_CONSUMER_SECRET')
    const PASSKEY = Deno.env.get('MPESA_PASSKEY')
    const SHORTCODE = Deno.env.get('MPESA_SHORTCODE')
    const CALLBACK_URL = Deno.env.get('MPESA_CALLBACK_URL')

    const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`)

    const tokenRes = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    )

    const tokenData = await tokenRes.json()
    const access_token = tokenData.access_token

    // ⏱ 6. TIMESTAMP
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, '')
      .slice(0, 14)

    const password = btoa(SHORTCODE + PASSKEY + timestamp)

    // 🚀 7. STK PUSH
    const stkRes = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
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
        },
      })
      .eq('reference', reference)

    return new Response(
      JSON.stringify({
        success: true,
        reference,
        checkoutRequestID: stkData.CheckoutRequestID,
        data: stkData,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
      }),
      { status: 500 }
    )
  }
})
