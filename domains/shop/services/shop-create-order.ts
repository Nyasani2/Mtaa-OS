// supabase/functions/shop-create-order/index.ts
// Create order with inventory deduction, affiliate tracking, escrow setup

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

    const {
      shop_id,
      customer_id,
      items,
      delivery_type = "pickup",
      delivery_address,
      delivery_fee = 0,
      discount_amount = 0,
      payment_method = "cash",
      affiliate_code,
      pos_session_id,
      is_pos_order = false,
    } = await req.json();

    // Validate shop
    const { data: shop } = await supabase.from("shops").select("*").eq("id", shop_id).single();
    if (!shop) throw new Error("Shop not found");

    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.quantity * item.unit_price;
    }

    const tax_rate = shop.settings?.tax_rate || 15;
    const tax_amount = subtotal * (tax_rate / 100);
    const total_amount = subtotal + tax_amount + delivery_fee - discount_amount;

    // Generate order number
    const orderNumber = `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.floor(Math.random()*10000).toString().padStart(4,"0")}`;

    // Check affiliate
    let affiliate_id = null;
    let affiliate_commission = 0;
    if (affiliate_code) {
      const { data: affiliate } = await supabase
        .from("shop_affiliates")
        .select("*, program:shop_affiliate_programs(*)")
        .eq("referral_code", affiliate_code)
        .eq("shop_id", shop_id)
        .eq("status", "active")
        .single();

      if (affiliate && affiliate.program?.is_active) {
        affiliate_id = affiliate.id;
        if (affiliate.program.commission_type === "percentage") {
          affiliate_commission = total_amount * (affiliate.program.commission_value / 100);
        } else if (affiliate.program.commission_type === "fixed") {
          affiliate_commission = affiliate.program.commission_value;
        }
      }
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("shop_orders")
      .insert({
        shop_id,
        customer_id,
        order_number: orderNumber,
        status: is_pos_order ? "confirmed" : "pending",
        subtotal,
        tax_amount,
        delivery_fee,
        discount_amount,
        total_amount,
        payment_status: payment_method === "cash" ? "paid" : "pending",
        payment_method,
        delivery_type,
        delivery_address,
        affiliate_id,
        affiliate_commission,
        pos_session_id,
        is_pos_order,
        escrow_enabled: shop.settings?.escrow_enabled && delivery_type === "delivery",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
      variant_data: item.variant_data || {},
    }));

    const { error: itemsError } = await supabase.from("shop_order_items").insert(orderItems);
    if (itemsError) throw itemsError;

    // Deduct inventory for POS orders immediately
    if (is_pos_order) {
      for (const item of items) {
        if (item.product_id) {
          await supabase.from("inventory_transactions").insert({
            shop_id,
            product_id: item.product_id,
            type: "sale",
            quantity: -item.quantity,
            unit_cost: item.cost_price || 0,
            total_cost: -(item.quantity * (item.cost_price || 0)),
            reference_type: "order",
            reference_id: order.id,
            performed_by: customer_id,
          });
        }
      }
    }

    // Create escrow account if enabled
    if (order.escrow_enabled) {
      const { data: escrow } = await supabase
        .from("escrow_accounts")
        .insert({
          order_id: order.id,
          shop_id,
          customer_id,
          amount: total_amount,
          status: "funded",
          release_conditions: { delivery_receipt_scanned: false },
        })
        .select()
        .single();

      if (escrow) {
        await supabase.from("shop_orders")
          .update({ escrow_account_id: escrow.id })
          .eq("id", order.id);
      }
    }

    // Create journal entry for accounting
    await supabase.rpc("create_order_journal_entry", {
      p_order_id: order.id,
      p_shop_id: shop_id,
    });

    return new Response(JSON.stringify({ success: true, order }), {
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
