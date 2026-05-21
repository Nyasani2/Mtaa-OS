import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { lat, lng, radius_km = 5 } = await req.json();
  const authHeader = req.headers.get("Authorization");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { global: { headers: { Authorization: authHeader! } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { data: drivers, error } = await supabase.rpc("mtaa_find_nearby_drivers", { pickup_lat: lat, pickup_lng: lng, radius_km });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const { data: favorites } = await supabase.rpc("mtaxi_ping_favorite_drivers", { p_rider: user.id });
  const favoriteIds = favorites?.map((f: any) => f.driver_id) || [];

  const enhanced = await Promise.all((drivers || []).map(async (d: any) => {
    const { data: vehicle } = await supabase.from("mtaxi_vehicles").select("type, plate_number, color").eq("user_id", d.driver_user_id).single();
    const { data: reputation } = await supabase.from("mtaxi_driver_reputation").select("reputation_score").eq("driver_id", d.driver_user_id).single();
    return { ...d, is_favorite: favoriteIds.includes(d.driver_user_id), vehicle: vehicle || null, reputation_score: reputation?.reputation_score || 100, distance_km: Math.round(d.distance_km * 100) / 100 };
  }));

  const ranked = enhanced.map((d: any) => ({ ...d, rank_score: (1 / (d.distance_km + 0.1)) * 0.5 + (d.reputation_score / 100) * 0.3 + (d.is_favorite ? 0.2 : 0) })).sort((a: any, b: any) => b.rank_score - a.rank_score);

  return new Response(JSON.stringify({ drivers: ranked }), { status: 200 });
});
