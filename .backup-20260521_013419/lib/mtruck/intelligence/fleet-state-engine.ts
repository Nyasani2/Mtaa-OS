import { supabase } from "../../supabase";

export async function getFleetState() {
  const { data: trucks } = await supabase
    .from("truck_locations")
    .select("*");

  const active = trucks?.length || 0;

  const avgSpeed =
    trucks?.reduce((acc, t) => acc + (t.speed_kmh || 0), 0) / (active || 1);

  return {
    active_trucks: active,
    avg_speed: avgSpeed || 0,
    congestion_level: avgSpeed < 20 ? "HIGH" : "NORMAL"
  };
}
