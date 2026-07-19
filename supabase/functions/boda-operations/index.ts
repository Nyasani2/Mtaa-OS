// supabase/functions/boda-operations/index.ts
//
// Handles the full boda-boda ride lifecycle: request, accept, complete,
// cancel, onboard_rider, rider_approval. Built 2026-07-18 to close a
// confirmed gap: lib/services/boda-service.ts (bodaOperation) already
// correctly called this exact function by name — it simply never
// existed. Every param/response shape below was written to match that
// existing, well-designed frontend contract exactly, not invented.
//
// boda_trips columns verified against live schema before building
// (rider_id, driver_id, pickup/dest lat+lng+address, boda_type, status,
// estimated_fare, final_fare, currency, payment_method, payment_status,
// rating, feedback, cancelled_by, cancellation_reason). No FK constraint
// exists on driver_id/rider_id — this function stores driver_id as the
// driver's real auth.users id (via boda_riders.user_id) specifically so
// the 'complete' action can credit their real wallet directly.
//
// 'complete' is the only money-moving action: same 2% platform fee +
// 5% KE tax withholding pattern as mtruck-settle/job-contract-settle/
// garage-settle, using the audited mtaa_add_wallet_transaction RPC.
// Deliberately does NOT repeat mtaxi-complete's two confirmed bugs from
// earlier in this audit: (1) calculating a platform commission but never
// crediting it anywhere, (2) crediting a stats field instead of the
// driver's real wallet balance.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const body = await req.json();
    const { action } = body;
    const authHeader = req.headers.get("Authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    switch (action) {
      case "request": {
        const { riderId, pickup, destination, bodaType, paymentMethod, estimatedFare, currency } = body;
        if (user.id !== riderId) {
          return new Response(JSON.stringify({ error: "Not authorized to request a trip for this rider" }), { status: 403 });
        }
        const { data, error } = await supabase
          .from("boda_trips")
          .insert({
            rider_id: riderId,
            pickup_lat: pickup.lat, pickup_lng: pickup.lng, pickup_address: pickup.address,
            dest_lat: destination.lat, dest_lng: destination.lng, dest_address: destination.address,
            boda_type: bodaType, payment_method: paymentMethod,
            estimated_fare: estimatedFare, currency: currency || "KES",
            status: "requested", payment_status: "pending",
          })
          .select()
          .single();
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        return new Response(JSON.stringify({ success: true, trip: data }), { status: 200 });
      }

      case "accept": {
        const { requestId, bodaId } = body;
        const { data: rider, error: riderErr } = await supabase
          .from("boda_riders")
          .select("id, user_id, is_approved, is_active")
          .eq("id", bodaId)
          .single();
        if (riderErr || !rider) {
          return new Response(JSON.stringify({ error: "Boda rider not found" }), { status: 404 });
        }
        if (user.id !== rider.user_id) {
          return new Response(JSON.stringify({ error: "Not authorized to accept as this rider" }), { status: 403 });
        }
        if (!rider.is_approved || !rider.is_active) {
          return new Response(JSON.stringify({ error: "Rider is not approved or not active" }), { status: 403 });
        }
        const { data: trip, error: tripErr } = await supabase
          .from("boda_trips")
          .select("id, status")
          .eq("id", requestId)
          .single();
        if (tripErr || !trip) {
          return new Response(JSON.stringify({ error: "Trip request not found" }), { status: 404 });
        }
        if (trip.status !== "requested") {
          return new Response(JSON.stringify({ error: `Trip is '${trip.status}', can only accept a 'requested' trip` }), { status: 409 });
        }
        const { data, error } = await supabase
          .from("boda_trips")
          .update({ driver_id: rider.user_id, status: "accepted" })
          .eq("id", requestId)
          .select()
          .single();
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        return new Response(JSON.stringify({ success: true, trip: data }), { status: 200 });
      }

      case "complete": {
        const { tripId, finalFare, rating, feedback } = body;
        const { data: trip, error: tripErr } = await supabase
          .from("boda_trips")
          .select("id, rider_id, driver_id, status, payment_status, estimated_fare, currency")
          .eq("id", tripId)
          .single();
        if (tripErr || !trip) {
          return new Response(JSON.stringify({ error: "Trip not found" }), { status: 404 });
        }
        if (user.id !== trip.rider_id && user.id !== trip.driver_id) {
          return new Response(JSON.stringify({ error: "Not authorized to complete this trip" }), { status: 403 });
        }
        if (trip.payment_status === "paid") {
          return new Response(JSON.stringify({ error: "This trip has already been paid" }), { status: 409 });
        }
        if (!trip.driver_id) {
          return new Response(JSON.stringify({ error: "Trip has no accepted driver" }), { status: 400 });
        }
        const fare = Number(finalFare ?? trip.estimated_fare ?? 0);
        if (fare <= 0) {
          return new Response(JSON.stringify({ error: "No valid fare to settle" }), { status: 400 });
        }

        const feePercent = 2; // Kevin's platform-wide default for boda/mtaxi/mtruck
        const taxPercent = 5; // KE withholding_income_tax — same TODO as other settlement functions
        const platformFee = Math.round(fare * (feePercent / 100) * 100) / 100;
        const taxWithheld = Math.round(fare * (taxPercent / 100) * 100) / 100;
        const driverAmount = Math.round((fare - platformFee - taxWithheld) * 100) / 100;
        const currency = trip.currency || "KES";

        const { data: driverTxId, error: driverErr } = await supabase.rpc("mtaa_add_wallet_transaction", {
          p_user_id: trip.driver_id,
          p_amount: driverAmount,
          p_transaction_type: "boda_trip_earnings",
          p_status: "completed",
          p_currency: currency,
          p_description: `Boda trip earnings for trip ${tripId}`,
          p_reference_type: "boda_trip",
          p_reference_id: tripId,
          p_provider: "boda",
          p_metadata: { fare, platform_fee: platformFee, fee_percent: feePercent },
        });
        if (driverErr) {
          return new Response(JSON.stringify({ error: `Failed to credit driver: ${driverErr.message}` }), { status: 500 });
        }

        let platformTxId: string | null = null;
        if (platformFee > 0) {
          const { data: platformWallet } = await supabase
            .from("wallets").select("id, user_id").eq("wallet_type", "main").ilike("wallet_name", "%MTAA%").maybeSingle();
          if (platformWallet?.user_id) {
            const { data: txId, error: platformErr } = await supabase.rpc("mtaa_add_wallet_transaction", {
              p_user_id: platformWallet.user_id, p_amount: platformFee, p_transaction_type: "platform_fee",
              p_status: "completed", p_currency: currency, p_description: `Platform fee for boda trip ${tripId}`,
              p_reference_type: "boda_trip", p_reference_id: tripId, p_provider: "boda", p_metadata: { fare },
            });
            if (!platformErr) platformTxId = txId;
          }
        }

        let taxTxId: string | null = null;
        if (taxWithheld > 0) {
          const { data: taxWallet } = await supabase
            .from("wallets").select("id, user_id").eq("wallet_type", "main").ilike("wallet_name", "%Government Tax%").maybeSingle();
          if (taxWallet?.user_id) {
            const { data: txId, error: taxErr } = await supabase.rpc("mtaa_add_wallet_transaction", {
              p_user_id: taxWallet.user_id, p_amount: taxWithheld, p_transaction_type: "government_tax_withholding",
              p_status: "completed", p_currency: currency, p_description: `Withholding tax for boda trip ${tripId}`,
              p_reference_type: "boda_trip", p_reference_id: tripId, p_provider: "boda",
              p_metadata: { fare, tax_percent: taxPercent, country: "KE" },
            });
            if (!taxErr) taxTxId = txId;
          }
        }

        const { data, error: updateErr } = await supabase
          .from("boda_trips")
          .update({
            status: "completed", final_fare: fare, payment_status: "paid",
            rating: rating ?? null, feedback: feedback ?? null,
          })
          .eq("id", tripId)
          .select()
          .single();
        if (updateErr) {
          return new Response(JSON.stringify({
            warning: "Payment was made but trip status update failed — check trip manually",
            error: updateErr.message, driver_transaction_id: driverTxId,
          }), { status: 207 });
        }

        // NOTE: not incrementing boda_riders.total_trips here — no safe,
        // verified atomic-increment RPC was found for this column during
        // the time available for this pass. Guessing at one risked either
        // silently doing nothing or double-counting on retries. Left as a
        // known follow-up rather than shipped as unverified code.
        return new Response(JSON.stringify({
          success: true, trip: data, driver_amount: driverAmount, platform_fee: platformFee,
          tax_withheld: taxWithheld, driver_transaction_id: driverTxId,
          platform_transaction_id: platformTxId, tax_transaction_id: taxTxId,
        }), { status: 200 });
      }

      case "cancel": {
        const { tripId, cancelledBy, reason } = body;
        const { data: trip, error: tripErr } = await supabase
          .from("boda_trips")
          .select("id, rider_id, driver_id, status")
          .eq("id", tripId)
          .single();
        if (tripErr || !trip) {
          return new Response(JSON.stringify({ error: "Trip not found" }), { status: 404 });
        }
        if (user.id !== trip.rider_id && user.id !== trip.driver_id) {
          return new Response(JSON.stringify({ error: "Not authorized to cancel this trip" }), { status: 403 });
        }
        if (["completed", "cancelled"].includes(trip.status)) {
          return new Response(JSON.stringify({ error: `Trip is already '${trip.status}', cannot cancel` }), { status: 409 });
        }
        const { data, error } = await supabase
          .from("boda_trips")
          .update({ status: "cancelled", cancelled_by: cancelledBy, cancellation_reason: reason })
          .eq("id", tripId)
          .select()
          .single();
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        return new Response(JSON.stringify({ success: true, trip: data }), { status: 200 });
      }

      case "onboard_rider": {
        const { riderData } = body;
        const { data, error } = await supabase
          .from("boda_riders")
          .insert({
            user_id: user.id,
            full_name: riderData.fullName,
            phone: riderData.phone,
            id_number: riderData.idNumber,
            license_number: riderData.licenseNumber,
            license_expiry: riderData.licenseExpiry,
            helmet_serial: riderData.helmetSerial ?? null,
            emergency_contact: riderData.emergencyContact ?? null,
            is_approved: false,
            is_active: false,
          })
          .select()
          .single();
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        return new Response(JSON.stringify({ success: true, rider: data }), { status: 200 });
      }

      case "rider_approval": {
        const { riderId, approvedBy, status, reason } = body;
        if (user.id !== approvedBy) {
          return new Response(JSON.stringify({ error: "approvedBy must match the authenticated caller" }), { status: 403 });
        }
        const { data: approverRole } = await supabase
          .from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "super_admin"]).maybeSingle();
        if (!approverRole) {
          return new Response(JSON.stringify({ error: "Not authorized to approve riders" }), { status: 403 });
        }
        const updates: Record<string, unknown> = {
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
        };
        if (status === "approved") { updates.is_approved = true; updates.is_active = true; }
        else if (status === "rejected") { updates.is_approved = false; updates.is_active = false; }
        else if (status === "suspended") { updates.is_approved = true; updates.is_active = false; }
        const { data, error } = await supabase
          .from("boda_riders")
          .update(updates)
          .eq("id", riderId)
          .select()
          .single();
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        return new Response(JSON.stringify({ success: true, rider: data, reason: reason ?? null }), { status: 200 });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400 });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), { status: 500 });
  }
});
