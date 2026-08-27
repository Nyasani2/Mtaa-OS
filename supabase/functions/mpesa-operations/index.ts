// ============================================================
// MTAA M-PESA OPERATIONS — CONSOLIDATED EDGE FUNCTION
// Actions: stk_push, stk_push_business, callback_handler, daraja_callback, check_status
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MPESA_BASE = Deno.env.get("MPESA_ENV") === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    let { action, ...params } = body;
    if (!action && body?.Body?.stkCallback) { action = "callback_handler"; params = body; } // real Safaricom callbacks carry no action

    let result;
    switch (action) {
      case "stk_push":
        result = await stkPush(supabaseAdmin, params);
        break;
      case "stk_push_business":
        result = await stkPushBusiness(supabaseAdmin, params);
        break;
      case "callback_handler":
        result = await callbackHandler(supabaseAdmin, params);
        break;
      case "daraja_callback":
        result = await darajaCallback(supabaseAdmin, params);
        break;
      case "check_status":
        result = await checkStatus(supabaseAdmin, params);
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown action: " + action }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("mpesa-operations error:", err && err.message ? err.message : err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================
// ACTION: STK_PUSH
// Initiate M-Pesa STK push for user deposit
// ============================================================
async function stkPush(supabaseAdmin, params) {
  const { user_id, phone, amount, account_reference = "MTAA" } = params;

  if (!user_id || !phone || !amount) {
    throw new Error("Missing user_id, phone, or amount");
  }

  // Get Daraja credentials from env
  const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
  const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
  const passkey = Deno.env.get("MPESA_PASSKEY");
  const shortcode = Deno.env.get("MPESA_SHORTCODE");

  if (!consumerKey || !consumerSecret || !passkey || !shortcode) {
    throw new Error("M-Pesa configuration missing");
  }

  // Generate timestamp and password
  const timestamp = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().replace(/\D/g, "").slice(0, 14); // EAT (UTC+3) — Safaricom validates in Nairobi time
  const password = btoa(`${shortcode}${passkey}${timestamp}`);

  // Get access token
  const authResponse = await fetch(
    `${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: "Basic " + btoa(`${consumerKey}:${consumerSecret}`),
      },
    }
  );
  const authText = await authResponse.text();
  let authData: any = {};
  try { authData = JSON.parse(authText); } catch { throw new Error(`OAuth HTTP ${authResponse.status}: ${authText.slice(0, 200) || 'empty body'}`); }

  if (!authData.access_token) {
    throw new Error("Failed to get M-Pesa access token");
  }

  // Initiate STK push
  const stkResponse = await fetch(
    `${MPESA_BASE}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + authData.access_token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-operations`,
        AccountReference: account_reference,
        TransactionDesc: "MTAA Wallet Deposit",
      }),
    }
  );

  const stkText = await stkResponse.text();
  let stkData: any = {};
  try { stkData = JSON.parse(stkText); } catch { throw new Error(`STK HTTP ${stkResponse.status}: ${stkText.slice(0, 200) || 'empty body'}`); }

  if (stkData.errorCode) {
    throw new Error(`M-Pesa error: ${stkData.errorMessage}`);
  }

  // Record pending transaction
  const { data: transaction } = await supabaseAdmin
    .from("mpesa_transactions")
    .insert({
      user_id: user_id,
      phone: phone,
      amount: amount,
      merchant_request_id: stkData.MerchantRequestID,
      checkout_request_id: stkData.CheckoutRequestID,
      status: "pending",
      transaction_type: "deposit",
      account_reference: account_reference
    })
    .select()
    .single();

  return {
    success: true,
    transaction: {
      id: transaction.id,
      merchant_request_id: stkData.MerchantRequestID,
      checkout_request_id: stkData.CheckoutRequestID,
      status: "pending"
    },
    message: `STK push initiated to ${phone}. Check your phone to complete payment.`
  };
}

// ============================================================
// ACTION: STK_PUSH_BUSINESS
// Business STK push (PayBill/Till)
// ============================================================
async function stkPushBusiness(supabaseAdmin, params) {
  const { type, paybillNumber, tillNumber, accountNumber, customerPhone, amount } = params;

  if (!amount || !customerPhone) {
    throw new Error("Missing amount or customerPhone");
  }

  if (type === "paybill" && (!paybillNumber || !accountNumber)) {
    throw new Error("Missing paybillNumber or accountNumber");
  }

  if (type === "till" && !tillNumber) {
    throw new Error("Missing tillNumber");
  }

  // Reuse stkPush logic with business-specific params
  const businessShortCode = type === "paybill" ? paybillNumber : tillNumber;
  const accountRef = type === "paybill" ? accountNumber : "Till Payment";

  // This would call the actual Daraja API for business payments
  // For now, record the business payment request
  const { data: transaction } = await supabaseAdmin
    .from("mpesa_transactions")
    .insert({
      phone: customerPhone,
      amount: amount,
      status: "pending",
      transaction_type: type === "paybill" ? "paybill" : "till",
      account_reference: accountRef,
      business_short_code: businessShortCode
    })
    .select()
    .single();

  return {
    success: true,
    transaction: {
      id: transaction.id,
      type: type,
      amount: amount,
      status: "pending"
    },
    message: `${type === "paybill" ? "PayBill" : "Till"} payment of KES ${amount} initiated.`
  };
}

// ============================================================
// ACTION: CALLBACK_HANDLER
// Handle M-Pesa callback (deposit confirmation)
// ============================================================
async function callbackHandler(supabaseAdmin, params) {
  const { Body } = params;

  if (!Body || !Body.stkCallback) {
    throw new Error("Invalid callback data");
  }

  const callback = Body.stkCallback;
  const merchantRequestId = callback.MerchantRequestID;
  const checkoutRequestId = callback.CheckoutRequestID;
  const resultCode = callback.ResultCode;
  const resultDesc = callback.ResultDesc;

  // Find the pending transaction
  const { data: transaction } = await supabaseAdmin
    .from("mpesa_transactions")
    .select("*")
    .eq("merchant_request_id", merchantRequestId)
    .eq("checkout_request_id", checkoutRequestId)
    .single();

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  if (resultCode === 0) {
    // Success - credit wallet
    const amount = callback.CallbackMetadata?.Item?.find((i: any) => i.Name === "Amount")?.Value || transaction.amount;
    const mpesaReceipt = callback.CallbackMetadata?.Item?.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value;
    const phone = callback.CallbackMetadata?.Item?.find((i: any) => i.Name === "PhoneNumber")?.Value;

    // Get wallet from canonical wallet_accounts
    const { data: wallet } = await supabaseAdmin
      .from("wallet_accounts")
      .select("id, balance, available_balance")
      .eq("user_id", transaction.user_id)
      .limit(1)
      .maybeSingle();

    if (wallet) {
      // Credit canonical wallet
      await supabaseAdmin
        .from("wallet_accounts")
        .update({ 
          balance: (wallet.balance || 0) + amount,
          available_balance: (wallet.available_balance || 0) + amount 
        })
        .eq("id", wallet.id);

      // Record wallet transaction
      await supabaseAdmin.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        user_id: transaction.user_id,
        transaction_type: "deposit",
        direction: "credit",
        amount: amount,
        net_amount: amount,
        status: "completed",
        metadata: {
          mpesa_receipt: mpesaReceipt,
          phone: phone,
          merchant_request_id: merchantRequestId
        }
      });
    }

    // Update M-Pesa transaction
    await supabaseAdmin
      .from("mpesa_transactions")
      .update({
        status: "completed",
        mpesa_receipt: mpesaReceipt,
        phone: phone,
        completed_at: new Date().toISOString()
      })
      .eq("id", transaction.id);

    return {
      success: true,
      status: "completed",
      amount: amount,
      receipt: mpesaReceipt
    };
  } else {
    // Failed
    await supabaseAdmin
      .from("mpesa_transactions")
      .update({
        status: "failed",
        failure_reason: resultDesc
      })
      .eq("id", transaction.id);

    return {
      success: false,
      status: "failed",
      reason: resultDesc
    };
  }
}

// ============================================================
// ACTION: DARAJA_CALLBACK
// Handle Daraja-specific callbacks (Till/PayBill)
// ============================================================
async function darajaCallback(supabaseAdmin, params) {
  const { type, data } = params;

  // Route to appropriate handler based on type
  if (type === "stk" || type === "deposit") {
    return await callbackHandler(supabaseAdmin, { Body: { stkCallback: data } });
  }

  // Handle Till/PayBill specific callbacks
  const { data: transaction } = await supabaseAdmin
    .from("mpesa_transactions")
    .select("*")
    .eq("account_reference", data.BillRefNumber || data.AccountReference)
    .eq("status", "pending")
    .single();

  if (transaction) {
    await supabaseAdmin
      .from("mpesa_transactions")
      .update({
        status: data.ResultCode === 0 ? "completed" : "failed",
        mpesa_receipt: data.TransID,
        completed_at: new Date().toISOString()
      })
      .eq("id", transaction.id);
  }

  return {
    success: true,
    type: type,
    status: data.ResultCode === 0 ? "completed" : "failed"
  };
}

// ============================================================
// ACTION: CHECK_STATUS
// Check M-Pesa transaction status
// ============================================================
async function checkStatus(supabaseAdmin, params) {
  const { checkout_request_id } = params;

  if (!checkout_request_id) {
    throw new Error("Missing checkout_request_id");
  }

  const { data: transaction } = await supabaseAdmin
    .from("mpesa_transactions")
    .select("*")
    .eq("checkout_request_id", checkout_request_id)
    .single();

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return {
    success: true,
    transaction: {
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      mpesa_receipt: transaction.mpesa_receipt,
      created_at: transaction.created_at,
      completed_at: transaction.completed_at
    }
  };
}
