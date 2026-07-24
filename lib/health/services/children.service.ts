import { supabase } from "@/lib/supabase";

export async function getChildrenRecords(filter: string, range: { from: number; to: number }) {
  let q = supabase.from("health_patients").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (filter !== "all") {
    const now = new Date();
    if (filter === "infant") q = q.gte("date_of_birth", new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString());
    if (filter === "toddler") q = q.gte("date_of_birth", new Date(now.getFullYear() - 3, now.getMonth(), now.getDate()).toISOString()).lt("date_of_birth", new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString());
    if (filter === "child") q = q.gte("date_of_birth", new Date(now.getFullYear() - 12, now.getMonth(), now.getDate()).toISOString()).lt("date_of_birth", new Date(now.getFullYear() - 3, now.getMonth(), now.getDate()).toISOString());
    if (filter === "adolescent") q = q.lt("date_of_birth", new Date(now.getFullYear() - 12, now.getMonth(), now.getDate()).toISOString());
  }
  const { data, error, count } = await q.range(range.from, range.to);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function createChildRecord(payload: any) {
  const { data, error } = await supabase.from("health_patients").insert([payload]).select().single();
  if (error) throw error;
  return data;
}
