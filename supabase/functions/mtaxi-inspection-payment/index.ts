import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { inspection_order_id } = await req.json();
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { global: { headers: { Authorization: authHeader! } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data: order } = await supabase.from("mtaxi_inspection_orders").select("*, vehicle:mtaxi_vehicles(id, driver_id)").eq("id", inspection_order_id).single();
    if (!order) return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });

    const { data: wallet } = await supabase.from("wallets").select("id, balance, currency").eq("user_id", user.id).eq("wallet_type", "main").single();
    if (!wallet) return new Response(JSON.stringify({ error: "Wallet not found" }), { status: 404 });

    const fee = order.fee || 1000;
    if (wallet.balance < fee) return new Response(JSON.stringify({ error: "Insufficient balance" }), { status: 400 });

    const { data: escrow } = await supabase.from("wallet_escrows").insert({
      reference_id: inspection_order_id, user_id: user.id, amount: fee,
      status: "held", module: "mtaxi_inspection", created_at: new Date().toISOString()
    }).select().single();

    await supabase.from("mtaxi_inspection_orders").update({ payment_status: "paid" }).eq("id", inspection_order_id);
    const { data: payment } = await supabase.from("mtaxi_inspection_payments").insert({
      inspection_order_id, driver_id: user.id, amount: fee, currency: wallet.currency || "KES",
      escrow_id: escrow?.id, status: "completed", paid_at: new Date().toISOString()
    }).select().single();

    return new Response(JSON.stringify({ success: true, payment }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});