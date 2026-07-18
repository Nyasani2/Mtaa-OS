// M-Pesa Daraja Callback Handler

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

    const { data: existing } = await supabaseClient
      .from('provider_transactions')
      .select('*')
      .eq('provider_transaction_id', checkoutRequestId)
      .single()

    if (existing && existing.status === 'completed') {
      return new Response(JSON.stringify({ message: 'Already processed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    await supabaseClient
      .from('provider_transactions')
      .update({
        callback_payload: callbackData,
        status: resultCode === 0 ? 'completed' : 'failed',
        error_code: resultCode !== 0 ? String(resultCode) : null,
        error_message: resultCode !== 0 ? resultDesc : null,
        updated_at: new Date().toISOString()
      })
      .eq('provider_transaction_id', checkoutRequestId)

    if (resultCode === 0) {
      const callbackItems = body.CallbackMetadata?.Item || []
      const amount = callbackItems.find((i: any) => i.Name === 'Amount')?.Value
      const mpesaReceipt = callbackItems.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value
      const phone = callbackItems.find((i: any) => i.Name === 'PhoneNumber')?.Value

      const { data: providerTx } = await supabaseClient
        .from('provider_transactions')
        .select('*')
        .eq('provider_transaction_id', checkoutRequestId)
        .single()

      if (providerTx?.wallet_transaction_id) {
        await supabaseClient
          .from('wallet_transactions')
          .update({
            status: 'completed',
            provider_transaction_id: mpesaReceipt,
            completed_at: new Date().toISOString()
          })
          .eq('id', providerTx.wallet_transaction_id)

        const { data: walletTx } = await supabaseClient
          .from('wallet_transactions')
          .select('*')
          .eq('id', providerTx.wallet_transaction_id)
          .single()

        if (walletTx) {
          const { data: wallet } = await supabaseClient
            .from('wallets')
            .select('*')
            .eq('id', walletTx.wallet_id)
            .single()

          if (wallet) {
            await supabaseClient
              .from('wallets')
              .update({
                available_balance: wallet.available_balance + amount,
                total_incoming: wallet.total_incoming + amount
              })
              .eq('id', wallet.id)

            await supabaseClient.from('wallet_notifications').insert({
              user_id: wallet.user_id,
              wallet_id: wallet.id,
              notification_type: 'transaction',
              title: 'Deposit Successful!',
              message: `KSh ${amount} deposited via M-Pesa. Receipt: ${mpesaReceipt}`,
              data: { amount, receipt: mpesaReceipt }
            })
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
