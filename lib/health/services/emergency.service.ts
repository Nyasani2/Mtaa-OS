import { supabase } from "@/lib/supabase/client";

export async function getEmergencyCases(filter: string) {
  let q = supabase.from("health_emergency_cases").select("*").order("reported_at", { ascending: false });
  if (filter === "resolved") q = q.eq("status", "resolved");
  else if (filter !== "all") q = q.eq("triage_level", filter).eq("status", "active");
  else q = q.eq("status", "active");
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createEmergencyCase(payload: any) {
  const { data, error } = await supabase.from("health_emergency_cases").insert([payload]).select().single();
  if (error) throw error;
  return data;
}
