import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { vehicle_id, action, marshal_id, rejection_reason } = await req.json();
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { global: { headers: { Authorization: authHeader! } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data: marshal } = await supabase.from("mtaxi_marshals").select("id, user_id, is_active").eq("user_id", user.id).eq("is_active", true).single();
    if (!marshal) return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403 });

    const { data: vehicle } = await supabase.from("mtaxi_vehicles").select("*, driver:mtaxi_drivers(id, user_id)").eq("id", vehicle_id).single();
    if (!vehicle) return new Response(JSON.stringify({ error: "Vehicle not found" }), { status: 404 });

    const { data: inspection } = await supabase.from("mtaxi_vehicle_inspections").select("*").eq("vehicle_id", vehicle_id).eq("status", "passed").single();
    const { data: order } = await supabase.from("mtaxi_inspection_orders").select("*, garage:mtaxi_garages(id, owner_name)").eq("vehicle_id", vehicle_id).eq("payment_status", "paid").single();

    if (action === "approve") {
      if (!inspection) return new Response(JSON.stringify({ error: "Inspection not passed" }), { status: 400 });
      await supabase.from("mtaxi_vehicles").update({ is_active: true, inspection_status: "approved", approved_at: new Date().toISOString(), approved_by: marshal_id }).eq("id", vehicle_id);

      const { data: escrow } = await supabase.from("wallet_escrows").select("id, amount").eq("reference_id", order?.id).eq("status", "held").maybeSingle();
      if (escrow) {
        const { data: garageWallet } = await supabase.from("wallets").select("id").eq("user_id", order?.garage?.id).maybeSingle();
        if (garageWallet) {
          await supabase.rpc("mtaa_add_wallet_transaction", { p_user_id: order.garage.id, p_amount: escrow.amount, p_transaction_type: "inspection_fee", p_status: "completed", p_currency: "KES", p_description: `Inspection fee for vehicle ${vehicle_id}`, p_reference_type: "inspection_order", p_reference_id: order.id, p_provider: "mtaxi", p_metadata: {} });
        }
        await supabase.from("wallet_escrows").update({ status: "released", released_at: new Date().toISOString() }).eq("id", escrow.id);
      }
      await supabase.from("mtaxi_drivers").update({ vehicle_approved: true }).eq("id", vehicle.driver_id);
      await supabase.from("mtaxi_marshal_reports").insert({ marshal_id: user.id, vehicle_id, action: "approved", notes: "Vehicle approved after inspection" });
      await supabase.from("mtaxi_messages").insert({ sender_id: user.id, receiver_id: vehicle.driver?.user_id, type: "vehicle_approved", content: `Your vehicle ${vehicle.plate_number} has been approved.` });
      return new Response(JSON.stringify({ success: true, message: "Vehicle approved" }), { status: 200 });
    } else if (action === "reject") {
      await supabase.from("mtaxi_vehicles").update({ is_active: false, inspection_status: "rejected", rejected_at: new Date().toISOString(), rejected_by: marshal_id, rejection_reason }).eq("id", vehicle_id);
      const { data: escrow } = await supabase.from("wallet_escrows").select("id, amount, user_id").eq("reference_id", order?.id).eq("status", "held").maybeSingle();
      if (escrow) {
        await supabase.rpc("mtaa_add_wallet_transaction", { p_user_id: escrow.user_id, p_amount: escrow.amount, p_transaction_type: "inspection_refund", p_status: "completed", p_currency: "KES", p_description: `Refund for rejected vehicle ${vehicle_id}`, p_reference_type: "inspection_order", p_reference_id: order.id, p_provider: "mtaxi", p_metadata: {} });
        await supabase.from("wallet_escrows").update({ status: "refunded", released_at: new Date().toISOString() }).eq("id", escrow.id);
      }
      await supabase.from("mtaxi_marshal_reports").insert({ marshal_id: user.id, vehicle_id, action: "rejected", notes: rejection_reason });
      await supabase.from("mtaxi_messages").insert({ sender_id: user.id, receiver_id: vehicle.driver?.user_id, type: "vehicle_rejected", content: `Your vehicle ${vehicle.plate_number} was rejected. Reason: ${rejection_reason}` });
      return new Response(JSON.stringify({ success: true, message: "Vehicle rejected" }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});