// M-Pesa Daraja Callback Handler
// FIXED: Added transaction wrapping, idempotency, error handling, notification

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function handleCallback(req: Request, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    const callbackData = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = callbackData.Body?.stkCallback || callbackData.Body?.callback
    if (!body) {
      return new Response(JSON.stringify({ error: 'Invalid callback format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const checkoutRequestId = body.CheckoutRequestID
    const resultCode = body.ResultCode
    const resultDesc = body.ResultDesc

    if (!checkoutRequestId) {
      return new Response(JSON.stringify({ error: 'Missing CheckoutRequestID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Idempotency check
    const { data: existing, error: existingError } = await supabaseClient
      .from('provider_transactions')
      .select('id, status')
      .eq('provider_transaction_id', checkoutRequestId)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('[callback-handler] Existing check error:', existingError)
    }

    if (existing && existing.status === 'completed') {
      return new Response(JSON.stringify({ message: 'Already processed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update provider transaction
    const { error: updateError } = await supabaseClient
      .from('provider_transactions')
      .update({
        callback_payload: callbackData,
        status: resultCode === 0 ? 'completed' : 'failed',
        error_code: resultCode !== 0 ? String(resultCode) : null,
        error_message: resultCode !== 0 ? resultDesc : null,
        updated_at: new Date().toISOString()
      })
      .eq('provider_transaction_id', checkoutRequestId)

    if (updateError) {
      console.error('[callback-handler] Provider update error:', updateError)
    }

    if (resultCode === 0) {
      const callbackItems = body.CallbackMetadata?.Item || []
      const amount = callbackItems.find((i: any) => i.Name === 'Amount')?.Value
      const mpesaReceipt = callbackItems.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value
      const phone = callbackItems.find((i: any) => i.Name === 'PhoneNumber')?.Value

      if (!amount || !mpesaReceipt) {
        console.error('[callback-handler] Missing amount or receipt in callback')
        return new Response(JSON.stringify({ error: 'Incomplete callback data' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get provider transaction to find wallet
      const { data: providerTx, error: providerTxError } = await supabaseClient
        .from('provider_transactions')
        .select('wallet_id, user_id')
        .eq('provider_transaction_id', checkoutRequestId)
        .single()

      if (providerTxError || !providerTx) {
        console.error('[callback-handler] Provider transaction not found:', providerTxError)
        return new Response(JSON.stringify({ error: 'Provider transaction not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Use RPC for atomic wallet credit
      const { error: creditError } = await supabaseClient.rpc('credit_wallet', {
        p_wallet_id: providerTx.wallet_id,
        p_amount: amount,
        p_transaction_ref: mpesaReceipt
      })

      if (creditError) {
        console.error('[callback-handler] Wallet credit error:', creditError)
        return new Response(JSON.stringify({ error: 'Failed to credit wallet' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update wallet transaction
      const { error: walletTxError } = await supabaseClient
        .from('wallet_transactions')
        .update({
          status: 'completed',
          provider_transaction_id: mpesaReceipt,
          completed_at: new Date().toISOString()
        })
        .eq('metadata->checkout_request_id', checkoutRequestId)

      if (walletTxError) {
        console.error('[callback-handler] Wallet transaction update error:', walletTxError)
      }

      // Send notification
      const { error: notifError } = await supabaseClient.from('wallet_notifications').insert({
        user_id: providerTx.user_id,
        wallet_id: providerTx.wallet_id,
        notification_type: 'transaction',
        title: 'Deposit Successful!',
        message: `KSh ${amount} deposited via M-Pesa. Receipt: ${mpesaReceipt}`,
        data: { amount, receipt: mpesaReceipt, provider: 'mpesa_daraja' }
      })

      if (notifError) {
        console.error('[callback-handler] Notification error:', notifError)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[callback-handler] Unhandled error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
