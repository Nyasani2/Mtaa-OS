import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    console.log('M-Pesa callback:', JSON.stringify(body))

    const callback = body.Body?.stkCallback
    if (!callback) {
      return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: 'Invalid callback' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const checkoutRequestId = callback.CheckoutRequestID
    const resultCode = callback.ResultCode
    const resultDesc = callback.ResultDesc

    const { data: pendingTx } = await supabase
      .from('app_transactions')
      .select('*')
      .eq('external_ref', checkoutRequestId)
      .eq('status', 'pending')
      .single()

    if (!pendingTx) {
      console.log('No pending transaction for:', checkoutRequestId)
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (resultCode === 0) {
      const items = callback.CallbackMetadata?.Item || []
      const getValue = (name: string) => items.find((i: any) => i.Name === name)?.Value

      const mpesaReceipt = getValue('MpesaReceiptNumber')
      const transactionDate = getValue('TransactionDate')
      const phone = getValue('PhoneNumber')
      const amount = getValue('Amount')

      await supabase.from('app_transactions').update({
        status: 'completed',
        description: `M-Pesa: ${mpesaReceipt}`,
        metadata: {
          ...pendingTx.metadata,
          mpesa_receipt: mpesaReceipt,
          transaction_date: transactionDate,
          phone,
          raw_callback: body
        }
      }).eq('id', pendingTx.id)

      await supabase.rpc('credit_wallet', {
        p_wallet_id: pendingTx.wallet_id,
        p_amount: amount || pendingTx.amount,
        p_transaction_id: pendingTx.id,
        p_description: `M-Pesa deposit: ${mpesaReceipt}`
      })

      console.log('Wallet credited:', pendingTx.wallet_id, amount)
    } else {
      await supabase.from('app_transactions').update({
        status: 'failed',
        description: `M-Pesa failed: ${resultDesc}`,
        metadata: {
          ...pendingTx.metadata,
          failure_reason: resultDesc,
          raw_callback: body
        }
      }).eq('id', pendingTx.id)
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error('Callback error:', err)
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
