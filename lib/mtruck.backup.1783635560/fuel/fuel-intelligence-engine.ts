import { supabase } from "../../supabase";

export interface FuelAlert {
  truck_id: string;
  fuel_level: number;
  severity: "LOW" | "CRITICAL";
}

export async function analyzeFleetFuel() {

  const { data: trucks, error } = await supabase
    .from("mtruck_fleet")
    .select("*");

  if (error) throw error;

  const alerts: FuelAlert[] = [];

  for (const truck of trucks || []) {

    const fuel = Number(truck.fuel_level || 100);

    if (fuel <= 25) {

      alerts.push({
        truck_id: truck.id,
        fuel_level: fuel,
        severity:
          fuel <= 10
            ? "CRITICAL"
            : "LOW",
      });
    }
  }

  return alerts;
}

export async function saveFuelAlerts() {

  const alerts = await analyzeFleetFuel();

  for (const alert of alerts) {

    await supabase
      .from("mtruck_fuel_alerts")
      .insert(alert);
  }

  return alerts;
}
