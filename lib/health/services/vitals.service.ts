import { supabase } from "@/lib/supabase/client";

export async function getVitalsRecords(filter: string, range: { from: number; to: number }) {
  const { data, error, count } = await supabase
    .from("health_vitals")
    .select("*", { count: "exact" })
    .order("recorded_at", { ascending: false })
    .range(range.from, range.to);
  if (error) throw error;
  let records = data ?? [];
  if (filter !== "all") {
    records = records.filter((r: any) => {
      if (r.bp_systolic > 180 || r.heart_rate > 120 || r.oxygen_saturation < 90) return filter === "critical";
      if (r.bp_systolic > 140 || r.heart_rate > 100 || r.temperature > 38) return filter === "abnormal";
      return filter === "normal";
    });
  }
  return { data: records, count: count ?? 0 };
}

export async function createVitalsRecord(payload: any) {
  const { data, error } = await supabase.from("health_vitals").insert([payload]).select().single();
  if (error) throw error;
  return data;
}
