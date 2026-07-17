import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const callback = await req.json();
    const body = callback.Body?.stkCallback || callback;
    const resultCode = body.ResultCode;
    const resultDesc = body.ResultDesc;
    const checkoutRequestID = body.CheckoutRequestID;

    const callbackMetadata = body.CallbackMetadata?.Item || [];
    const getValue = (name: string) => callbackMetadata.find((i: any) => i.Name === name)?.Value;

    const amount = getValue('Amount');
    const mpesaReceipt = getValue('MpesaReceiptNumber');
    const phoneNumber = getValue('PhoneNumber')?.toString();

    if (resultCode !== 0) {
      await supabase.from('till_payments').update({ status: 'failed', failure_reason: resultDesc, callback_payload: callback }).eq('mpesa_transaction_id', checkoutRequestID);
      return new Response(JSON.stringify({ success: false, error: resultDesc }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: senderName } = await supabase.rpc('resolve_sender_name', { p_phone: phoneNumber });
    const { data: pendingPayment } = await supabase.from('till_payments').select('till_number, business_id').eq('mpesa_transaction_id', checkoutRequestID).single();
    const tillNumber = pendingPayment?.till_number;
    const businessId = pendingPayment?.business_id;

    const { data: payment, error: updateError } = await supabase.from('till_payments').update({
      status: 'completed', mpesa_receipt: mpesaReceipt, sender_phone: phoneNumber,
      sender_name: senderName || 'Unknown', amount: amount, callback_payload: callback,
      completed_at: new Date().toISOString(),
    }).eq('mpesa_transaction_id', checkoutRequestID).select().single();

    if (updateError) throw updateError;

    if (businessId) {
      const { data: business } = await supabase.from('businesses').select('settlement_frequency, settlement_threshold, fee_percentage').eq('id', businessId).single();
      if (business?.settlement_frequency === 'instant') {
        await supabase.rpc('process_settlement', { p_business_id: businessId, p_payment_id: payment.id, p_payment_type: 'till' });
      }
    }

    await supabase.from('_realtime_events').insert({
      channel: 'business', topic: 'payment_received',
      payload: { businessId, tillNumber, senderPhone: phoneNumber, senderName: senderName || 'Unknown', amount, mpesaReceipt, paymentId: payment.id },
    });

    return new Response(JSON.stringify({ success: true, receipt: mpesaReceipt, senderName: senderName || 'Unknown' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[Daraja Till Callback] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
