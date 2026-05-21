import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { ride_id, final_fare } = await req.json();
  const authHeader = req.headers.get("Authorization");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { global: { headers: { Authorization: authHeader! } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { data: ride } = await supabase.from("rides").select("*").eq("id", ride_id).eq("driver_id", user.id).single();
  if (!ride) return new Response(JSON.stringify({ error: "Ride not found" }), { status: 404 });

  const fare = final_fare || ride.estimated_fare;

  const { error: updateError } = await supabase.from("rides").update({ status: "completed", completed_at: new Date().toISOString(), final_fare: fare }).eq("id", ride_id);
  if (updateError) return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });

  await supabase.from("escrow_accounts").update({ status: "released", worker_id: user.id, released_at: new Date().toISOString() }).eq("job_id", ride_id).eq("status", "held");
  await supabase.from("mtaxi_drivers").update({ total_rides: (ride.total_rides || 0) + 1, total_earnings: (ride.total_earnings || 0) + fare * 0.75, status: "online" }).eq("id", user.id);

  return new Response(JSON.stringify({ success: true, final_fare: fare }), { status: 200 });
});
