import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DARAJA_BASE_URL = 'https://api.safaricom.co.ke';

async function getAccessToken(consumerKey: string, consumerSecret: string): Promise<string> {
  const auth = btoa(`${consumerKey}:${consumerSecret}`);
  const response = await fetch(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${auth}` } });
  const data = await response.json();
  return data.access_token;
}

function generateTimestamp(): string {
  const now = new Date();
  return now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
}

function generatePassword(shortCode: string, passkey: string, timestamp: string): string {
  return btoa(shortCode + passkey + timestamp);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { tillNumber, paybillNumber, accountNumber, customerPhone, amount, type } = await req.json();

    if (!customerPhone || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields: customerPhone, amount' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let business;
    if (type === 'till' && tillNumber) {
      const { data } = await supabase.from('businesses').select('*').eq('till_number', tillNumber).single();
      business = data;
    } else if (type === 'paybill' && paybillNumber) {
      const { data } = await supabase.from('businesses').select('*').eq('paybill_number', paybillNumber).single();
      business = data;
    }

    if (!business) {
      return new Response(JSON.stringify({ error: 'Business not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const consumerKey = Deno.env.get('DARAJA_CONSUMER_KEY')!;
    const consumerSecret = Deno.env.get('DARAJA_CONSUMER_SECRET')!;
    const passkey = Deno.env.get('DARAJA_PASSKEY')!;
    const shortCode = type === 'till' ? tillNumber : paybillNumber;

    const accessToken = await getAccessToken(consumerKey, consumerSecret);
    const timestamp = generateTimestamp();
    const password = generatePassword(shortCode, passkey, timestamp);

    const stkPayload = {
      BusinessShortCode: shortCode, Password: password, Timestamp: timestamp,
      TransactionType: type === 'till' ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline',
      Amount: Math.round(amount), PartyA: customerPhone, PartyB: shortCode, PhoneNumber: customerPhone,
      CallBackURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/daraja-${type}-callback`,
      AccountReference: type === 'paybill' ? accountNumber : `Till-${shortCode}`,
      TransactionDesc: `Payment to ${business.name}`,
    };

    const darajaResponse = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(stkPayload),
    });

    const darajaData = await darajaResponse.json();
    if (darajaData.errorCode) {
      return new Response(JSON.stringify({ error: darajaData.errorMessage }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const paymentRecord = {
      [type === 'till' ? 'till_number' : 'paybill_number']: shortCode,
      business_id: business.id, sender_phone: customerPhone, amount: amount,
      status: 'pending', mpesa_transaction_id: darajaData.CheckoutRequestID,
    };

    const { data: payment, error: insertError } = await supabase
      .from(type === 'till' ? 'till_payments' : 'paybill_payments')
      .insert(paymentRecord).select().single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({
      success: true, checkoutRequestId: darajaData.CheckoutRequestID,
      merchantRequestId: darajaData.MerchantRequestID, paymentId: payment.id, businessName: business.name,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[Business STK Push] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
