import { supabase } from "../../supabase";

export async function predictDemandWindow(minutesAhead = 30) {
  const { data: history } = await supabase
    .from("freight_requests")
    .select("pickup_lat, pickup_lng, created_at");

  const now = Date.now();

  const buckets: Record<string, number> = {};

  for (const r of history || []) {
    const timeDiff = now - new Date(r.created_at).getTime();

    const weight = timeDiff < minutesAhead * 60000 ? 3 : 1;

    const key = `${Math.round(r.pickup_lat * 10)},${Math.round(r.pickup_lng * 10)}`;

    buckets[key] = (buckets[key] || 0) + weight;
  }

  return Object.entries(buckets).map(([key, value]) => {
    const [lat, lng] = key.split(",").map(Number);

    return {
      lat,
      lng,
      predicted_demand: value
    };
  });
}
