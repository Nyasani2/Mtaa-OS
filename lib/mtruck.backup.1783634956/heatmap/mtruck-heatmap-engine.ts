import { supabase } from "../../supabase";

export async function buildSurgeHeatmap() {

  const { data: shipments } = await supabase
    .from("mtruck_shipments")
    .select("*");

  const zones: Record<string, number> = {};

  for (const s of shipments || []) {

    const key =
      `${Math.floor(s.pickup_lat)}:${Math.floor(s.pickup_lng)}`;

    zones[key] = (zones[key] || 0) + 1;
  }

  return Object.entries(zones).map(([zone, demand]) => ({
    zone,
    demand,
    surge:
      demand > 10 ? 2.0 :
      demand > 5 ? 1.5 : 1.0
  }));
}
