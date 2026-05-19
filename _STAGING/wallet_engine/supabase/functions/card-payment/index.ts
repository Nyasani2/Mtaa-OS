import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { amount, userId, walletId, cardToken, provider = 'stripe', currency = 'USD' } = await req.json()

    if (!amount || !userId || !cardToken) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
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
      payment_method: `card_${provider}`,
      description: `Card payment (${provider})`,
      metadata: { card_token: cardToken, currency }
    }).select().single()

    if (txError) throw txError

    // PRODUCTION: Replace with real Stripe/Paystack charge here
    // For now simulate success - integrate real provider before launch
    const paymentSuccess = true

    if (paymentSuccess) {
      await supabase.from('app_transactions').update({
        status: 'completed',
        description: `Card payment completed`,
        external_ref: `CARD_${Date.now()}`
      }).eq('id', tx.id)

      await supabase.rpc('credit_wallet', {
        p_wallet_id: walletId,
        p_amount: amount,
        p_transaction_id: tx.id,
        p_description: `Card deposit`
      })

      return new Response(JSON.stringify({
        success: true,
        transactionId: tx.id,
        message: 'Payment successful'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } else {
      await supabase.from('app_transactions').update({
        status: 'failed',
        description: 'Card payment declined'
      }).eq('id', tx.id)

      return new Response(JSON.stringify({ error: 'Payment declined' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
