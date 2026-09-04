// Edge Function: initiate-transfer
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

    const {
      sender_id,
      recipient_phone,
      amount,
      description = '',
      currency_code = 'KES'
    } = await req.json()

    if (!sender_id || !recipient_phone || !amount) {
      return new Response(JSON.stringify({ error: 'sender_id, recipient_phone, amount required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get sender wallet
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

    // Check if recipient is registered
    const { data: recipientUser } = await supabaseClient
      .from('wallet_onboarding')
      .select('user_id, phone_number')
      .eq('phone_number', recipient_phone)
      .eq('onboarding_complete', true)
      .single()

    if (recipientUser) {
      // Registered user - direct transfer
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

      // Debit sender
      await supabaseClient
        .from("wallet_accounts")
        .update({
          available_balance: senderWallet.available_balance - amount,
          total_outgoing: senderWallet.total_outgoing + amount
        })
        .eq('id', senderWallet.id)

      // Credit recipient
      await supabaseClient
        .from("wallet_accounts")
        .update({
          available_balance: recipientWallet.available_balance + amount,
          total_incoming: recipientWallet.total_incoming + amount
        })
        .eq('id', recipientWallet.id)

      // Record transaction for sender
      const { data: tx } = await supabaseClient
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

      // Record transaction for recipient
      await supabaseClient
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

      // Notify recipient
      await supabaseClient.from('wallet_notifications').insert({
        user_id: recipientUser.user_id,
        wallet_id: recipientWallet.id,
        notification_type: 'transaction',
        title: 'Money Received!',
        message: `You received KSh ${amount} from ${senderWallet.user_id}`,
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
      // Unregistered user - create pending transaction with claim flow
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

      // Debit sender (hold in pending)
      await supabaseClient
        .from("wallet_accounts")
        .update({
          available_balance: senderWallet.available_balance - amount,
          pending_balance: senderWallet.pending_balance + amount
        })
        .eq('id', senderWallet.id)

      // Record transaction
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

