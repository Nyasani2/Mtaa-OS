import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { ride_id, reason } = await req.json();
  const authHeader = req.headers.get("Authorization");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { global: { headers: { Authorization: authHeader! } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { data: ride } = await supabase.from("rides").select("*").eq("id", ride_id).single();
  if (!ride) return new Response(JSON.stringify({ error: "Ride not found" }), { status: 404 });
  if (ride.rider_id !== user.id && ride.driver_id !== user.id) return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403 });

  const { error: updateError } = await supabase.from("rides").update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: reason }).eq("id", ride_id);
  if (updateError) return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });

  await supabase.from("escrow_accounts").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("job_id", ride_id).eq("status", "held");
  if (ride.driver_id) await supabase.from("mtaxi_driver_status").update({ online: true }).eq("user_id", ride.driver_id);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
