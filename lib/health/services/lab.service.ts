import { supabase } from "@/lib/supabase/client";

export async function getLabSamples(filter: string, range: { from: number; to: number }) {
  let q = supabase.from("health_lab_samples").select("*", { count: "exact" }).order("collected_at", { ascending: false });
  if (filter !== "all") q = q.eq("status", filter);
  const { data, error, count } = await q.range(range.from, range.to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function createLabSample(payload: any) {
  const { data, error } = await supabase.from("health_lab_samples").insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function getLabEquipment(filter: string, range: { from: number; to: number }) {
  let q = supabase.from("health_lab_equipment").select("*", { count: "exact" }).order("name", { ascending: true });
  if (filter !== "all") q = q.eq("status", filter);
  const { data, error, count } = await q.range(range.from, range.to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function createLabEquipment(payload: any) {
  const { data, error } = await supabase.from("health_lab_equipment").insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function updateEquipmentStatus({ id, status }: { id: string; status: string }) {
  const { data, error } = await supabase.from("health_lab_equipment").update({
    status,
    last_calibrated_at: status === "calibrating" ? new Date().toISOString() : undefined,
  }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function getLabResults(filter: string, range: { from: number; to: number }) {
  let q = supabase.from("health_lab_results").select("*", { count: "exact" }).order("recorded_at", { ascending: false });
  if (filter !== "all") q = q.eq("flag", filter);
  const { data, error, count } = await q.range(range.from, range.to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function createLabResult(payload: any) {
  const { data, error } = await supabase.from("health_lab_results").insert([payload]).select().single();
  if (error) throw error;
  return data;
}
