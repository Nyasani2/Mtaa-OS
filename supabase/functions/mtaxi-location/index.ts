// NOTE: "driver_locations" table not verified in schema.
// If missing, use "mtaxi_locations" or create the table.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { lat, lng, heading } = await req.json();
  const authHeader = req.headers.get("Authorization");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { global: { headers: { Authorization: authHeader! } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { data: isSpoofed } = await supabase.rpc("mtaxi_detect_gps_spoof", { p_driver: user.id, p_lat: lat, p_lng: lng });
  if (isSpoofed) return new Response(JSON.stringify({ error: "GPS spoofing detected" }), { status: 403 });

  await supabase.from("driver_locations").upsert({ user_id: user.id, lat, lng, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  await supabase.from("mtaxi_driver_status").update({ current_lat: lat, current_lng: lng, updated_at: new Date().toISOString() }).eq("user_id", user.id);
  await supabase.from("mtaxi_driver_location_history").insert({ driver_id: user.id, lat, lng, recorded_at: new Date().toISOString() });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
