/**
 * MTAA OS V10 — Edge Function: wallet-withdraw
 * Handles wallet withdrawal to M-Pesa
 * Tables: wallet_transactions, wallet_accounts
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, amount, currency = 'KES', provider = 'mpesa', phone } = await req.json()

    if (!user_id || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Check balance
    const { data: account, error: accErr } = await supabase
      .from('wallet_accounts')
      .select('*')
      .eq('user_id', user_id)
      .eq('currency', currency)
      .single()

    if (accErr || !account) throw new Error('Wallet account not found')
    if (account.available_balance < amount) throw new Error('Insufficient funds')

    // 2. Hold balance
    await supabase.from('wallet_accounts').update({
      available_balance: account.available_balance - amount,
      hold_balance: account.hold_balance + amount,
    }).eq('id', account.id)

    // 3. Create pending transaction
    const { data: txn, error: txnErr } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id,
        wallet_id: account.wallet_id,
        amount: -amount,
        type: 'withdrawal',
        status: 'pending',
        currency,
        description: `Withdrawal to ${provider}`,
        provider,
        reference: `WDR-${Date.now()}`,
        balance_after: account.available_balance - amount,
      })
      .select()
      .single()

    if (txnErr) throw txnErr

    // 4. Initiate B2C payout (mocked — replace with Daraja B2C)
    const b2cResponse = await initiateB2C({
      phone: phone ?? await getUserPhone(supabase, user_id),
      amount,
      occasion: 'Withdrawal',
      remarks: 'MTAA Wallet Withdrawal',
    })

    return new Response(JSON.stringify({
      success: true,
      transaction_id: txn.id,
      conversation_id: b2cResponse.ConversationID,
      status: 'pending',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function initiateB2C(params: { phone: string; amount: number; occasion: string; remarks: string }) {
  // TODO: Integrate Safaricom Daraja B2C API here
  return { ConversationID: `MOCK-B2C-${Date.now()}` }
}

async function getUserPhone(supabase: any, userId: string) {
  const { data } = await supabase.from('user_profiles').select('phone').eq('id', userId).single()
  return data?.phone ?? ''
}
