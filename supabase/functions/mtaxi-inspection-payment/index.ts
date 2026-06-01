// supabase/functions/mtaxi-inspection-payment/index.ts
// Handle escrow payment for inspection fee

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { inspection_order_id, wallet_id, payment_method } = await req.json();
    if (!inspection_order_id || !wallet_id) {
      return new Response(JSON.stringify({ error: "Missing inspection_order_id or wallet_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Get inspection order
    const { data: order, error: oErr } = await supabase
      .from("mtaxi_inspection_orders")
      .select("*, vehicle:mtaxi_vehicles(id, driver_id)")
      .eq("id", inspection_order_id)
      .single();
    if (oErr || !order) throw new Error("Inspection order not found");
    if (order.payment_status === "paid") {
      return new Response(JSON.stringify({ error: "Already paid" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Check wallet balance
    const { data: wallet, error: wErr } = await supabase
      .from("wallets")
      .select("id, balance, currency")
      .eq("id", wallet_id)
      .eq("user_id", order.vehicle.driver_id)
      .single();
    if (wErr || !wallet) throw new Error("Wallet not found");
    if (wallet.balance < order.inspection_fee) {
      return new Response(JSON.stringify({ error: "Insufficient wallet balance" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Deduct from driver wallet (escrow hold)
    const { error: debitErr } = await supabase.rpc("debit_wallet", {
      p_wallet_id: wallet_id,
      p_amount: order.inspection_fee,
      p_description: `Inspection fee for vehicle ${order.vehicle_id}`,
    });
    if (debitErr) throw debitErr;

    // 4. Create escrow record
    const { data: escrow, error: eErr } = await supabase
      .from("escrow_accounts")
      .insert({
        job_id: inspection_order_id,
        payer_wallet_id: wallet_id,
        payee_wallet_id: null, // Will be garage wallet after inspection complete
        amount: order.inspection_fee,
        status: "held",
        description: `Inspection fee escrow for order ${inspection_order_id}`,
      })
      .select()
      .single();
    if (eErr) throw eErr;

    // 5. Update inspection order + create payment record
    await supabase.from("mtaxi_inspection_orders").update({ payment_status: "paid" }).eq("id", inspection_order_id);

    const { data: payment, error: pErr } = await supabase
      .from("mtaxi_inspection_payments")
      .insert({
        user_id: order.vehicle.driver_id,
        vehicle_id: order.vehicle_id,
        garage_id: order.garage_id,
        amount: order.inspection_fee,
        payment_status: "completed",
        qr_code: `MTAXI-INSP-${inspection_order_id}`,
      })
      .select()
      .single();
    if (pErr) throw pErr;

    return new Response(JSON.stringify({
      success: true,
      escrow,
      payment,
      message: `Inspection fee of ${order.inspection_fee} held in escrow. Garage will be paid after inspection completion.`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
