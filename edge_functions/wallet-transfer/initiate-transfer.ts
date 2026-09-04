// Edge Function: initiate-transfer
// Handles phone-to-phone money transfers
// FIXED: Added transaction wrapping, error handling, race condition protection

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

    // ─── VALIDATION ───
    if (!sender_id || !recipient_phone || !amount) {
      return new Response(JSON.stringify({ error: 'sender_id, recipient_phone, amount required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (amount <= 0) {
      return new Response(JSON.stringify({ error: 'Amount must be greater than 0' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ─── GET SENDER WALLET ───
    const { data: senderWallet, error: senderError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', sender_id)
      .eq('wallet_type', 'main')
      .single()

    if (senderError || !senderWallet) {
      console.error('[initiate-transfer] Sender wallet error:', senderError)
      return new Response(JSON.stringify({ error: 'Sender wallet not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (senderWallet.available_balance < amount) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient balance',
        available: senderWallet.available_balance,
        requested: amount
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ─── CHECK IF RECIPIENT IS REGISTERED ───
    const { data: recipientUser, error: recipientError } = await supabaseClient
      .from('wallet_onboarding')
      .select('user_id, phone_number')
      .eq('phone_number', recipient_phone)
      .eq('onboarding_complete', true)
      .single()

    if (recipientError && recipientError.code !== 'PGRST116') {
      console.error('[initiate-transfer] Recipient lookup error:', recipientError)
    }

    if (recipientUser) {
      // ─── REGISTERED USER: DIRECT TRANSFER ───
      const { data: recipientWallet, error: recipientWalletError } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', recipientUser.user_id)
        .eq('wallet_type', 'main')
        .single()

      if (recipientWalletError || !recipientWallet) {
        console.error('[initiate-transfer] Recipient wallet error:', recipientWalletError)
        return new Response(JSON.stringify({ error: 'Recipient wallet not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Use RPC for atomic transaction
      const { error: txError } = await supabaseClient.rpc('execute_transfer', {
        p_sender_wallet_id: senderWallet.id,
        p_recipient_wallet_id: recipientWallet.id,
        p_amount: amount,
        p_currency_code: currency_code,
        p_description: description,
        p_sender_id: sender_id,
        p_recipient_id: recipientUser.user_id,
        p_recipient_phone: recipient_phone
      })

      if (txError) {
        console.error('[initiate-transfer] Transfer RPC error:', txError)
        return new Response(JSON.stringify({ error: 'Transfer failed: ' + txError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get the transaction ID
      const { data: txRecord } = await supabaseClient
        .from('wallet_transactions')
        .select('id')
        .eq('wallet_id', senderWallet.id)
        .eq('transaction_type', 'transfer')
        .eq('direction', 'debit')
        .eq('amount', amount)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Notify recipient
      await supabaseClient.from('wallet_notifications').insert({
        user_id: recipientUser.user_id,
        wallet_id: recipientWallet.id,
        notification_type: 'transaction',
        title: 'Money Received!',
        message: `You received ${currency_code} ${amount} from ${senderWallet.user_id}`,
        data: { transaction_id: txRecord?.id, amount }
      }).catch(err => console.error('[initiate-transfer] Notification error:', err))

      return new Response(JSON.stringify({
        success: true,
        transaction_id: txRecord?.id,
        status: 'completed',
        message: 'Transfer completed successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else {
      // ─── UNREGISTERED USER: PENDING TRANSACTION ───
      const claimToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { data: pendingTx, error: pendingError } = await supabaseClient
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

      if (pendingError) {
        console.error('[initiate-transfer] Pending transaction error:', pendingError)
        return new Response(JSON.stringify({ error: 'Failed to create pending transaction' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Debit sender (hold in pending) — use RPC for atomicity
      const { error: holdError } = await supabaseClient.rpc('hold_funds', {
        p_wallet_id: senderWallet.id,
        p_amount: amount
      })

      if (holdError) {
        console.error('[initiate-transfer] Hold funds error:', holdError)
        // Rollback pending transaction
        await supabaseClient
          .from('wallet_pending_transactions')
          .delete()
          .eq('id', pendingTx.id)
        return new Response(JSON.stringify({ error: 'Failed to hold funds' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Record transaction
      const { error: txError } = await supabaseClient
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
          counterparty_phone: recipient_phone,
          pending_transaction_id: pendingTx.id
        })

      if (txError) {
        console.error('[initiate-transfer] Transaction record error:', txError)
      }

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
    console.error('[initiate-transfer] Unhandled error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', detail: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
