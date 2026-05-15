import { supabase } from "../../../supabase";

/**
 * FLEET INTELLIGENCE BRAIN
 * Tracks truck availability + movement pressure
 */

export async function getFleetState() {
  const { data: trucks } = await supabase
    .from("trucks")
    .select("*");

  const active = trucks?.filter(t => !t.available).length || 0;
  const idle = trucks?.filter(t => t.available).length || 0;

  return {
    total_trucks: trucks?.length || 0,
    active,
    idle,
    utilization: active / (trucks?.length || 1),
  };
}
