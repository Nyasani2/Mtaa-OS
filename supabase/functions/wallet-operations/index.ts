
// ============================================================
// MTAA WALLET OPERATIONS — CONSOLIDATED EDGE FUNCTION
// Actions: deposit, transfer, withdraw, execute, balance, history
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================
// ACTION: DEPOSIT
// Deposit funds via M-Pesa or other methods
// ============================================================
async function walletDeposit(supabaseAdmin, userId, params) {
  const { amount, phone, method = "mpesa" } = params;

  if (!amount || amount <= 0) {
    throw new Error("Invalid deposit amount");
  }

  // Get user wallet
  const { data: wallet } = await supabaseAdmin
    .from("wallet_accounts")
    .select("id, available_balance")
    .eq("user_id", userId)
    .eq("account_type", "main")
    .single();

  if (!wallet) throw new Error("Wallet not found");

  // For M-Pesa, initiate STK push via separate mpesa-operations function
  // This action just records the pending deposit
  const { data: deposit } = await supabaseAdmin
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

  return {
    success: true,
    deposit: {
      id: deposit.id,
      amount: deposit.amount,
      status: deposit.status,
      method: deposit.method
    },
    message: `Deposit of KES ${amount} initiated via ${method}. Complete payment on your phone.`
  };
}

// ============================================================
// ACTION: TRANSFER
// P2P transfer between users
// ============================================================
async function walletTransfer(supabaseAdmin, userId, params) {
  const { recipient_id, amount, note } = params;

  if (!recipient_id || !amount || amount <= 0) {
    throw new Error("Missing recipient_id or invalid amount");
  }

  // Get sender wallet
  const { data: senderWallet } = await supabaseAdmin
    .from("wallet_accounts")
    .select("id, available_balance, currency_code")
    .eq("user_id", userId)
    .eq("account_type", "main")
    .eq("is_active", true)
    .single();

  if (!senderWallet) throw new Error("Sender wallet not found");
  if (senderWallet.available_balance < amount) {
    throw new Error(`Insufficient balance. Available: KES ${senderWallet.available_balance}`);
  }

  // Get recipient wallet
  const { data: recipientWallet } = await supabaseAdmin
    .from("wallet_accounts")
    .select("id, user_id")
    .eq("user_id", recipient_id)
    .eq("account_type", "main")
    .eq("is_active", true)
    .single();

  if (!recipientWallet) throw new Error("Recipient wallet not found");

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

  // Debit sender
  const { error: debitError } = await supabaseAdmin
    .from("wallet_accounts")
    .update({ available_balance: senderWallet.available_balance - amount })
    .eq("id", senderWallet.id)
    .eq("available_balance", senderWallet.available_balance);

  if (debitError) throw new Error("Failed to debit sender");

  // Credit recipient
  const { data: recipientCurrent } = await supabaseAdmin
    .from("wallet_accounts")
    .select("available_balance")
    .eq("id", recipientWallet.id)
    .single();

  await supabaseAdmin
    .from("wallet_accounts")
    .update({ available_balance: (recipientCurrent?.available_balance || 0) + netAmount })
    .eq("id", recipientWallet.id);

  // Record sender transaction
  await supabaseAdmin.from("wallet_transactions").insert({
    wallet_id: senderWallet.id,
    user_id: userId,
    transaction_type: "transfer",
    direction: "debit",
    amount: amount,
    net_amount: -amount,
    status: "completed",
    counterparty_wallet_id: recipientWallet.id,
    metadata: { note, transaction_ref: transactionRef, fee, fee_percentage: feePercentage }
  });

  // Record recipient transaction
  await supabaseAdmin.from("wallet_transactions").insert({
    wallet_id: recipientWallet.id,
    user_id: recipientWallet.user_id,
    transaction_type: "transfer",
    direction: "credit",
    amount: netAmount,
    net_amount: netAmount,
    status: "completed",
    counterparty_wallet_id: senderWallet.id,
    metadata: { note, transaction_ref: transactionRef, fee, fee_percentage: feePercentage }
  });

  // Record fee if > 0
  if (fee > 0) {
    const { data: mtaaWallet } = await supabaseAdmin
      .from("wallet_accounts")
      .select("id, balance, available_balance, user_id")
      .eq("account_type", "main")
      .ilike("wallet_name", "%MTAA%")
      .maybeSingle();

    if (mtaaWallet) {
      // FIXED 2026-07-17: this previously only inserted a wallet_transactions
      // row without ever updating the wallet's actual balance — meaning the
      // platform fee was "recorded" but never actually collected. The
      // platform revenue wallet itself did not exist in production until
      // today either (see migration create_mtaa_platform_revenue_wallet),
      // and is now owned by the founder account (Kevin Nyasani,
      // user_id 8e41ee2e-ae74-43a5-a550-a1d02a5591a3) so this insert
      // satisfies wallet_transactions.user_id's NOT NULL constraint.
      await supabaseAdmin
        .from("wallet_accounts")
        .update({
          balance: (mtaaWallet.balance || 0) + fee,
          available_balance: (mtaaWallet.available_balance || 0) + fee,
        })
        .eq("id", mtaaWallet.id);

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
      });
    }
  }

  return {
    success: true,
    transaction_ref: transactionRef,
    amount: amount,
    fee: fee,
    net_amount: netAmount,
    recipient_id: recipient_id,
    message: `Transfer of KES ${amount} successful. Fee: KES ${fee}.`
  };
}

// ============================================================
// ACTION: WITHDRAW
// Withdraw to bank, M-Pesa, or agent
// ============================================================
async function walletWithdraw(supabaseAdmin, userId, params) {
  const { amount, method = "mpesa", destination, agent_id } = params;

  if (!amount || amount <= 0) {
    throw new Error("Invalid withdrawal amount");
  }

  // Get user wallet
  const { data: wallet } = await supabaseAdmin
    .from("wallet_accounts")
    .select("id, available_balance, currency_code")
    .eq("user_id", userId)
    .eq("account_type", "main")
    .eq("is_active", true)
    .single();

  if (!wallet) throw new Error("Wallet not found");
  if (wallet.available_balance < amount) {
    throw new Error(`Insufficient balance. Available: KES ${wallet.available_balance}`);
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

  // Create withdrawal record
  const { data: withdrawal } = await supabaseAdmin
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

  // Debit wallet
  await supabaseAdmin
    .from("wallet_accounts")
    .update({ available_balance: wallet.available_balance - amount })
    .eq("id", wallet.id);

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
  });

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
    message: `Withdrawal of KES ${amount} initiated. Fee: KES ${fee}. Status: pending.`
  };
}

// ============================================================
// ACTION: EXECUTE
// Execute wallet operation (for hookup/bridge system)
// ============================================================
async function walletExecute(supabaseAdmin, userId, params) {
  const { operation, payload } = params;

  if (!operation) {
    throw new Error("Missing operation type");
  }

  // Route to appropriate action based on operation
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
// Get wallet balance
// ============================================================
async function walletBalance(supabaseAdmin, userId, params) {
  const { wallet_type = "main" } = params;

  const { data: wallet } = await supabaseAdmin
    .from("wallet_accounts")
    .select("id, available_balance, pending_balance, currency_code, wallet_type, wallet_name, is_active")
    .eq("user_id", userId)
    .eq("account_type", wallet_type)
    .single();

  if (!wallet) throw new Error("Wallet not found");

  // Get sub-wallets if main
  let subWallets = [];
  if (wallet_type === "main") {
    const { data: subs } = await supabaseAdmin
      .from("sub_wallets")
      .select("id, name, balance, type")
      .eq("parent_wallet_id", wallet.id)
      .eq("is_active", true);
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
// Get wallet transaction history
// ============================================================
async function walletHistory(supabaseAdmin, userId, params) {
  const { limit = 20, offset = 0, type } = params;

  let query = supabaseAdmin
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (type) {
    query = query.eq("transaction_type", type);
  }

  const { data: transactions, error } = await query;

  if (error) throw new Error("Failed to fetch history: " + error.message);

  // Get total count
  const { count } = await supabaseAdmin
    .from("wallet_transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return {
    success: true,
    transactions: transactions || [],
    total: count || 0,
    limit,
    offset
  };
}
