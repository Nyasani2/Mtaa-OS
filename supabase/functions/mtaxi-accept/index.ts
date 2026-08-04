import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { ride_id } = await req.json();
  const authHeader = req.headers.get("Authorization");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { global: { headers: { Authorization: authHeader! } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { data: vehicle } = await supabase.from("mtaxi_vehicles").select("inspection_status").eq("user_id", user.id).eq("inspection_status", "approved").single();
  if (!vehicle) return new Response(JSON.stringify({ error: "Vehicle verification required" }), { status: 403 });

  const { data: ride, error: rideError } = await supabase
    .from("mtaxi_rides").update({ driver_id: user.id, status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", ride_id).eq("status", "requested").select().single();

  if (rideError) return new Response(JSON.stringify({ error: rideError.message }), { status: 500 });

  await supabase.from("ride_requests").update({ status: "expired" }).eq("ride_id", ride_id).neq("driver_id", user.id);
  await supabase.from("mtaxi_driver_status").update({ online: false }).eq("user_id", user.id);

  return new Response(JSON.stringify({ ride }), { status: 200 });
});