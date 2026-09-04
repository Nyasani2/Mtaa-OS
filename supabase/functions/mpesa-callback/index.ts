
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    const callback = body.Body.stkCallback

    const checkoutId = callback.CheckoutRequestID
    const resultCode = callback.ResultCode

    // 🔍 1. FIND TRANSACTION (STRICT MATCH)
    const { data: tx } = await supabase
      .from('wallet_transactions')
      .select('*')
      .or(`reference.eq.${checkoutId},metadata->checkoutRequestID.eq.${checkoutId}`)
      .single()

    if (!tx) {
      return Response.json({
        success: false,
        error: 'Transaction not found',
      })
    }

    // 🚨 2. IDPOTENCY CHECK (PREVENT DOUBLE PROCESSING)
    if (tx.status === 'SUCCESS') {
      return Response.json({
        success: true,
        message: 'Already processed',
      })
    }

    // ❌ 3. FAILURE CASE
    if (resultCode !== 0) {
      await supabase
        .from('wallet_transactions')
        .update({
          status: 'FAILED',
          metadata: {
            ...tx.metadata,
            callback,
          },
        })
        .eq('id', tx.id)

      return Response.json({
        success: true,
        status: 'FAILED',
      })
    }

    // 💰 4. EXTRACT AMOUNT
    const amount =
      callback.CallbackMetadata?.Item?.find(
        (i: any) => i.Name === 'Amount'
      )?.Value || tx.amount

    // 🔐 5. ATOMIC UPDATE TRANSACTION
    await supabase
      .from('wallet_transactions')
      .update({
        status: 'SUCCESS',
        completed_at: new Date().toISOString(),
        metadata: {
          ...tx.metadata,
          callback,
        },
      })
      .eq('id', tx.id)

    // 💳 6. CREDIT WALLET (SAFE + SINGLE SOURCE OF TRUTH)
    await supabase.rpc('update_wallet_balance', {
      user_id: tx.user_id,
      amount: amount,
    })

    // 📡 7. EVENT LOG (REALTIME SYSTEM)
    await supabase.from('wallet_deposit_events').insert({
      user_id: tx.user_id,
      event_type: 'MPESA_DEPOSIT_SUCCESS',
      metadata: {
        reference: checkoutId,
        amount,
      },
    })

    return Response.json({
      success: true,
      status: 'SUCCESS',
      checkoutId,
    })

  } catch (err) {
    return Response.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    )
  }
})
