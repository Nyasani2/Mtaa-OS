import { supabase } from "@/lib/supabase";

export async function getRadiologyReports(filter: string, range: { from: number; to: number }) {
  let q = supabase.from("health_radiology_reports").select("*", { count: "exact" }).order("reported_at", { ascending: false });
  if (filter !== "all") q = q.eq("status", filter);
  const { data, error, count } = await q.range(range.from, range.to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function createRadiologyReport(payload: any) {
  const { data, error } = await supabase.from("health_radiology_reports").insert([payload]).select().maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRadiologyRequests(filter: string, range: { from: number; to: number }) {
  let q = supabase.from("health_audit_logs").select("*", { count: "exact" }).order("requested_at", { ascending: false });
  if (filter !== "all") q = q.eq("status", filter);
  const { data, error, count } = await q.range(range.from, range.to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function createRadiologyRequest(payload: any) {
  const { data, error } = await supabase.from("health_audit_logs").insert([payload]).select().maybeSingle();
  if (error) throw error;
  return data;
}
