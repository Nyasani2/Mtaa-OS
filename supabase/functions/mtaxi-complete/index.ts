import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";




// ─── SECURITY: Centralized Treasury & Tax IDs ───
const TREASURY_USER_ID = Deno.env.get('TREASURY_USER_ID') || '8e41ee2e-ae74-43a5-a550-a1d02a5591a3';
const TAX_AUTHORITY_ID = Deno.env.get('FALLBACK_TAX_USER_ID') || '8e41ee2e-ae74-43a5-a550-a1d02a5591a3';

// ─── SECURITY: Ensure we use Service Role for financial settlement ───
// If the client passes a user key, we override it for the settlement RPCs to bypass RLS safely
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;



serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { global: { headers: { Authorization: authHeader } } });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    
    const { ride_id, client_final_fare } = await req.json();
    if (!ride_id) return new Response(JSON.stringify({ error: "ride_id is required" }), { status: 400 });
    
    const { data: ride, error: rideErr } = await supabase.from("mtaxi_rides").select("id, rider_id, driver_id, status, fare_estimate, distance_km, duration_minutes").eq("id", ride_id).eq("driver_id", user.id).single();
    if (rideErr || !ride) return new Response(JSON.stringify({ error: "Ride not found or access denied" }), { status: 404 });
    if (ride.status === "completed") return new Response(JSON.stringify({ error: "Ride already completed" }), { status: 409 });
    
    // SANITY CHECK
    const distance = ride.distance_km || 0;
    const duration = ride.duration_minutes || 0;
    if (duration > 0 && (distance / duration) > 3.0) return new Response(JSON.stringify({ error: "Invalid trip data" }), { status: 400 });
    if (distance > 200) return new Response(JSON.stringify({ error: "Distance exceeds limit" }), { status: 400 });
    
    // SERVER-SIDE FARE CALCULATION
    const BASE_FARE = 100, PER_KM_RATE = 50, PER_MIN_RATE = 5;
    const authoritativeFare = BASE_FARE + (distance * PER_KM_RATE) + (duration * PER_MIN_RATE);
    const maxAllowedFare = authoritativeFare * 1.20;
    let finalFareToCharge = authoritativeFare;
    
    if (client_final_fare) {
      if (client_final_fare > maxAllowedFare) return new Response(JSON.stringify({ error: "Fare mismatch" }), { status: 403 });
      finalFareToCharge = Math.min(client_final_fare, authoritativeFare);
    }
    
    const fare = Number(finalFareToCharge.toFixed(2));
    if (fare <= 0) return new Response(JSON.stringify({ error: "Invalid fare" }), { status: 400 });
    
    const platformFee = Number((fare * 0.02).toFixed(2));
    const withholdingTax = Number((fare * 0.05).toFixed(2));
    const driverPayout = Number((fare - platformFee - withholdingTax).toFixed(2));
    
    await supabase.from("mtaxi_rides").update({ status: "completed", final_fare: fare, platform_fee: platformFee, withholding_tax: withholdingTax, driver_payout: driverPayout, completed_at: new Date().toISOString() }).eq("id", ride_id);
    
    // WIRE THE MONEY TRAIL
    await supabaseAdmin.rpc('mtaa_wallet_debit', { p_user_id: ride.rider_id, p_amount: fare, p_currency: 'KES', p_description: `MTaxi Ride #${ride_id}`, p_transaction_type: 'transport_payment', p_metadata: { ride_id } });
    await supabaseAdmin.rpc('mtaa_wallet_credit', { p_user_id: user.id, p_amount: driverPayout, p_currency: 'KES', p_description: `Driver Payout for Ride #${ride_id}`, p_transaction_type: 'driver_earning', p_metadata: { ride_id } });
    
    // Route to treasury and tax authority (FIXED UUIDs)
    await supabaseAdmin.rpc('mtaa_wallet_credit', { p_user_id: TREASURY_USER_ID, p_amount: platformFee, p_currency: 'KES', p_description: `Platform Fee for Ride #${ride_id}`, p_transaction_type: 'platform_revenue', p_metadata: { ride_id } });
    await supabaseAdmin.rpc('mtaa_wallet_credit', { p_user_id: TAX_AUTHORITY_ID, p_amount: withholdingTax, p_currency: 'KES', p_description: `Withholding Tax for Ride #${ride_id}`, p_transaction_type: 'government_tax', p_metadata: { ride_id, tax_type: 'withholding' } });
    
    return new Response(JSON.stringify({ success: true, ride_id, fare, driver_payout: driverPayout, message: "Ride completed successfully" }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
