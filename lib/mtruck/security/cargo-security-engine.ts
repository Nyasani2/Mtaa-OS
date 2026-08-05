import { supabase } from "../../supabase";

export interface CargoSecurityAlert {
  truck_id: string;
  shipment_id: string;
  alert_type:
    | "ROUTE_DEVIATION"
    | "DOOR_BREACH"
    | "GPS_SIGNAL_LOST"
    | "UNAUTHORIZED_STOP";

  severity:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  metadata?: any;
}

export async function createCargoSecurityAlert(
  alert: CargoSecurityAlert
) {

  const { data, error } = await supabase
    .from("mtruck_security_alerts")
    .insert({
      truck_id: alert.truck_id,
      shipment_id: alert.shipment_id,
      alert_type: alert.alert_type,
      severity: alert.severity,
      metadata: alert.metadata || {},
    })
    .select()
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function getActiveSecurityAlerts() {

  const { data, error } = await supabase
    .from("mtruck_security_alerts")
    .select("*")
    .eq("resolved", false)
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data || [];
}
