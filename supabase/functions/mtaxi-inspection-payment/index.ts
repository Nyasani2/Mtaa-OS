import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


// ─── SECURITY: Centralized Treasury & Tax IDs ───
const TREASURY_USER_ID = Deno.env.get('TREASURY_USER_ID') || '8e41ee2e-ae74-43a5-a550-a1d02a5591a3';
const TAX_AUTHORITY_ID = Deno.env.get('FALLBACK_TAX_USER_ID') || '8e41ee2e-ae74-43a5-a550-a1d02a5591a3';

// ─── SECURITY: Service Role Client for System Updates ───
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
serve(async (req) => {
  try {
    const { inspection_order_id } = await req.json()
    // ─── SECURITY: Verify Caller Identity ───
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: corsHeaders });
    }
    const caller_id = user.id;

    

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