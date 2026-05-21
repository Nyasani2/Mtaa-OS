import { supabase } from "../../supabase";
import { predictDemandWindow } from "./predictive-demand-engine";

export async function computeRepositionPlan() {
  const demand = await predictDemandWindow();

  const topZones = demand
    .sort((a, b) => b.predicted_demand - a.predicted_demand)
    .slice(0, 5);

  const { data: trucks } = await supabase.from("truck_locations").select("*");

  const instructions = [];

  for (let i = 0; i < trucks.length; i++) {
    const zone = topZones[i % topZones.length];

    instructions.push({
      truck_id: trucks[i].truck_id,
      move_to: {
        lat: zone.lat,
        lng: zone.lng
      },
      reason: "DEMAND_OPTIMIZATION"
    });
  }

  return instructions;
}
