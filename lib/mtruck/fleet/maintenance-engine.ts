import { supabase } from "../../supabase";

export interface MaintenanceRecord {
  truck_id: string;
  type: "ENGINE" | "TIRES" | "OIL" | "BRAKES" | "INSPECTION";
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  cost?: number;
}

export async function scheduleMaintenance(record: MaintenanceRecord) {
  const { data, error } = await supabase
    .from("mtruck_maintenance_alerts")
    .insert({
      ...record,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from("mtruck_trucks")
    .update({ status: "MAINTENANCE" })
    .eq("id", record.truck_id);

  return data;
}

export async function getMaintenanceQueue() {
  const { data } = await supabase
    .from("mtruck_maintenance_alerts")
    .select("*")
    .neq("status", "DONE");

  return data || [];
}
