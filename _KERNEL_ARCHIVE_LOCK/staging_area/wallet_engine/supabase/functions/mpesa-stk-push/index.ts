import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DARAJA_BASE = 'https://api.safaricom.co.ke'
const SANDBOX_BASE = 'https://sandbox.safaricom.co.ke'

function getBaseUrl(isSandbox: boolean) {
  return isSandbox ? SANDBOX_BASE : DARAJA_BASE
}

async function getAccessToken(consumerKey: string, consumerSecret: string, isSandbox: boolean) {
  const auth = btoa(`${consumerKey}:${consumerSecret}`)
  const res = await fetch(`${getBaseUrl(isSandbox)}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` }
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`Auth failed: ${JSON.stringify(data)}`)
  return data.access_token
}

function getTimestamp(): string {
  const now = new Date()
  return now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')
}

function getPassword(shortcode: string, passkey: string, timestamp: string): string {
  return btoa(`${shortcode}${passkey}${timestamp}`)
}

function formatPhone(phone: string): string {
  let p = phone.replace(/\s/g, '').replace(/\+/g, '')
  if (p.startsWith('0')) p = '254' + p.slice(1)
  if (p.startsWith('7')) p = '254' + p
  if (p.startsWith('1')) p = '254' + p
  if (!p.startsWith('254')) throw new Error('Invalid phone. Use 07XX, 01XX, or 254XXX')
  return p
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { phone, amount, userId, walletId, description = 'Wallet Top-up', isSandbox = false } = await req.json()

    if (!phone || !amount || !userId) {
      return new Response(JSON.stringify({ error: 'Missing phone, amount, or userId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const consumerKey = Deno.env.get(isSandbox ? 'MPESA_SANDBOX_CONSUMER_KEY' : 'MPESA_CONSUMER_KEY')
    const consumerSecret = Deno.env.get(isSandbox ? 'MPESA_SANDBOX_CONSUMER_SECRET' : 'MPESA_CONSUMER_SECRET')
    const shortcode = Deno.env.get(isSandbox ? 'MPESA_SANDBOX_SHORTCODE' : 'MPESA_SHORTCODE')
    const passkey = Deno.env.get(isSandbox ? 'MPESA_SANDBOX_PASSKEY' : 'MPESA_PASSKEY')
    const callbackUrl = Deno.env.get('MPESA_CALLBACK_URL')

    if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackUrl) {
      return new Response(JSON.stringify({ error: 'M-Pesa credentials not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = await getAccessToken(consumerKey, consumerSecret, isSandbox)
    const timestamp = getTimestamp()
    const password = getPassword(shortcode, passkey, timestamp)
    const formattedPhone = formatPhone(phone)
    const accountRef = `WLT${walletId?.slice(0, 8) || userId.slice(0, 8)}`

    const stkRes = await fetch(`${getBaseUrl(isSandbox)}/mpesa/stkpush/v3/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerBuyGoodsOnline',
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: accountRef,
        TransactionDesc: description
      })
    })

    const stkData = await stkRes.json()

    if (stkData.errorCode) {
      return new Response(JSON.stringify({ error: stkData.errorMessage || 'STK Push failed' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: tx, error: txError } = await supabase.from('app_transactions').insert({
      user_id: userId,
      wallet_id: walletId,
      amount: amount,
      type: 'credit',
      status: 'pending',
      payment_method: 'mpesa_stk',
      description: `M-Pesa STK: ${description}`,
      external_ref: stkData.CheckoutRequestID,
      metadata: {
        merchant_request_id: stkData.MerchantRequestID,
        checkout_request_id: stkData.CheckoutRequestID,
        phone: formattedPhone,
        till_number: shortcode,
        raw_response: stkData
      }
    }).select().single()

    if (txError) throw txError

    return new Response(JSON.stringify({
      success: true,
      checkoutRequestId: stkData.CheckoutRequestID,
      merchantRequestId: stkData.MerchantRequestID,
      transactionId: tx.id,
      message: 'STK Push sent. Check your phone to complete payment.'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
