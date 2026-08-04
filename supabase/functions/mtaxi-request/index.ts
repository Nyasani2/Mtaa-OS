import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { pickup, dropoff, ride_type = "instant", vehicle_type = "sedan" } = await req.json();
  const authHeader = req.headers.get("Authorization");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { global: { headers: { Authorization: authHeader! } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { data: distanceData } = await supabase.rpc("calculate_distance_km", {
    lat1: pickup.lat, lng1: pickup.lng, lat2: dropoff.lat, lng2: dropoff.lng
  });
  const distance_km = distanceData || 0;

  const { data: fareData } = await supabase.rpc("calculate_fare", { distance_km });
  const base_fare = fareData || 0;

  const { data: surgeData } = await supabase.rpc("mtaxi_compute_surge", { demand: 0, supply: 0 });
  const surge = surgeData || 1;

  const multipliers: Record<string, number> = { boda: 0.6, tuk_tuk: 0.8, sedan: 1.0, van: 1.3, truck: 1.8 };
  const vehicleMult = multipliers[vehicle_type] || 1;
  const estimated_fare = Math.round(base_fare * vehicleMult * surge);

  const { data: ride, error: rideError } = await supabase
    .from("mtaxi_rides")
    .insert({ rider_id: user.id, pickup_location: pickup, dropoff_location: dropoff, ride_type, estimated_fare, status: "requested" })
    .select().single();

  if (rideError) return new Response(JSON.stringify({ error: rideError.message }), { status: 500 });

  try {
    await supabase.from("wallet_escrows").insert({
      reference_id: ride.id, user_id: user.id, amount: estimated_fare,
      status: "held", module: "mtaxi", created_at: new Date().toISOString()
    });
  } catch (_e) {}

  const { data: drivers } = await supabase.rpc("mtaa_find_nearby_drivers", { pickup_lat: pickup.lat, pickup_lng: pickup.lng, radius_km: 5 });
  if (drivers && drivers.length > 0) {
    const requests = drivers.slice(0, 3).map((d: any) => ({
      ride_id: ride.id, driver_id: d.driver_user_id,
      expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString()
    }));
    await supabase.from("ride_requests").insert(requests);
  }

  return new Response(JSON.stringify({ ride, drivers: drivers?.length || 0 }), { status: 200 });
});