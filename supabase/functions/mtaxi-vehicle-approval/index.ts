// supabase/functions/mtaxi-vehicle-approval/index.ts
// Admin/marshal approves inspected vehicle, activates for rides

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

    const { vehicle_id, marshal_id, action, rejection_reason } = await req.json();
    if (!vehicle_id || !marshal_id || !action) {
      return new Response(JSON.stringify({ error: "Missing vehicle_id, marshal_id, or action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["approve", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "Action must be 'approve' or 'reject'" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Verify marshal role
    const { data: marshal, error: mErr } = await supabase
      .from("mtaxi_marshals")
      .select("id, user_id, is_active")
      .eq("id", marshal_id)
      .single();
    if (mErr || !marshal?.is_active) {
      return new Response(JSON.stringify({ error: "Unauthorized marshal" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Get vehicle + latest inspection
    const { data: vehicle, error: vErr } = await supabase
      .from("mtaxi_vehicles")
      .select("*, driver:mtaxi_drivers(id, user_id)")
      .eq("id", vehicle_id)
      .single();
    if (vErr || !vehicle) throw new Error("Vehicle not found");

    const { data: inspection, error: iErr } = await supabase
      .from("mtaxi_vehicle_inspections")
      .select("*")
      .eq("vehicle_id", vehicle_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (iErr || !inspection) {
      return new Response(JSON.stringify({ error: "No inspection record found for this vehicle" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (inspection.result !== "pass") {
      return new Response(JSON.stringify({ error: "Vehicle inspection did not pass. Cannot approve." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Get inspection order for escrow release
    const { data: order, error: oErr } = await supabase
      .from("mtaxi_inspection_orders")
      .select("*, garage:mtaxi_garages(id, owner_name)")
      .eq("vehicle_id", vehicle_id)
      .eq("status", "passed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (oErr || !order) throw new Error("Inspection order not found");

    if (action === "approve") {
      // 4a. Activate vehicle
      const { error: updErr } = await supabase
        .from("mtaxi_vehicles")
        .update({ is_active: true, inspection_status: "approved", approved_at: new Date().toISOString(), approved_by: marshal_id })
        .eq("id", vehicle_id);
      if (updErr) throw updErr;

      // 4b. Release escrow to garage
      const { data: escrow, error: eErr } = await supabase
        .from("escrow_accounts")
        .select("id, amount")
        .eq("job_id", order.id)
        .eq("status", "held")
        .single();
      if (escrow) {
        // Get garage wallet
        const { data: garageWallet } = await supabase
          .from("wallets")
          .select("id")
          .eq("user_id", order.garage_id)
          .single();
        if (garageWallet) {
          await supabase.rpc("credit_wallet", {
            p_wallet_id: garageWallet.id,
            p_amount: escrow.amount,
            p_description: `Inspection fee released for vehicle ${vehicle_id}`,
          });
          await supabase.from("escrow_accounts").update({ status: "released", released_at: new Date().toISOString() }).eq("id", escrow.id);
        }
      }

      // 4c. Update driver status
      await supabase.from("mtaxi_drivers").update({ vehicle_approved: true }).eq("id", vehicle.driver_id);

      // 4d. Log marshal action
      await supabase.from("mtaxi_marshal_reports").insert({
        marshal_id,
        target_type: "vehicle",
        target_id: vehicle_id,
        action: "approved",
        notes: `Vehicle ${vehicle.plate_number} approved after inspection pass`,
      });

      // 4e. Notify driver
      await supabase.from("mtaxi_messages").insert({
        sender_id: marshal_id,
        receiver_id: vehicle.driver.user_id,
        type: "vehicle_approved",
        content: `Your vehicle ${vehicle.plate_number} has been approved. You can now start accepting rides.`,
      });

      return new Response(JSON.stringify({
        success: true,
        vehicle_id,
        status: "approved",
        message: "Vehicle approved and activated. Garage paid from escrow.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else {
      // REJECT
      const { error: updErr } = await supabase
        .from("mtaxi_vehicles")
        .update({ is_active: false, inspection_status: "rejected", rejected_at: new Date().toISOString(), rejected_by: marshal_id, rejection_reason })
        .eq("id", vehicle_id);
      if (updErr) throw updErr;

      // Refund escrow to driver
      const { data: escrow } = await supabase
        .from("escrow_accounts")
        .select("id, amount, payer_wallet_id")
        .eq("job_id", order.id)
        .eq("status", "held")
        .single();
      if (escrow) {
        await supabase.rpc("credit_wallet", {
          p_wallet_id: escrow.payer_wallet_id,
          p_amount: escrow.amount,
          p_description: `Inspection fee refunded — vehicle ${vehicle_id} rejected by marshal`,
        });
        await supabase.from("escrow_accounts").update({ status: "refunded", released_at: new Date().toISOString() }).eq("id", escrow.id);
      }

      await supabase.from("mtaxi_marshal_reports").insert({
        marshal_id,
        target_type: "vehicle",
        target_id: vehicle_id,
        action: "rejected",
        notes: rejection_reason || "Vehicle rejected by marshal",
      });

      await supabase.from("mtaxi_messages").insert({
        sender_id: marshal_id,
        receiver_id: vehicle.driver.user_id,
        type: "vehicle_rejected",
        content: `Your vehicle ${vehicle.plate_number} was rejected. Reason: ${rejection_reason || "No reason provided"}. Inspection fee refunded.`,
      });

      return new Response(JSON.stringify({
        success: true,
        vehicle_id,
        status: "rejected",
        message: "Vehicle rejected. Inspection fee refunded to driver.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
