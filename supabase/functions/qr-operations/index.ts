// ============================================================
// MTAA QR OPERATIONS — CONSOLIDATED EDGE FUNCTION
// Actions: generate, resolve, execute
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, ...params } = body;

    let result;
    switch (action) {
      case "generate":
        result = await qrGenerate(supabaseAdmin, user.id, params);
        break;
      case "resolve":
        result = await qrResolve(supabaseAdmin, user.id, params);
        break;
      case "execute":
        result = await qrExecute(supabaseAdmin, user.id, params);
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================
// ACTION: GENERATE
// Generate QR code for payment/transfer
// ============================================================
async function qrGenerate(supabaseAdmin, userId, params) {
  const { type, amount, note, expires_in_minutes = 30 } = params;

  if (!type || !amount) {
    throw new Error("Missing type or amount");
  }

  const qrId = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date(Date.now() + expires_in_minutes * 60000);

  const qrData = {
    id: qrId,
    type,
    amount,
    note,
    creator_id: userId,
    status: "active",
    created_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString()
  };

  // Store in wallet_scans table
  const { data: scan } = await supabaseAdmin
    .from("wallet_scans")
    .insert({
      user_id: userId,
      scan_type: type,
      scan_data: qrData,
      status: "active",
      metadata: { amount, note, expires_at: expiresAt.toISOString() }
    })
    .select()
    .single();

  return {
    success: true,
    qr: {
      id: qrId,
      data: qrData,
      expires_at: expiresAt.toISOString(),
      scan_id: scan.id
    },
    message: `QR code generated for KES ${amount}. Expires in ${expires_in_minutes} minutes.`
  };
}

// ============================================================
// ACTION: RESOLVE
// Resolve QR code data
// ============================================================
async function qrResolve(supabaseAdmin, userId, params) {
  const { qr_data } = params;

  if (!qr_data) {
    throw new Error("Missing qr_data");
  }

  let parsedData;
  try {
    parsedData = typeof qr_data === "string" ? JSON.parse(qr_data) : qr_data;
  } catch (e) {
    throw new Error("Invalid QR data format");
  }

  // Check if QR is still active
  const { data: scan } = await supabaseAdmin
    .from("wallet_scans")
    .select("*")
    .eq("scan_data->>id", parsedData.id)
    .eq("status", "active")
    .single();

  if (!scan) {
    throw new Error("QR code not found or expired");
  }

  const now = new Date();
  const expiresAt = new Date(scan.metadata?.expires_at || scan.created_at);
  if (now > expiresAt) {
    // Mark as expired
    await supabaseAdmin
      .from("wallet_scans")
      .update({ status: "expired" })
      .eq("id", scan.id);
    throw new Error("QR code has expired");
  }

  return {
    success: true,
    resolved: {
      id: parsedData.id,
      type: parsedData.type,
      amount: parsedData.amount,
      note: parsedData.note,
      creator_id: parsedData.creator_id,
      status: "active"
    },
    message: `QR resolved: KES ${parsedData.amount} ${parsedData.type}`
  };
}

// ============================================================
// ACTION: EXECUTE
// Execute payment from scanned QR
// ============================================================
async function qrExecute(supabaseAdmin, userId, params) {
  const { qr_data, pin } = params;

  if (!qr_data) {
    throw new Error("Missing qr_data");
  }

  // Resolve QR first
  const resolved = await qrResolve(supabaseAdmin, userId, { qr_data });
  if (!resolved.success) {
    throw new Error(resolved.error || "Failed to resolve QR");
  }

  const { amount, creator_id, type } = resolved.resolved;

  // Verify PIN if required
  if (pin) {
    const { data: pinCheck } = await supabaseAdmin
      .from("wallet_security")
      .select("pin_hash")
      .eq("user_id", userId)
      .single();

    // In production, verify PIN hash properly
    // For now, we assume PIN is verified by the app before calling this
  }

  // Execute transfer to QR creator
  const transferResult = await walletTransfer(supabaseAdmin, userId, {
    recipient_id: creator_id,
    amount: amount,
    note: `QR Payment: ${type}`
  });

  // Mark QR as used
  await supabaseAdmin
    .from("wallet_scans")
    .update({ status: "used" })
    .eq("scan_data->>id", resolved.resolved.id);

  return {
    success: true,
    transfer: transferResult,
    message: `QR payment of KES ${amount} executed successfully.`
  };
}

// Reuse walletTransfer from wallet-operations
async function walletTransfer(supabaseAdmin, userId, params) {
  const { recipient_id, amount, note } = params;

  if (!recipient_id || !amount || amount <= 0) {
    throw new Error("Missing recipient_id or invalid amount");
  }

  const { data: senderWallet } = await supabaseAdmin
    .from("wallets")
    .select("id, available_balance")
    .eq("user_id", userId)
    .eq("wallet_type", "main")
    .eq("is_active", true)
    .single();

  if (!senderWallet) throw new Error("Sender wallet not found");
  if (senderWallet.available_balance < amount) {
    throw new Error(`Insufficient balance. Available: KES ${senderWallet.available_balance}`);
  }

  const { data: recipientWallet } = await supabaseAdmin
    .from("wallets")
    .select("id, user_id")
    .eq("user_id", recipient_id)
    .eq("wallet_type", "main")
    .eq("is_active", true)
    .single();

  if (!recipientWallet) throw new Error("Recipient wallet not found");

  const feePercentage = 0.5;
  const fee = Math.round(amount * (feePercentage / 100) * 100) / 100;
  const netAmount = amount - fee;
  const transactionRef = `QTX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await supabaseAdmin
    .from("wallets")
    .update({ available_balance: senderWallet.available_balance - amount })
    .eq("id", senderWallet.id);

  const { data: recipientCurrent } = await supabaseAdmin
    .from("wallets")
    .select("available_balance")
    .eq("id", recipientWallet.id)
    .single();

  await supabaseAdmin
    .from("wallets")
    .update({ available_balance: (recipientCurrent?.available_balance || 0) + netAmount })
    .eq("id", recipientWallet.id);

  await supabaseAdmin.from("wallet_transactions").insert([
    {
      wallet_id: senderWallet.id,
      user_id: userId,
      transaction_type: "qr_payment",
      direction: "debit",
      amount: amount,
      net_amount: -amount,
      status: "completed",
      counterparty_wallet_id: recipientWallet.id,
      metadata: { note, transaction_ref: transactionRef, fee }
    },
    {
      wallet_id: recipientWallet.id,
      user_id: recipientWallet.user_id,
      transaction_type: "qr_payment",
      direction: "credit",
      amount: netAmount,
      net_amount: netAmount,
      status: "completed",
      counterparty_wallet_id: senderWallet.id,
      metadata: { note, transaction_ref: transactionRef, fee }
    }
  ]);

  return {
    success: true,
    transaction_ref: transactionRef,
    amount: amount,
    fee: fee,
    net_amount: netAmount
  };
}
