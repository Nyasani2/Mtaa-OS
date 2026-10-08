import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { ride_id, client_final_fare } = await req.json();

    if (!ride_id) {
      return new Response(JSON.stringify({ error: "ride_id is required" }), { status: 400 });
    }

    // 1. Fetch the ride record securely
    const { data: ride, error: rideErr } = await supabase
      .from("mtaxi_rides")
      .select("id, rider_id, driver_id, status, fare_estimate, distance_km, duration_minutes")
      .eq("id", ride_id)
      .eq("driver_id", user.id)
      .single();

    if (rideErr || !ride) {
      return new Response(JSON.stringify({ error: "Ride not found or access denied" }), { status: 404 });
    }

    if (ride.status === "completed") {
      return new Response(JSON.stringify({ error: "Ride already completed" }), { status: 409 });
    }

    // 2. SERVER-SIDE FARE CALCULATION (Source of Truth)
    // Define your actual pricing rules here. This is an example:
    const BASE_FARE = 100; // KES
    const PER_KM_RATE = 50; // KES
    const PER_MIN_RATE = 5; // KES
    
    const distance = ride.distance_km || 0;
    const duration = ride.duration_minutes || 0;
    
    // Calculate authoritative fare based on actual telemetry
    const authoritativeFare = BASE_FARE + (distance * PER_KM_RATE) + (duration * PER_MIN_RATE);
    
    // 3. TOLERANCE CHECK: Prevent driver from submitting a wildly inflated fare
    // We allow a small margin (e.g., 20%) for minor route deviations, but reject blatant manipulation
    const toleranceMultiplier = 1.20; 
    const maxAllowedFare = authoritativeFare * toleranceMultiplier;

    let finalFareToCharge = authoritativeFare;

    if (client_final_fare) {
      if (client_final_fare > maxAllowedFare) {
        return new Response(JSON.stringify({ 
          error: "Fare mismatch: Client fare exceeds server-calculated maximum tolerance",
          server_calculated_fare: authoritativeFare,
          client_submitted_fare: client_final_fare,
          max_allowed: maxAllowedFare
        }), { status: 403 });
      }
      // If client fare is lower or within tolerance, we can accept it (or strictly enforce authoritativeFare)
      // For maximum security, always use the authoritativeFare or the lower of the two.
      finalFareToCharge = Math.min(client_final_fare, authoritativeFare);
    }

    const fare = Number(finalFareToCharge.toFixed(2));
    if (fare <= 0) {
      return new Response(JSON.stringify({ error: "Invalid fare calculated" }), { status: 400 });
    }

    // 4. Calculate splits (Example: 2% platform fee, 5% withholding tax)
    const platformFee = Number((fare * 0.02).toFixed(2));
    const withholdingTax = Number((fare * 0.05).toFixed(2));
    const driverPayout = Number((fare - platformFee - withholdingTax).toFixed(2));

    // 5. Update ride status and final fare atomically
    const { error: updateErr } = await supabase
      .from("mtaxi_rides")
      .update({ 
        status: "completed", 
        final_fare: fare,
        platform_fee: platformFee,
        withholding_tax: withholdingTax,
        driver_payout: driverPayout,
        completed_at: new Date().toISOString()
      })
      .eq("id", ride_id);

    if (updateErr) {
      console.error("Failed to update ride:", updateErr);
      return new Response(JSON.stringify({ error: "Failed to complete ride" }), { status: 500 });
    }

    // 6. TODO: Trigger wallet transactions here via secure RPC or queue
    // await supabase.rpc('mtaa_wallet_debit', { p_user_id: ride.rider_id, p_amount: fare, ... });
    // await supabase.rpc('mtaa_wallet_credit', { p_user_id: user.id, p_amount: driverPayout, ... });

    return new Response(JSON.stringify({ 
      success: true, 
      ride_id, 
      fare, 
      driver_payout: driverPayout,
      message: "Ride completed successfully" 
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
