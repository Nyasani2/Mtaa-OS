// supabase/functions/mtaxi-onboard-vehicle/index.ts
// Register new truck, create inspection order, assign to partner garage

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

    const { driver_id, vehicle_type, make, model, color, plate_number, capacity, garage_id } = await req.json();
    if (!driver_id || !vehicle_type || !plate_number) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Register vehicle (inactive until inspection passes)
    const { data: vehicle, error: vErr } = await supabase
      .from("mtaxi_vehicles")
      .insert({ driver_id, vehicle_type, make, model, color, plate_number, capacity, is_active: false })
      .select()
      .single();
    if (vErr) throw vErr;

    // 2. If garage_id provided, assign inspection order
    let inspectionOrder = null;
    if (garage_id) {
      const { data: garage, error: gErr } = await supabase
        .from("mtaxi_garages")
        .select("id, approved, application_fee_paid")
        .eq("id", garage_id)
        .single();
      if (gErr || !garage?.approved) {
        return new Response(JSON.stringify({ error: "Invalid or unapproved garage" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: order, error: oErr } = await supabase
        .from("mtaxi_inspection_orders")
        .insert({
          vehicle_id: vehicle.id,
          garage_id,
          driver_id,
          status: "pending",
          inspection_fee: 2500, // Default fee in local currency
          payment_status: "unpaid",
        })
        .select()
        .single();
      if (oErr) throw oErr;
      inspectionOrder = order;
    }

    return new Response(JSON.stringify({
      success: true,
      vehicle,
      inspection_order: inspectionOrder,
      message: inspectionOrder
        ? "Vehicle registered. Inspection order created. Pay inspection fee to proceed."
        : "Vehicle registered. Assign a garage for inspection.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
