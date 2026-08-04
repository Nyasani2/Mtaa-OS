import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401 });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });

    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      case "request": {
        const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, pickup_address, destination_address } = params;
        const { data: trip } = await supabase.from("boda_trips").insert({
          rider_id: user.id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, pickup_address, destination_address,
          status: "requested", created_at: new Date().toISOString()
        }).select().single();
        return new Response(JSON.stringify({ success: true, trip }), { status: 200 });
      }
      case "accept": {
        const { trip_id } = params;
        const { data: rider } = await supabase.from("boda_riders").select("id, user_id, is_approved, is_active").eq("user_id", user.id).single();
        if (!rider || !rider.is_approved || !rider.is_active) return new Response(JSON.stringify({ error: "Rider not approved or inactive" }), { status: 403 });
        const { data: trip } = await supabase.from("boda_trips").select("id, status").eq("id", trip_id).eq("status", "requested").single();
        if (!trip) return new Response(JSON.stringify({ error: "Trip not found" }), { status: 404 });
        const { data: updated } = await supabase.from("boda_trips").update({ driver_id: rider.user_id, status: "accepted" }).eq("id", trip_id).select().single();
        return new Response(JSON.stringify({ success: true, trip: updated }), { status: 200 });
      }
      case "complete": {
        const { trip_id, final_fare } = params;
        const { data: trip } = await supabase.from("boda_trips").select("id, rider_id, driver_id, status, payment_status, estimated_fare, currency").eq("id", trip_id).single();
        if (!trip) return new Response(JSON.stringify({ error: "Trip not found" }), { status: 404 });
        const fare = Number(final_fare ?? trip.estimated_fare ?? 0);
        await supabase.from("boda_trips").update({ status: "completed", final_fare: fare, completed_at: new Date().toISOString() }).eq("id", trip_id);
        const feePercent = 2, taxPercent = 5;
        const platformFee = Math.round(fare * (feePercent / 100) * 100) / 100;
        const taxWithheld = Math.round(fare * (taxPercent / 100) * 100) / 100;
        const driverAmount = Math.round((fare - platformFee - taxWithheld) * 100) / 100;
        const currency = trip.currency || "KES";
        await supabase.rpc("mtaa_add_wallet_transaction", {
          p_user_id: trip.driver_id, p_amount: driverAmount, p_transaction_type: "boda_trip_earnings",
          p_status: "completed", p_currency: currency, p_description: `Trip earnings for trip ${trip_id}`,
          p_reference_type: "boda_trip", p_reference_id: trip_id, p_provider: "boda", p_metadata: { fare, platform_fee: platformFee },
        });
        const { data: pw } = await supabase.from("wallets").select("id, user_id").eq("wallet_type", "main").ilike("wallet_name", "%MTAA%").maybeSingle();
        if (pw?.user_id && platformFee > 0) await supabase.rpc("mtaa_add_wallet_transaction", { p_user_id: pw.user_id, p_amount: platformFee, p_transaction_type: "platform_fee", p_status: "completed", p_currency: currency, p_description: `Platform fee for boda trip ${trip_id}`, p_reference_type: "boda_trip", p_reference_id: trip_id, p_provider: "boda", p_metadata: { fare } });
        const { data: tw } = await supabase.from("wallets").select("id, user_id").eq("wallet_type", "main").ilike("wallet_name", "%Government Tax%").maybeSingle();
        if (tw?.user_id && taxWithheld > 0) await supabase.rpc("mtaa_add_wallet_transaction", { p_user_id: tw.user_id, p_amount: taxWithheld, p_transaction_type: "government_tax_withholding", p_status: "completed", p_currency: currency, p_description: `Withholding tax for boda trip ${trip_id}`, p_reference_type: "boda_trip", p_reference_id: trip_id, p_provider: "boda", p_metadata: { fare, tax_percent: taxPercent, country: "KE" } });
        return new Response(JSON.stringify({ success: true, trip_id, final_fare: fare, driver_amount: driverAmount }), { status: 200 });
      }
      case "cancel": {
        const { trip_id, reason } = params;
        const { data: trip } = await supabase.from("boda_trips").select("id, rider_id, driver_id, status").eq("id", trip_id).single();
        if (!trip) return new Response(JSON.stringify({ error: "Trip not found" }), { status: 404 });
        if (trip.status === "completed") return new Response(JSON.stringify({ error: "Cannot cancel completed trip" }), { status: 400 });
        const cancelledBy = trip.rider_id === user.id ? "rider" : (trip.driver_id === user.id ? "driver" : null);
        if (!cancelledBy) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
        const { data: updated } = await supabase.from("boda_trips").update({ status: "cancelled", cancelled_by: cancelledBy, cancellation_reason: reason }).eq("id", trip_id).select().single();
        return new Response(JSON.stringify({ success: true, trip: updated }), { status: 200 });
      }
      case "register_rider": {
        const { vehicle_type, plate_number, license_number } = params;
        const { data: existing } = await supabase.from("boda_riders").select("id").eq("user_id", user.id).single();
        if (existing) return new Response(JSON.stringify({ error: "Already registered" }), { status: 409 });
        const { data: rider } = await supabase.from("boda_riders").insert({
          user_id: user.id, vehicle_type, plate_number, license_number, is_approved: false, is_active: false, created_at: new Date().toISOString()
        }).select().single();
        return new Response(JSON.stringify({ success: true, rider }), { status: 200 });
      }
      case "update_rider": {
        const { rider_id, ...updates } = params;
        const { data: admin } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "super_admin"]).maybeSingle();
        if (!admin && rider_id !== user.id) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
        const { data: updated } = await supabase.from("boda_riders").update(updates).eq("id", rider_id).select().single();
        return new Response(JSON.stringify({ success: true, rider: updated }), { status: 200 });
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown action: " + action }), { status: 400 });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});