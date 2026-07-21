import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MTAA Till Numbers for user deposits
const MTAA_TILL_NUMBERS = ['9767587', '9172229'];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const callback = await req.json();
    const body = callback.Body?.stkCallback || callback;
    const resultCode = body.ResultCode;
    const resultDesc = body.ResultDesc;
    const checkoutRequestID = body.CheckoutRequestID;

    const callbackMetadata = body.CallbackMetadata?.Item || [];
    const getValue = (name: string) => callbackMetadata.find((i: any) => i.Name === name)?.Value;

    const amount = Number(getValue('Amount')) || 0;
    const mpesaReceipt = getValue('MpesaReceiptNumber')?.toString() || '';
    const phoneNumber = getValue('PhoneNumber')?.toString() || '';
    const tillNumber = getValue('TillNumber')?.toString() || '';

    // Validate this is an MTAA till
    if (!MTAA_TILL_NUMBERS.includes(tillNumber)) {
      console.warn(`[Till Callback] Unknown till number: ${tillNumber}`);
      return new Response(JSON.stringify({ success: false, error: 'Unknown till number' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle failed transaction
    if (resultCode !== 0) {
      await supabase.from('wallet_deposits').insert({
        user_id: null,
        wallet_id: null,
        amount,
        currency: 'KES',
        status: 'failed',
        description: `Till deposit failed: ${resultDesc}`,
        reference_type: 'mpesa_till',
        reference_id: checkoutRequestID,
        metadata: { till_number: tillNumber, mpesa_receipt: mpesaReceipt, sender_phone: phoneNumber, callback },
      });
      return new Response(JSON.stringify({ success: false, error: resultDesc }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Clean phone number (remove +254, add 0)
    const cleanPhone = phoneNumber.replace(/^\+254/, '0').replace(/^254/, '0');

    // 1. Find user by phone number
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('id, phone')
      .eq('phone', cleanPhone)
      .single();

    // 2. Find user's default wallet
    let walletId: string | null = null;
    let userId: string | null = null;

    if (userProfile && !userError) {
      userId = userProfile.id;
      const { data: wallet } = await supabase
        .from('wallet_accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('currency', 'KES')
        .eq('is_default', true)
        .single();
      walletId = wallet?.id || null;
    }

    // 3. Record the deposit
    const { data: deposit, error: depositError } = await supabase
      .from('wallet_deposits')
      .insert({
        user_id: userId,
        wallet_id: walletId,
        amount,
        currency: 'KES',
        status: walletId ? 'completed' : 'unclaimed',
        description: `M-Pesa Till Deposit via ${tillNumber}`,
        reference_type: 'mpesa_till',
        reference_id: mpesaReceipt || checkoutRequestID,
        metadata: {
          till_number: tillNumber,
          mpesa_receipt: mpesaReceipt,
          sender_phone: cleanPhone,
          raw_phone: phoneNumber,
          checkout_request_id: checkoutRequestID,
          callback,
        },
      })
      .select()
      .single();

    if (depositError) {
      console.error('[Till Callback] Deposit record failed:', depositError);
      throw new Error(`Failed to record deposit: ${depositError.message}`);
    }

    // 4. If user found and wallet exists → auto-credit
    if (userId && walletId) {
      // Atomic wallet credit via RPC
      const { error: creditError } = await supabase.rpc('credit_wallet', {
        p_wallet_id: walletId,
        p_amount: amount,
        p_description: `M-Pesa Till Deposit via ${tillNumber}`,
        p_reference_type: 'mpesa_till',
        p_reference_id: deposit.id,
      });

      if (creditError) {
        console.error('[Till Callback] Wallet credit failed:', creditError);
        // Mark deposit as pending manual review
        await supabase.from('wallet_deposits')
          .update({ status: 'pending_review' })
          .eq('id', deposit.id);

        // Create alert for admin
        await supabase.from('wallet_deposit_events').insert({
          deposit_id: deposit.id,
          event_type: 'credit_failed',
          details: { error: creditError.message, wallet_id: walletId, amount },
        });
      } else {
        // Credit succeeded → update deposit
        await supabase.from('wallet_deposits')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', deposit.id);

        // Create success event
        await supabase.from('wallet_deposit_events').insert({
          deposit_id: deposit.id,
          event_type: 'auto_credited',
          details: { wallet_id: walletId, amount, user_id: userId },
        });

        // Send notification to user
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'wallet_deposit',
          title: 'Deposit Received',
          body: `KES ${amount.toLocaleString()} deposited to your wallet via M-Pesa Till ${tillNumber}`,
          data: { deposit_id: deposit.id, amount, till_number: tillNumber },
        });
      }
    } else {
      // 5. Unknown phone → unclaimed deposit
      await supabase.from('wallet_deposit_events').insert({
        deposit_id: deposit.id,
        event_type: 'unclaimed',
        details: { sender_phone: cleanPhone, amount, till_number: tillNumber },
      });

      console.log(`[Till Callback] Unclaimed deposit: KES ${amount} from ${cleanPhone}`);
    }

    return new Response(JSON.stringify({
      success: true,
      deposit_id: deposit.id,
      status: walletId ? 'completed' : 'unclaimed',
      amount,
      phone: cleanPhone,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[Till Callback] Fatal error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
