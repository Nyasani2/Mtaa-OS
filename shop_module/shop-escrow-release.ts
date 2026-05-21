// supabase/functions/shop-escrow-release/index.ts
// Release escrow when delivery receipt is scanned

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { order_id, receipt_url, delivery_agent_id } = await req.json();
    if (!order_id) throw new Error("order_id required");

    // Get order
    const { data: order } = await supabase
      .from("shop_orders")
      .select("*, escrow:escrow_account_id(*)")
      .eq("id", order_id)
      .single();

    if (!order) throw new Error("Order not found");
    if (!order.escrow_enabled) throw new Error("Escrow not enabled for this order");
    if (order.status !== "out_for_delivery") throw new Error("Order not out for delivery");

    // Update order
    const { error: updateError } = await supabase
      .from("shop_orders")
      .update({
        status: "delivered",
        delivered_at: new Date().toISOString(),
        delivery_receipt_scanned: true,
        delivery_receipt_url: receipt_url,
        delivery_agent_id,
        payment_status: "paid",
      })
      .eq("id", order_id);

    if (updateError) throw updateError;

    // Release escrow
    if (order.escrow_account_id) {
      await supabase
        .from("escrow_accounts")
        .update({
          status: "released",
          released_at: new Date().toISOString(),
          release_method: "delivery_receipt",
        })
        .eq("id", order.escrow_account_id);
    }

    // Credit shop wallet
    const { data: shopWallet } = await supabase
      .from("wallets")
      .select("id")
      .eq("owner_id", order.shop_id)
      .eq("wallet_type", "shop")
      .single();

    if (shopWallet) {
      await supabase.rpc("credit_wallet", {
        p_wallet_id: shopWallet.id,
        p_amount: order.total_amount - (order.affiliate_commission || 0),
        p_description: `Order ${order.order_number} delivery confirmed`,
        p_reference_type: "shop_order",
        p_reference_id: order_id,
      });
    }

    // Pay affiliate commission
    if (order.affiliate_id && order.affiliate_commission > 0) {
      await supabase
        .from("shop_affiliate_conversions")
        .insert({
          affiliate_id: order.affiliate_id,
          order_id: order_id,
          commission_amount: order.affiliate_commission,
          status: "approved",
        });

      await supabase
        .from("shop_affiliates")
        .update({
          total_earnings: supabase.rpc("increment", { x: order.affiliate_commission }),
          balance: supabase.rpc("increment", { x: order.affiliate_commission }),
          total_conversions: supabase.rpc("increment", { x: 1 }),
        })
        .eq("id", order.affiliate_id);
    }

    return new Response(JSON.stringify({ success: true, message: "Escrow released, payment transferred" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
