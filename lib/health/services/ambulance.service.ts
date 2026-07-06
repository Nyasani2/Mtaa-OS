import { supabase } from "@/lib/supabase/client";

export async function getAmbulanceDispatches(filter: string) {
  let q = supabase.from("health_ambulance_dispatches").select("*").order("created_at", { ascending: false });
  if (filter === "active") q = q.in("status", ["dispatched", "en_route", "on_scene", "transporting"]);
  if (filter === "completed") q = q.eq("status", "completed");
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getDispatchDetail(dispatchId: string) {
  const { data, error } = await supabase.from("health_ambulance_dispatches").select("*, patient:patient_id(full_name)").eq("id", dispatchId).single();
  if (error) throw error;
  return data;
}

export async function createDispatch(payload: any) {
  const { data, error } = await supabase.from("health_ambulance_dispatches").insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function handoverDispatch(payload: any) {
  const { data, error } = await supabase.from("health_ambulance_dispatches").update({
    status: payload.status,
    receiving_nurse: payload.receiving_nurse,
    condition_notes: payload.condition_notes,
    vitals_snapshot: payload.vitals_snapshot,
    handed_over_at: payload.handed_over_at,
  }).eq("id", payload.dispatch_id).select().single();
  if (error) throw error;
  return data;
}
