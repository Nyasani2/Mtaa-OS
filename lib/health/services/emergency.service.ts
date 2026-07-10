import { supabase } from "@/lib/supabase/client";

export async function getEmergencyCases(filter: string, range: { from: number; to: number }) {
  let q = supabase.from("health_ambulance_dispatches").select("*", { count: "exact" }).order("reported_at", { ascending: false });
  if (filter === "resolved") q = q.eq("status", "resolved");
  else if (filter !== "all") q = q.eq("triage_level", filter).eq("status", "active");
  else q = q.eq("status", "active");
  const { data, error, count } = await q.range(range.from, range.to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function createEmergencyCase(payload: any) {
  const { data, error } = await supabase.from("health_ambulance_dispatches").insert([payload]).select().single();
  if (error) throw error;
  return data;
}
