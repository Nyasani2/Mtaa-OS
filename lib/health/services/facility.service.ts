import { supabase } from "@/lib/supabase";

export async function getFacilities(filter: string, range: { from: number; to: number }) {
  let q = supabase.from("health_facilities").select("*", { count: "exact" }).order("name", { ascending: true });
  if (filter !== "all") q = q.eq("type", filter);
  const { data, error, count } = await q.range(range.from, range.to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function createFacility(payload: any) {
  const { data, error } = await supabase.from("health_facilities").insert([payload]).select().maybeSingle();
  if (error) throw error;
  return data;
}
