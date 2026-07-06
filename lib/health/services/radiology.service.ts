import { supabase } from "@/lib/supabase/client";

export async function getRadiologyReports(filter: string) {
  let q = supabase.from("health_radiology_reports").select("*").order("reported_at", { ascending: false });
  if (filter !== "all") q = q.eq("status", filter);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createRadiologyReport(payload: any) {
  const { data, error } = await supabase.from("health_radiology_reports").insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function getRadiologyRequests(filter: string) {
  let q = supabase.from("health_radiology_requests").select("*").order("requested_at", { ascending: false });
  if (filter !== "all") q = q.eq("status", filter);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createRadiologyRequest(payload: any) {
  const { data, error } = await supabase.from("health_radiology_requests").insert([payload]).select().single();
  if (error) throw error;
  return data;
}
