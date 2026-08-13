
// ============================================================
// MTAA MARKETPLACE OPERATIONS — CONSOLIDATED EDGE FUNCTION
// Actions: checkout, confirm_delivery, seller_payout, escrow_release
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
      case "checkout":
        result = await marketplaceCheckout(supabaseAdmin, user.id, params);
        break;
      case "confirm_delivery":
        result = await confirmDelivery(supabaseAdmin, user.id, params);
        break;
      case "seller_payout":
        result = await sellerPayout(supabaseAdmin, user.id, params);
        break;
      case "escrow_release":
        result = await escrowRelease(supabaseAdmin, user.id, params);
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
// ACTION: CHECKOUT
// Process marketplace checkout with escrow
// ============================================================
async function marketplaceCheckout(supabaseAdmin, buyerId, params) {
  const { items, shipping_address, total_amount } = params;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error("No items in cart");
  }

  if (!total_amount || total_amount <= 0) {
    throw new Error("Invalid total amount");
  }

  // Get buyer wallet
  const { data: buyerWallet } = await supabaseAdmin
    .from("wallet_accounts")
    .select("id, available_balance")
    .eq("user_id", buyerId)
    .eq("account_type", "main")
    .eq("is_active", true)
    .single();

  if (!buyerWallet) throw new Error("Buyer wallet not found");
  if (buyerWallet.available_balance < total_amount) {
    throw new Error(`Insufficient balance. Required: KES ${total_amount}`);
  }

  // Get MTAA fee
  const { data: feeConfig } = await supabaseAdmin
    .from("platform_fees")
    .select("percentage")
    .eq("module", "marketplace")
    .eq("active", true)
    .maybeSingle();

  const feePercentage = feeConfig?.percentage || 2.0;
  const mtaaFee = Math.round(total_amount * (feePercentage / 100) * 100) / 100;

  const orderRef = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create order
  const { data: order } = await supabaseAdmin
    .from("orders")
    .insert({
      buyer_id: buyerId,
      total_amount: total_amount,
      shipping_address: shipping_address,
      status: "pending_payment",
      order_ref: orderRef
    })
    .select()
    .single();

  // Create order items
  const orderItems = items.map((item: any) => ({
    order_id: order.id,
    product_id: item.product_id,
    seller_id: item.seller_id,
    quantity: item.quantity,
    price: item.price,
    total: item.price * item.quantity
  }));

  await supabaseAdmin.from("order_items").insert(orderItems);

  // Create escrow record
  const { data: escrow } = await supabaseAdmin
    .from("escrow")
    .insert({
      order_id: order.id,
      buyer_id: buyerId,
      amount: total_amount,
      status: "pending",
      escrow_ref: `ESC-${orderRef}`
    })
    .select()
    .single();

  // Debit buyer wallet
  await supabaseAdmin
    .from("wallet_accounts")
    .update({ available_balance: buyerWallet.available_balance - total_amount })
    .eq("id", buyerWallet.id);

  // Record transaction
  await supabaseAdmin.from("wallet_transactions").insert({
    wallet_id: buyerWallet.id,
    user_id: buyerId,
    transaction_type: "marketplace_checkout",
    direction: "debit",
    amount: total_amount,
    net_amount: -total_amount,
    status: "completed",
    metadata: { order_id: order.id, escrow_id: escrow.id, order_ref: orderRef }
  });

  return {
    success: true,
    order: {
      id: order.id,
      order_ref: orderRef,
      total_amount: total_amount,
      status: order.status
    },
    escrow: {
      id: escrow.id,
      escrow_ref: escrow.escrow_ref,
      status: escrow.status
    },
    message: `Order placed. KES ${total_amount} held in escrow. Awaiting delivery.`
  };
}

// ============================================================
// ACTION: CONFIRM_DELIVERY
// Buyer confirms delivery, release escrow to seller
// ============================================================
async function confirmDelivery(supabaseAdmin, buyerId, params) {
  const { order_id } = params;

  if (!order_id) {
    throw new Error("Missing order_id");
  }

  // Verify order belongs to buyer and is delivered
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(seller_id, total), escrow(id, amount, status)")
    .eq("id", order_id)
    .eq("buyer_id", buyerId)
    .single();

  if (!order) throw new Error("Order not found");
  if (order.status !== "delivered") {
    throw new Error("Order not yet delivered. Cannot confirm.");
  }

  const escrow = order.escrow;
  if (!escrow || escrow.status !== "pending") {
    throw new Error("Escrow not found or already released");
  }

  // Release escrow to sellers
  for (const item of order.order_items) {
    const { data: sellerWallet } = await supabaseAdmin
      .from("wallet_accounts")
      .select("id, available_balance")
      .eq("user_id", item.seller_id)
      .eq("account_type", "main")
      .single();

    if (sellerWallet) {
      // Get fee for this seller's portion
      const { data: feeConfig } = await supabaseAdmin
        .from("platform_fees")
        .select("percentage")
        .eq("module", "marketplace")
        .eq("active", true)
        .maybeSingle();

      const feePercentage = feeConfig?.percentage || 2.0;
      const sellerFee = Math.round(item.total * (feePercentage / 100) * 100) / 100;
      const netAmount = item.total - sellerFee;

      // Credit seller
      await supabaseAdmin
        .from("wallet_accounts")
        .update({ available_balance: sellerWallet.available_balance + netAmount })
        .eq("id", sellerWallet.id);

      // Record seller transaction
      await supabaseAdmin.from("wallet_transactions").insert({
        wallet_id: sellerWallet.id,
        user_id: item.seller_id,
        transaction_type: "marketplace_sale",
        direction: "credit",
        amount: item.total,
        net_amount: netAmount,
        status: "completed",
        metadata: { order_id: order.id, escrow_id: escrow.id, fee: sellerFee }
      });

      // Record creator earnings
      await supabaseAdmin.from("creator_earnings").insert({
        user_id: item.seller_id,
        source_id: order.id,
        source_module: "marketplace",
        source_table: "orders",
        earning_type: "marketplace_sale",
        gross_amount: item.total,
        platform_fee: sellerFee,
        net_amount: netAmount,
        currency: "KES",
        status: "credited"
      });
    }
  }

  // Update escrow status
  await supabaseAdmin
    .from("escrow")
    .update({ status: "released", released_at: new Date().toISOString() })
    .eq("id", escrow.id);

  // Update order status
  await supabaseAdmin
    .from("orders")
    .update({ status: "completed" })
    .eq("id", order_id);

  return {
    success: true,
    order_id: order_id,
    escrow_status: "released",
    message: "Delivery confirmed. Funds released to seller(s)."
  };
}

// ============================================================
// ACTION: SELLER_PAYOUT
// Process seller payout (withdraw earnings)
// ============================================================
async function sellerPayout(supabaseAdmin, sellerId, params) {
  const { amount, method = "mpesa", destination } = params;

  if (!amount || amount <= 0) {
    throw new Error("Invalid amount");
  }

  // Get seller wallet
  const { data: sellerWallet } = await supabaseAdmin
    .from("wallet_accounts")
    .select("id, available_balance")
    .eq("user_id", sellerId)
    .eq("account_type", "main")
    .single();

  if (!sellerWallet) throw new Error("Seller wallet not found");
  if (sellerWallet.available_balance < amount) {
    throw new Error(`Insufficient balance. Available: KES ${sellerWallet.available_balance}`);
  }

  // Create payout record
  const { data: payout } = await supabaseAdmin
    .from("wallet_payouts")
    .insert({
      wallet_id: sellerWallet.id,
      user_id: sellerId,
      amount: amount,
      method: method,
      destination: destination,
      status: "pending"
    })
    .select()
    .single();

  // Debit seller wallet
  await supabaseAdmin
    .from("wallet_accounts")
    .update({ available_balance: sellerWallet.available_balance - amount })
    .eq("id", sellerWallet.id);

  // Record transaction
  await supabaseAdmin.from("wallet_transactions").insert({
    wallet_id: sellerWallet.id,
    user_id: sellerId,
    transaction_type: "seller_payout",
    direction: "debit",
    amount: amount,
    net_amount: -amount,
    status: "pending",
    metadata: { payout_id: payout.id, method, destination }
  });

  return {
    success: true,
    payout: {
      id: payout.id,
      amount: payout.amount,
      status: payout.status,
      method: payout.method
    },
    message: `Payout of KES ${amount} initiated via ${method}.`
  };
}

// ============================================================
// ACTION: ESCROW_RELEASE
// Admin/arbiter releases escrow manually
// ============================================================
async function escrowRelease(supabaseAdmin, adminId, params) {
  const { escrow_id, reason } = params;

  if (!escrow_id) {
    throw new Error("Missing escrow_id");
  }

  // Verify admin
  const { data: admin } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", adminId)
    .in("role", ["admin", "moderator"])
    .single();

  if (!admin) {
    throw new Error("Unauthorized. Only admins can release escrow manually.");
  }

  // Get escrow
  const { data: escrow } = await supabaseAdmin
    .from("escrow")
    .select("*, orders(buyer_id, order_items(seller_id, total))")
    .eq("id", escrow_id)
    .single();

  if (!escrow) throw new Error("Escrow not found");
  if (escrow.status !== "pending") {
    throw new Error("Escrow already released or cancelled");
  }

  // Release to sellers
  for (const item of escrow.orders.order_items) {
    const { data: sellerWallet } = await supabaseAdmin
      .from("wallet_accounts")
      .select("id, available_balance")
      .eq("user_id", item.seller_id)
      .eq("account_type", "main")
      .single();

    if (sellerWallet) {
      await supabaseAdmin
        .from("wallet_accounts")
        .update({ available_balance: sellerWallet.available_balance + item.total })
        .eq("id", sellerWallet.id);
    }
  }

  // Update escrow
  await supabaseAdmin
    .from("escrow")
    .update({
      status: "released",
      released_at: new Date().toISOString(),
      released_by: adminId,
      release_reason: reason
    })
    .eq("id", escrow_id);

  return {
    success: true,
    escrow_id: escrow_id,
    status: "released",
    message: `Escrow ${escrow_id} released manually by admin. Reason: ${reason || "N/A"}`
  };
}
