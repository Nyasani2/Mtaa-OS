import { supabase } from "../../supabase";

interface FleetSnapshot {
  total_trucks: number;
  active_trucks: number;
  idle_trucks: number;
  overloaded_zones: number;
  delayed_deliveries: number;
  fuel_alerts: number;
}

export async function buildFleetSnapshot(): Promise<FleetSnapshot> {

  const { data: trucks } = await supabase
    .from("mtruck_fleet")
    .select("*");

  const { data: deliveries } = await supabase
    .from("mtruck_deliveries")
    .select("*");

  const totalTrucks = (trucks || []).length;

  const activeTrucks = (trucks || []).filter(
    (t) => t.status === "ACTIVE"
  ).length;

  const idleTrucks = (trucks || []).filter(
    (t) => t.status === "IDLE"
  ).length;

  const delayedDeliveries = (deliveries || []).filter(
    (d) => d.status === "DELAYED"
  ).length;

  const fuelAlerts = (trucks || []).filter(
    (t) => Number(t.fuel_level || 100) < 15
  ).length;

  const overloadedZones = delayedDeliveries > 10 ? 1 : 0;

  return {
    total_trucks: totalTrucks,
    active_trucks: activeTrucks,
    idle_trucks: idleTrucks,
    overloaded_zones: overloadedZones,
    delayed_deliveries: delayedDeliveries,
    fuel_alerts: fuelAlerts,
  };
}

export async function saveFleetSnapshot() {

  const snapshot = await buildFleetSnapshot();

  const { error } = await supabase
    .from("mtruck_fleet_snapshots")
    .insert(snapshot);

  if (error) {
    throw error;
  }

  return snapshot;
}
