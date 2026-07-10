import { supabase } from "../../supabase";

export interface PredictiveInsight {
  congestion_forecast: "LOW" | "MEDIUM" | "HIGH";
  demand_spike_zones: number;
  fleet_utilization: number;
  recommended_idle_reposition: number;
}

export async function runPredictiveBrain(): Promise<PredictiveInsight> {

  const { data: gps } = await supabase
    .from("mtruck_gps_stream")
    .select("*");

  const { data: shipments } = await supabase
    .from("mtruck_shipments")
    .select("*");

  const trafficLoad = (gps || []).length;
  const activeShipments = (shipments || []).length;

  let congestion:
    | "LOW"
    | "MEDIUM"
    | "HIGH" = "LOW";

  if (trafficLoad > 200) congestion = "HIGH";
  else if (trafficLoad > 80) congestion = "MEDIUM";

  const utilization =
    activeShipments / Math.max(trafficLoad, 1);

  return {
    congestion_forecast: congestion,
    demand_spike_zones: Math.floor(
      Math.random() * 5
    ),
    fleet_utilization: Number(
      utilization.toFixed(2)
    ),
    recommended_idle_reposition:
      Math.floor(Math.random() * 10),
  };
}

export async function savePredictiveInsight() {

  const insight = await runPredictiveBrain();

  await supabase
    .from("mtruck_ai_insights")
    .insert({
      active_shipments: 0,
      delayed_shipments: 0,
      active_fleet: 0,
      network_health: insight.congestion_forecast,
      generated_at: new Date().toISOString(),
    });

  return insight;
}
