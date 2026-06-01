// supabase/functions/mtaxi-inspection-complete/index.ts
// Garage submits inspection results, auto-approve/reject vehicle

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

    const {
      inspection_order_id,
      inspector_id,
      fire_extinguisher,
      first_aid_kit,
      triangles,
      tyres,
      lights,
      brakes,
      notes,
    } = await req.json();

    if (!inspection_order_id || !inspector_id) {
      return new Response(JSON.stringify({ error: "Missing inspection_order_id or inspector_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Verify inspection order exists and is paid
    const { data: order, error: oErr } = await supabase
      .from("mtaxi_inspection_orders")
      .select("*, vehicle:mtaxi_vehicles(id, driver_id)")
      .eq("id", inspection_order_id)
      .single();
    if (oErr || !order) throw new Error("Inspection order not found");
    if (order.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Inspection fee not paid" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (order.status !== "pending") {
      return new Response(JSON.stringify({ error: "Inspection already completed or cancelled" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Verify inspector belongs to assigned garage
    const { data: inspector, error: iErr } = await supabase
      .from("mtaxi_garage_inspectors")
      .select("id, garage_id")
      .eq("id", inspector_id)
      .eq("garage_id", order.garage_id)
      .single();
    if (iErr || !inspector) {
      return new Response(JSON.stringify({ error: "Inspector not authorized for this garage" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Auto-evaluate: all checks must pass
    const checks = [fire_extinguisher, first_aid_kit, triangles, tyres, lights, brakes];
    const allPass = checks.every((c) => c === true);
    const result = allPass ? "pass" : "fail";

    // 4. Record inspection results
    const { data: inspection, error: insErr } = await supabase
      .from("mtaxi_vehicle_inspections")
      .insert({
        vehicle_id: order.vehicle_id,
        inspector_id,
        fire_extinguisher,
        first_aid_kit,
        triangles,
        tyres,
        lights,
        brakes,
        result,
        notes: notes || "",
      })
      .select()
      .single();
    if (insErr) throw insErr;

    // 5. Update inspection order status
    await supabase
      .from("mtaxi_inspection_orders")
      .update({ status: result === "pass" ? "passed" : "failed", completed_at: new Date().toISOString() })
      .eq("id", inspection_order_id);

    // 6. If passed, mark vehicle as inspected (but NOT active yet — needs marshal approval)
    if (result === "pass") {
      await supabase
        .from("mtaxi_vehicles")
        .update({ inspection_status: "passed", is_active: false })
        .eq("id", order.vehicle_id);
    } else {
      await supabase
        .from("mtaxi_vehicles")
        .update({ inspection_status: "failed", is_active: false })
        .eq("id", order.vehicle_id);
    }

    // 7. Notify driver
    await supabase.from("mtaxi_messages").insert({
      sender_id: inspector_id,
      receiver_id: order.vehicle.driver_id,
      type: "inspection_result",
      content: `Your vehicle inspection ${result === "pass" ? "PASSED" : "FAILED"}. ${allPass ? "Awaiting marshal approval." : "Fix issues and re-book inspection."}`,
    });

    return new Response(JSON.stringify({
      success: true,
      result,
      inspection,
      all_pass: allPass,
      message: result === "pass"
        ? "Inspection passed. Vehicle awaiting marshal approval."
        : "Inspection failed. Fix listed issues and re-book.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
