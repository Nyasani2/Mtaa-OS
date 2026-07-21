// ============================================================
// MTAA WALLET OPERATIONS — CONSOLIDATED EDGE FUNCTION
// Actions: deposit, transfer, withdraw, execute, balance, history
// FIXED: Added transaction wrapping, proper error handling, rollback support
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

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;
    switch (action) {
      case "deposit":
        result = await walletDeposit(supabaseAdmin, user.id, params);
        break;
      case "transfer":
        result = await walletTransfer(supabaseAdmin, user.id, params);
        break;
      case "withdraw":
        result = await walletWithdraw(supabaseAdmin, user.id, params);
        break;
      case "execute":
        result = await walletExecute(supabaseAdmin, user.id, params);
        break;
      case "balance":
        result = await walletBalance(supabaseAdmin, user.id, params);
        break;
      case "history":
        result = await walletHistory(supabaseAdmin, user.id, params);
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
    console.error("[wallet-operations] Unhandled error:", err);
    return new Response(JSON.stringify({ error: err.message, code: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================
// ACTION: DEPOSIT
// ============================================================
async function walletDeposit(supabaseAdmin, userId, params) {
  const { amount, phone, method = "mpesa" } = params;

  if (!amount || amount <= 0) {
    throw new Error("Invalid deposit amount");
  }

  // Get user wallet
  const { data: wallet, error: walletError } = await supabaseAdmin
    .from("wallets")
    .select("id, available_balance, currency_code, status")
    .eq("user_id", userId)
    .eq("wallet_type", "main")
    .single();

  if (walletError || !wallet) {
    console.error("[walletDeposit] Wallet error:", walletError);
    throw new Error("Wallet not found");
  }

  if (wallet.status !== 'active') {
    throw new Error("Wallet is frozen or suspended");
  }

  // Record pending deposit
  const { data: deposit, error: depositError } = await supabaseAdmin
    .from("wallet_deposits")
    .insert({
      wallet_id: wallet.id,
      user_id: userId,
      amount: amount,
      method: method,
      phone: phone,
      status: "pending",
      metadata: { initiated_at: new Date().toISOString() }
    })
    .select()
    .single();

  if (depositError) {
    console.error("[walletDeposit] Deposit record error:", depositError);
    throw new Error("Failed to record deposit");
  }

  return {
    success: true,
    deposit: {
      id: deposit.id,
      amount: deposit.amount,
      status: deposit.status,
      method: deposit.method
    },
    message: `Deposit of ${wallet.currency_code} ${amount} initiated via ${method}. Complete payment on your phone.`
  };
}

// ============================================================
// ACTION: TRANSFER
// FIXED: Uses RPC for atomic debit/credit
// ============================================================
async function walletTransfer(supabaseAdmin, userId, params) {
  const { recipient_id, amount, note } = params;

  if (!recipient_id || !amount || amount <= 0) {
    throw new Error("Missing recipient_id or invalid amount");
  }

  if (recipient_id === userId) {
    throw new Error("Cannot transfer to yourself");
  }

  // Get sender wallet
  const { data: senderWallet, error: senderError } = await supabaseAdmin
    .from("wallets")
    .select("id, available_balance, currency_code")
    .eq("user_id", userId)
    .eq("wallet_type", "main")
    .eq("is_active", true)
    .single();

  if (senderError || !senderWallet) {
    console.error("[walletTransfer] Sender wallet error:", senderError);
    throw new Error("Sender wallet not found");
  }

  if (senderWallet.available_balance < amount) {
    throw new Error(`Insufficient balance. Available: ${senderWallet.currency_code} ${senderWallet.available_balance}`);
  }

  // Get recipient wallet
  const { data: recipientWallet, error: recipientError } = await supabaseAdmin
    .from("wallets")
    .select("id, user_id")
    .eq("user_id", recipient_id)
    .eq("wallet_type", "main")
    .eq("is_active", true)
    .single();

  if (recipientError || !recipientWallet) {
    console.error("[walletTransfer] Recipient wallet error:", recipientError);
    throw new Error("Recipient wallet not found");
  }

  // Get MTAA fee
  const { data: feeConfig } = await supabaseAdmin
    .from("platform_fees")
    .select("percentage")
    .eq("module", "wallet_transfer")
    .eq("active", true)
    .maybeSingle();

  const feePercentage = feeConfig?.percentage || 0.5;
  const fee = Math.round(amount * (feePercentage / 100) * 100) / 100;
  const netAmount = amount - fee;

  const transactionRef = `WTX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Use RPC for atomic transfer
  const { error: txError } = await supabaseAdmin.rpc('execute_p2p_transfer', {
    p_sender_wallet_id: senderWallet.id,
    p_recipient_wallet_id: recipientWallet.id,
    p_amount: amount,
    p_fee: fee,
    p_net_amount: netAmount,
    p_transaction_ref: transactionRef,
    p_note: note || '',
    p_sender_id: userId,
    p_recipient_id: recipient_id
  });

  if (txError) {
    console.error("[walletTransfer] Transfer RPC error:", txError);
    throw new Error("Transfer failed: " + txError.message);
  }

  // Record fee if > 0
  if (fee > 0) {
    const { data: mtaaWallet } = await supabaseAdmin
      .from("wallets")
      .select("id, user_id")
      .eq("wallet_type", "main")
      .ilike("wallet_name", "%MTAA%")
      .maybeSingle();

    if (mtaaWallet) {
      await supabaseAdmin.from("wallet_transactions").insert({
        wallet_id: mtaaWallet.id,
        user_id: mtaaWallet.user_id,
        transaction_type: "platform_fee",
        direction: "credit",
        amount: fee,
        net_amount: fee,
        status: "completed",
        counterparty_wallet_id: senderWallet.id,
        metadata: { transaction_ref: transactionRef, module: "wallet_transfer" }
      }).catch(err => console.error("[walletTransfer] Fee record error:", err));
    }
  }

  return {
    success: true,
    transaction_ref: transactionRef,
    amount: amount,
    fee: fee,
    net_amount: netAmount,
    recipient_id: recipient_id,
    message: `Transfer of ${senderWallet.currency_code} ${amount} successful. Fee: ${senderWallet.currency_code} ${fee}.`
  };
}

// ============================================================
// ACTION: WITHDRAW
// FIXED: Creates payout record BEFORE debiting wallet
// ============================================================
async function walletWithdraw(supabaseAdmin, userId, params) {
  const { amount, method = "mpesa", destination, agent_id } = params;

  if (!amount || amount <= 0) {
    throw new Error("Invalid withdrawal amount");
  }

  // Get user wallet
  const { data: wallet, error: walletError } = await supabaseAdmin
    .from("wallets")
    .select("id, available_balance, currency_code")
    .eq("user_id", userId)
    .eq("wallet_type", "main")
    .eq("is_active", true)
    .single();

  if (walletError || !wallet) {
    console.error("[walletWithdraw] Wallet error:", walletError);
    throw new Error("Wallet not found");
  }

  if (wallet.available_balance < amount) {
    throw new Error(`Insufficient balance. Available: ${wallet.currency_code} ${wallet.available_balance}`);
  }

  // Get withdrawal fee
  const { data: feeConfig } = await supabaseAdmin
    .from("platform_fees")
    .select("percentage")
    .eq("module", "withdrawal")
    .eq("active", true)
    .maybeSingle();

  const feePercentage = feeConfig?.percentage || 1.0;
  const fee = Math.round(amount * (feePercentage / 100) * 100) / 100;
  const netAmount = amount - fee;

  const transactionRef = `WWD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create withdrawal record FIRST (before debiting)
  const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
    .from("wallet_payouts")
    .insert({
      wallet_id: wallet.id,
      user_id: userId,
      amount: amount,
      fee: fee,
      net_amount: netAmount,
      method: method,
      destination: destination,
      agent_id: agent_id,
      status: "pending",
      transaction_ref: transactionRef
    })
    .select()
    .single();

  if (withdrawalError) {
    console.error("[walletWithdraw] Payout record error:", withdrawalError);
    throw new Error("Failed to create withdrawal record");
  }

  // Now debit wallet using RPC for atomicity
  const { error: debitError } = await supabaseAdmin.rpc('debit_wallet', {
    p_wallet_id: wallet.id,
    p_amount: amount,
    p_transaction_ref: transactionRef
  });

  if (debitError) {
    console.error("[walletWithdraw] Debit error:", debitError);
    // Mark withdrawal as failed
    await supabaseAdmin
      .from("wallet_payouts")
      .update({ status: "failed", failure_reason: debitError.message })
      .eq("id", withdrawal.id);
    throw new Error("Failed to debit wallet: " + debitError.message);
  }

  // Record transaction
  await supabaseAdmin.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    user_id: userId,
    transaction_type: "withdrawal",
    direction: "debit",
    amount: amount,
    net_amount: -amount,
    status: "pending",
    metadata: { transaction_ref: transactionRef, method, destination, fee }
  }).catch(err => console.error("[walletWithdraw] Transaction record error:", err));

  return {
    success: true,
    withdrawal: {
      id: withdrawal.id,
      amount: withdrawal.amount,
      fee: withdrawal.fee,
      net_amount: withdrawal.net_amount,
      status: withdrawal.status,
      method: withdrawal.method
    },
    transaction_ref: transactionRef,
    message: `Withdrawal of ${wallet.currency_code} ${amount} initiated. Fee: ${wallet.currency_code} ${fee}. Status: pending.`
  };
}

// ============================================================
// ACTION: EXECUTE
// ============================================================
async function walletExecute(supabaseAdmin, userId, params) {
  const { operation, payload } = params;

  if (!operation) {
    throw new Error("Missing operation type");
  }

  switch (operation) {
    case "transfer":
      return await walletTransfer(supabaseAdmin, userId, payload);
    case "withdraw":
      return await walletWithdraw(supabaseAdmin, userId, payload);
    case "deposit":
      return await walletDeposit(supabaseAdmin, userId, payload);
    default:
      throw new Error("Unknown operation: " + operation);
  }
}

// ============================================================
// ACTION: BALANCE
// ============================================================
async function walletBalance(supabaseAdmin, userId, params) {
  const { wallet_type = "main" } = params;

  const { data: wallet, error } = await supabaseAdmin
    .from("wallets")
    .select("id, available_balance, pending_balance, currency_code, wallet_type, wallet_name, is_active")
    .eq("user_id", userId)
    .eq("wallet_type", wallet_type)
    .single();

  if (error || !wallet) {
    console.error("[walletBalance] Error:", error);
    throw new Error("Wallet not found");
  }

  // Get sub-wallets if main
  let subWallets = [];
  if (wallet_type === "main") {
    const { data: subs, error: subError } = await supabaseAdmin
      .from("sub_wallets")
      .select("id, name, balance, type")
      .eq("parent_wallet_id", wallet.id)
      .eq("is_active", true);

    if (subError) {
      console.error("[walletBalance] Sub-wallet error:", subError);
    }
    subWallets = subs || [];
  }

  return {
    success: true,
    balance: {
      wallet_id: wallet.id,
      available: wallet.available_balance,
      pending: wallet.pending_balance,
      currency: wallet.currency_code,
      type: wallet.wallet_type,
      name: wallet.wallet_name,
      is_active: wallet.is_active,
      sub_wallets: subWallets
    }
  };
}

// ============================================================
// ACTION: HISTORY
// ============================================================
async function walletHistory(supabaseAdmin, userId, params) {
  const { limit = 20, offset = 0, type } = params;

  let query = supabaseAdmin
    .from("wallet_transactions")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (type) {
    query = query.eq("transaction_type", type);
  }

  const { data: transactions, error, count } = await query;

  if (error) {
    console.error("[walletHistory] Error:", error);
    throw new Error("Failed to fetch history: " + error.message);
  }

  return {
    success: true,
    transactions: transactions || [],
    total: count || 0,
    limit,
    offset
  };
}
