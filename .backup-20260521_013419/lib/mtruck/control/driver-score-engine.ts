import { supabase } from "../../supabase";

export async function computeDriverScores() {
  const { data: trips } = await supabase.from("freight_dispatches").select("*");

  const scores: Record<string, number> = {};

  for (const t of trips || []) {
    if (!scores[t.truck_id]) scores[t.truck_id] = 0;

    if (t.status === "COMPLETED") scores[t.truck_id] += 10;
    if (t.status === "DELAYED") scores[t.truck_id] -= 5;
    if (t.status === "CANCELLED") scores[t.truck_id] -= 15;
  }

  return Object.entries(scores).map(([truck_id, score]) => ({
    truck_id,
    score
  }));
}
