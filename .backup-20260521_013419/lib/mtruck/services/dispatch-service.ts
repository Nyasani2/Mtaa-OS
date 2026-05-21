import { supabase } from "@/lib/supabase";
import type { Load } from "@/lib/mtruck/types";

export async function getAvailableLoads(): Promise<Load[]> {
  const { data, error } = await supabase.from("mtruck_loads").select("*").eq("status", "pending").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAssignedLoads(): Promise<Load[]> {
  const { data, error } = await supabase.from("mtruck_loads").select("*").in("status", ["assigned", "in_transit"]).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function assignLoad(loadId: string, truckId: string): Promise<void> {
  const { error } = await supabase.from("mtruck_loads").update({ status: "assigned", assigned_truck_id: truckId }).eq("id", loadId);
  if (error) throw error;
}

export async function unassignLoad(loadId: string): Promise<void> {
  const { error } = await supabase.from("mtruck_loads").update({ status: "pending", assigned_truck_id: null }).eq("id", loadId);
  if (error) throw error;
}
