import { supabase } from "../../supabase";

export interface MaintenanceAlert {
  truck_id: string;
  issue: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export async function analyzeMaintenance() {

  const { data: trucks, error } = await supabase
    .from("mtruck_fleet")
    .select("*");

  if (error) throw error;

  const alerts: MaintenanceAlert[] = [];

  for (const truck of trucks || []) {

    const mileage = Number(
      truck.mileage_km || 0
    );

    const engineHealth = Number(
      truck.engine_health || 100
    );

    if (mileage > 100000) {

      alerts.push({
        truck_id: truck.id,
        issue: "High mileage service required",
        severity: "MEDIUM",
      });
    }

    if (engineHealth < 40) {

      alerts.push({
        truck_id: truck.id,
        issue: "Engine health critical",
        severity: "HIGH",
      });
    }
  }

  return alerts;
}

export async function saveMaintenanceAlerts() {

  const alerts =
    await analyzeMaintenance();

  for (const alert of alerts) {

    await supabase
      .from("mtruck_maintenance_alerts")
      .insert(alert);
  }

  return alerts;
}
