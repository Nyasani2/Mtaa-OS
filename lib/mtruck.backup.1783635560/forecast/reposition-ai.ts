import { supabase } from "../../supabase";
import { forecastDemand } from "./demand-forecast-engine";

/**
 * AUTONOMOUS FLEET OPTIMIZER
 * Moves idle trucks BEFORE demand spikes
 */
export async function runRepositionAI() {
  const forecast = await forecastDemand();

  const { data: idleTrucks } = await supabase
    .from("trucks")
    .select("*")
    .eq("status", "IDLE");

  if (!idleTrucks?.length) return [];

  const highDemandZones = forecast
    .filter(f => f.predicted_demand > 5)
    .slice(0, idleTrucks.length);

  const actions = [];

  for (let i = 0; i < idleTrucks.length; i++) {
    const truck = idleTrucks[i];
    const target = highDemandZones[i % highDemandZones.length];

    if (!target) continue;

    await supabase.from("truck_repositioning").insert({
      truck_id: truck.truck_id,
      target_zone: target.cell_id,
      reason: "PREDICTIVE_DEMAND"
    });

    actions.push({
      truck_id: truck.truck_id,
      target: target.cell_id
    });
  }

  return actions;
}
