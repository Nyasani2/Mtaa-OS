// Edge Function: wallet-transfer
// Handles phone-to-phone money transfers

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 🔐 SECURITY: Derive sender_id from the authenticated user's JWT, NOT the request body
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const sender_id = user.id

    const {
      recipient_phone,
      amount,
      description = '',
      currency_code = 'KES'
    } = await req.json()

    if (!recipient_phone || !amount) {
      return new Response(JSON.stringify({ error: 'recipient_phone and amount are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 🚨 SECURITY: Reject negative or zero amounts
    if (amount <= 0) {
      return new Response(JSON.stringify({ error: 'Amount must be greater than 0' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: senderWallet } = await supabaseClient
      .from("wallet_accounts")
      .select('*')
      .eq('user_id', sender_id)
      .eq('wallet_type', 'main')
      .single()

    if (!senderWallet) {
      return new Response(JSON.stringify({ error: 'Sender wallet not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (senderWallet.available_balance < amount) {
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: recipientUser } = await supabaseClient
      .from('wallet_onboarding')
      .select('user_id, phone_number')
      .eq('phone_number', recipient_phone)
      .eq('onboarding_complete', true)
      .single()

    if (recipientUser) {
      const { data: recipientWallet } = await supabaseClient
        .from("wallet_accounts")
        .select('*')
        .eq('user_id', recipientUser.user_id)
        .eq('wallet_type', 'main')
        .single()

      if (!recipientWallet) {
        return new Response(JSON.stringify({ error: 'Recipient wallet not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // ⚡ ATOMIC-STYLE UPDATE: Debit sender
      const { error: debitError } = await supabaseClient
        .from("wallet_accounts")
        .update({
          available_balance: senderWallet.available_balance - amount,
          total_outgoing: senderWallet.total_outgoing + amount
        })
        .eq('id', senderWallet.id)
      
      if (debitError) throw new Error('Failed to debit sender: ' + debitError.message)

      // ⚡ ATOMIC-STYLE UPDATE: Credit recipient
      const { error: creditError } = await supabaseClient
        .from("wallet_accounts")
        .update({
          available_balance: recipientWallet.available_balance + amount,
          total_incoming: recipientWallet.total_incoming + amount
        })
        .eq('id', recipientWallet.id)

      if (creditError) throw new Error('Failed to credit recipient: ' + creditError.message)

      const { data: tx, error: txError1 } = await supabaseClient
        .from('wallet_transactions')
        .insert({
          wallet_id: senderWallet.id,
          user_id: sender_id,
          transaction_type: 'transfer',
          direction: 'debit',
          amount,
          currency_code,
          net_amount: amount,
          status: 'completed',
          description,
          counterparty_wallet_id: recipientWallet.id,
          counterparty_phone: recipient_phone
        })
        .select()
        .single()

      if (txError1) throw new Error('Failed to create debit transaction: ' + txError1.message)

      const { error: txError2 } = await supabaseClient
        .from('wallet_transactions')
        .insert({
          wallet_id: recipientWallet.id,
          user_id: recipientUser.user_id,
          transaction_type: 'transfer',
          direction: 'credit',
          amount,
          currency_code,
          net_amount: amount,
          status: 'completed',
          description,
          counterparty_wallet_id: senderWallet.id,
          related_transaction_id: tx.id
        })

      if (txError2) throw new Error('Failed to create credit transaction: ' + txError2.message)

      await supabaseClient.from('wallet_notifications').insert({
        user_id: recipientUser.user_id,
        wallet_id: recipientWallet.id,
        notification_type: 'transaction',
        title: 'Money Received!',
        message: `You received KSh ${amount}`,
        data: { transaction_id: tx.id, amount }
      })

      return new Response(JSON.stringify({
        success: true,
        transaction_id: tx.id,
        status: 'completed',
        message: 'Transfer completed successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else {
      const claimToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { data: pendingTx } = await supabaseClient
        .from('wallet_pending_transactions')
        .insert({
          sender_id,
          sender_wallet_id: senderWallet.id,
          recipient_phone,
          amount,
          currency_code,
          claim_token: claimToken,
          invite_link: `https://mtaa.app/claim/${claimToken}`,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      await supabaseClient
        .from("wallet_accounts")
        .update({
          available_balance: senderWallet.available_balance - amount,
          pending_balance: senderWallet.pending_balance + amount
        })
        .eq('id', senderWallet.id)

      await supabaseClient
        .from('wallet_transactions')
        .insert({
          wallet_id: senderWallet.id,
          user_id: sender_id,
          transaction_type: 'transfer',
          direction: 'debit',
          amount,
          currency_code,
          net_amount: amount,
          status: 'pending',
          description: `Pending transfer to ${recipient_phone}`,
          counterparty_phone: recipient_phone
        })

      return new Response(JSON.stringify({
        success: true,
        pending_transaction_id: pendingTx.id,
        claim_token: claimToken,
        invite_link: pendingTx.invite_link,
        status: 'pending',
        message: 'Invite sent. Funds will be available when recipient joins.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

