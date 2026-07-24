
// ============================================================
// MTAA TRIBE OPERATIONS — CONSOLIDATED EDGE FUNCTION
// Actions: donate, join_paid
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
      case "donate":
        result = await tribeDonate(supabaseAdmin, user.id, params);
        break;
      case "join_paid":
        result = await tribeJoinPaid(supabaseAdmin, user.id, params);
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
// ACTION: DONATE
// Donate to a tribe/cause
// ============================================================
async function tribeDonate(supabaseAdmin, donorId, params) {
  const { tribe_id, amount, message } = params;

  if (!tribe_id || !amount || amount <= 0) {
    throw new Error("Missing tribe_id or invalid amount");
  }

  // Get tribe details
  const { data: tribe } = await supabaseAdmin
    .from("tribes")
    .select("id, name, owner_id, wallet_id")
    .eq("id", tribe_id)
    .single();

  if (!tribe) throw new Error("Tribe not found");

  // Get donor wallet
  const { data: donorWallet } = await supabaseAdmin
    .from("wallet_accounts")
    .select("id, available_balance")
    .eq("user_id", donorId)
    .eq("account_type", "main")
    .eq("is_active", true)
    .single();

  if (!donorWallet) throw new Error("Wallet not found");
  if (donorWallet.available_balance < amount) {
    throw new Error(`Insufficient balance. Available: KES ${donorWallet.available_balance}`);
  }

  // Get tribe wallet or owner wallet
  let recipientWalletId = tribe.wallet_id;
  if (!recipientWalletId) {
    const { data: ownerWallet } = await supabaseAdmin
      .from("wallet_accounts")
      .select("id")
      .eq("user_id", tribe.owner_id)
      .eq("account_type", "main")
      .single();
    recipientWalletId = ownerWallet?.id;
  }

  if (!recipientWalletId) throw new Error("Tribe wallet not configured");

  // Get fee
  const { data: feeConfig } = await supabaseAdmin
    .from("platform_fees")
    .select("percentage")
    .eq("module", "tribes")
    .eq("active", true)
    .maybeSingle();

  const feePercentage = feeConfig?.percentage || 1.0;
  const fee = Math.round(amount * (feePercentage / 100) * 100) / 100;
  const netAmount = amount - fee;

  const transactionRef = `TRD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Debit donor
  await supabaseAdmin
    .from("wallet_accounts")
    .update({ available_balance: donorWallet.available_balance - amount })
    .eq("id", donorWallet.id);

  // Credit tribe
  const { data: tribeWalletCurrent } = await supabaseAdmin
    .from("wallet_accounts")
    .select("available_balance")
    .eq("id", recipientWalletId)
    .single();

  await supabaseAdmin
    .from("wallet_accounts")
    .update({ available_balance: (tribeWalletCurrent?.available_balance || 0) + netAmount })
    .eq("id", recipientWalletId);

  // Record transactions
  await supabaseAdmin.from("wallet_transactions").insert([
    {
      wallet_id: donorWallet.id,
      user_id: donorId,
      transaction_type: "tribe_donation",
      direction: "debit",
      amount: amount,
      net_amount: -amount,
      status: "completed",
      counterparty_wallet_id: recipientWalletId,
      metadata: { tribe_id, tribe_name: tribe.name, message, transaction_ref: transactionRef, fee }
    },
    {
      wallet_id: recipientWalletId,
      user_id: tribe.owner_id,
      transaction_type: "tribe_donation",
      direction: "credit",
      amount: netAmount,
      net_amount: netAmount,
      status: "completed",
      counterparty_wallet_id: donorWallet.id,
      metadata: { tribe_id, tribe_name: tribe.name, donor_id: donorId, message, transaction_ref: transactionRef, fee }
    }
  ]);

  // Record in tribe donations table
  await supabaseAdmin.from("tribe_donations").insert({
    tribe_id: tribe_id,
    donor_id: donorId,
    amount: amount,
    fee: fee,
    net_amount: netAmount,
    message: message,
    transaction_ref: transactionRef
  });

  return {
    success: true,
    transaction_ref: transactionRef,
    amount: amount,
    fee: fee,
    net_amount: netAmount,
    tribe: {
      id: tribe.id,
      name: tribe.name
    },
    message: `Donated KES ${amount} to ${tribe.name}. Fee: KES ${fee}.`
  };
}

// ============================================================
// ACTION: JOIN_PAID
// Join a paid tribe
// ============================================================
async function tribeJoinPaid(supabaseAdmin, userId, params) {
  const { tribe_id } = params;

  if (!tribe_id) {
    throw new Error("Missing tribe_id");
  }

  // Get tribe
  const { data: tribe } = await supabaseAdmin
    .from("tribes")
    .select("id, name, owner_id, wallet_id, join_fee, is_paid")
    .eq("id", tribe_id)
    .single();

  if (!tribe) throw new Error("Tribe not found");
  if (!tribe.is_paid || !tribe.join_fee || tribe.join_fee <= 0) {
    throw new Error("This tribe is free to join");
  }

  // Check if already member
  const { data: existingMember } = await supabaseAdmin
    .from("tribe_members")
    .select("id")
    .eq("tribe_id", tribe_id)
    .eq("user_id", userId)
    .single();

  if (existingMember) {
    throw new Error("You are already a member of this tribe");
  }

  // Get user wallet
  const { data: userWallet } = await supabaseAdmin
    .from("wallet_accounts")
    .select("id, available_balance")
    .eq("user_id", userId)
    .eq("account_type", "main")
    .eq("is_active", true)
    .single();

  if (!userWallet) throw new Error("Wallet not found");
  if (userWallet.available_balance < tribe.join_fee) {
    throw new Error(`Insufficient balance. Required: KES ${tribe.join_fee}, Available: KES ${userWallet.available_balance}`);
  }

  // Get tribe wallet
  let tribeWalletId = tribe.wallet_id;
  if (!tribeWalletId) {
    const { data: ownerWallet } = await supabaseAdmin
      .from("wallet_accounts")
      .select("id")
      .eq("user_id", tribe.owner_id)
      .eq("account_type", "main")
      .single();
    tribeWalletId = ownerWallet?.id;
  }

  if (!tribeWalletId) throw new Error("Tribe wallet not configured");

  const feePercentage = 1.0;
  const fee = Math.round(tribe.join_fee * (feePercentage / 100) * 100) / 100;
  const netAmount = tribe.join_fee - fee;
  const transactionRef = `TRJ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Debit user
  await supabaseAdmin
    .from("wallet_accounts")
    .update({ available_balance: userWallet.available_balance - tribe.join_fee })
    .eq("id", userWallet.id);

  // Credit tribe
  const { data: tribeWalletCurrent } = await supabaseAdmin
    .from("wallet_accounts")
    .select("available_balance")
    .eq("id", tribeWalletId)
    .single();

  await supabaseAdmin
    .from("wallet_accounts")
    .update({ available_balance: (tribeWalletCurrent?.available_balance || 0) + netAmount })
    .eq("id", tribeWalletId);

  // Add member
  await supabaseAdmin.from("tribe_members").insert({
    tribe_id: tribe_id,
    user_id: userId,
    role: "member",
    joined_at: new Date().toISOString(),
    join_fee_paid: tribe.join_fee
  });

  // Record transactions
  await supabaseAdmin.from("wallet_transactions").insert([
    {
      wallet_id: userWallet.id,
      user_id: userId,
      transaction_type: "tribe_join",
      direction: "debit",
      amount: tribe.join_fee,
      net_amount: -tribe.join_fee,
      status: "completed",
      counterparty_wallet_id: tribeWalletId,
      metadata: { tribe_id, tribe_name: tribe.name, transaction_ref: transactionRef, fee }
    },
    {
      wallet_id: tribeWalletId,
      user_id: tribe.owner_id,
      transaction_type: "tribe_join",
      direction: "credit",
      amount: netAmount,
      net_amount: netAmount,
      status: "completed",
      counterparty_wallet_id: userWallet.id,
      metadata: { tribe_id, tribe_name: tribe.name, member_id: userId, transaction_ref: transactionRef, fee }
    }
  ]);

  return {
    success: true,
    transaction_ref: transactionRef,
    join_fee: tribe.join_fee,
    fee: fee,
    net_amount: netAmount,
    tribe: {
      id: tribe.id,
      name: tribe.name
    },
    message: `Joined ${tribe.name} successfully. Fee: KES ${tribe.join_fee}.`
  };
}
