import { supabase } from "../../supabase";

export interface MTruckSystemState {
  fleet_health: "GOOD" | "WARNING" | "CRITICAL";
  avg_eta_minutes: number;
  active_shipments: number;
  congestion_index: number;
  revenue_per_hour: number;
}

export async function computeSystemState(): Promise<MTruckSystemState> {

  const { data: shipments } = await supabase
    .from("mtruck_shipments")
    .select("*");

  const { data: fleet } = await supabase
    .from("mtruck_fleet")
    .select("*");

  const activeShipments =
    (shipments || []).filter(s => s.status === "ACTIVE").length;

  const delayedShipments =
    (shipments || []).filter(s => s.status === "DELAYED").length;

  const avgEta =
    (shipments || []).length > 0
      ? (shipments || []).reduce(
          (acc, s) => acc + (s.eta_minutes || 0),
          0
        ) / (shipments || []).length
      : 0;

  const congestionIndex =
    delayedShipments > 10
      ? 0.8
      : delayedShipments > 5
      ? 0.5
      : 0.2;

  const revenue =
    activeShipments * 120;

  let fleetHealth:
    | "GOOD"
    | "WARNING"
    | "CRITICAL" = "GOOD";

  if (delayedShipments > 15) fleetHealth = "CRITICAL";
  else if (delayedShipments > 7) fleetHealth = "WARNING";

  return {
    fleet_health: fleetHealth,
    avg_eta_minutes: Math.round(avgEta),
    active_shipments: activeShipments,
    congestion_index: congestionIndex,
    revenue_per_hour: revenue,
  };
}
