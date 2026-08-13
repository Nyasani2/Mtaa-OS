import { supabase } from "../../supabase";

export async function getControlTowerSnapshot() {
  const { data: trucks } = await supabase.from("truck_locations").select("*");
  const { data: requests } = await supabase.from("freight_requests").select("*");

  return {
    fleet_size: trucks?.length || 0,
    active_requests: requests?.filter((r: any) => r.status === "PENDING").length || 0,
    assigned: requests?.filter((r: any) => r.status === "ASSIGNED").length || 0,
    live_trucks: trucks || [],
  };
}
