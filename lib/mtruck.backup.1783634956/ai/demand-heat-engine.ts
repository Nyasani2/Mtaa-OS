import { supabase } from "../../supabase";

export async function generateDemandHeat() {
  const { data: requests } = await supabase
    .from("freight_requests")
    .select("pickup_lat, pickup_lng, created_at");

  const heatMap: Record<string, number> = {};

  for (const r of requests || []) {
    const key = `${Math.round(r.pickup_lat * 10)},${Math.round(r.pickup_lng * 10)}`;

    heatMap[key] = (heatMap[key] || 0) + 1;
  }

  const hotspots = Object.entries(heatMap).map(([key, value]) => {
    const [lat, lng] = key.split(",").map(Number);

    return {
      lat,
      lng,
      intensity: value
    };
  });

  return hotspots;
}
