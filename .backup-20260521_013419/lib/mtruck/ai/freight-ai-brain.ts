import { supabase } from "../../supabase";

export async function generateFreightInsights() {

  const { data: shipments } = await supabase
    .from("mtruck_shipments")
    .select("*");

  const { data: fleet } = await supabase
    .from("mtruck_fleet")
    .select("*");

  const activeShipments =
    (shipments || []).filter(
      (s) => s.status === "ACTIVE"
    ).length;

  const delayedShipments =
    (shipments || []).filter(
      (s) => s.status === "DELAYED"
    ).length;

  const activeFleet =
    (fleet || []).filter(
      (t) => t.status === "ACTIVE"
    ).length;

  let networkHealth = "GOOD";

  if (delayedShipments > 10) {
    networkHealth = "CONGESTED";
  }

  if (activeFleet < 5) {
    networkHealth = "LOW_CAPACITY";
  }

  const insights = {
    active_shipments:
      activeShipments,

    delayed_shipments:
      delayedShipments,

    active_fleet:
      activeFleet,

    network_health:
      networkHealth,

    generated_at:
      new Date().toISOString(),
  };

  await supabase
    .from("mtruck_ai_insights")
    .insert(insights);

  return insights;
}
