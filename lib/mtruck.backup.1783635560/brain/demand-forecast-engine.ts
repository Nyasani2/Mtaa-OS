import { supabase } from "../../supabase";

export interface ZoneDemand {
  zone_id: string;
  lat: number;
  lng: number;

  demand_score: number;
  active_requests: number;
  available_drivers: number;
}

/**
 * Predict demand per geographic zone
 */
export async function forecastZoneDemand(): Promise<ZoneDemand[]> {

  const { data: requests } = await supabase
    .from("freight_requests")
    .select("pickup_lat, pickup_lng, status");

  const { data: drivers } = await supabase
    .from("freight_driver_locations")
    .select("lat, lng");

  const zones: Record<string, ZoneDemand> = {};

  function getZone(lat: number, lng: number) {
    const grid = 0.05;
    return `${Math.floor(lat / grid)},${Math.floor(lng / grid)}`;
  }

  // Count demand
  for (const r of requests || []) {
    const zone = getZone(r.pickup_lat, r.pickup_lng);

    if (!zones[zone]) {
      zones[zone] = {
        zone_id: zone,
        lat: r.pickup_lat,
        lng: r.pickup_lng,
        demand_score: 0,
        active_requests: 0,
        available_drivers: 0,
      };
    }

    zones[zone].active_requests += 1;
    zones[zone].demand_score += 1;
  }

  // Count drivers
  for (const d of drivers || []) {
    const zone = getZone(d.lat, d.lng);

    if (!zones[zone]) continue;

    zones[zone].available_drivers += 1;
  }

  // Normalize demand score
  return Object.values(zones).map((z) => ({
    ...z,
    demand_score:
      z.active_requests / (z.available_drivers + 1),
  }));
}
