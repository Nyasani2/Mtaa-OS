import { supabase } from "@/lib/supabase/client";

export async function getPatients(range: { from: number; to: number }) {
  const { data, error, count } = await supabase
    .from("health_patients")
    .select("*", { count: "exact" })
    .order("full_name", { ascending: true })
    .range(range.from, range.to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function getPolicies(range: { from: number; to: number }) {
  const { data, error, count } = await supabase
    .from("health_policies")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(range.from, range.to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function createClaim(payload: any) {
  const { data, error } = await supabase.from("health_insurance_claims").insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function getClaims(filter: string, range: { from: number; to: number }) {
  let q = supabase.from("health_insurance_claims").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (filter !== "all") q = q.eq("status", filter);
  const { data, error, count } = await q.range(range.from, range.to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}
