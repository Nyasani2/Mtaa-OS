import { supabase } from "@/lib/supabase/client";

export async function getFacilities(filter: string) {
  let q = supabase.from("health_facilities").select("*").order("name", { ascending: true });
  if (filter !== "all") q = q.eq("type", filter);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createFacility(payload: any) {
  const { data, error } = await supabase.from("health_facilities").insert([payload]).select().single();
  if (error) throw error;
  return data;
}
