import { supabase } from "../../supabase";

export async function getFleetMapSnapshot() {
  const { data: trucks } = await supabase
    .from("truck_locations")
    .select("*");

  const { data: requests } = await supabase
    .from("freight_requests")
    .select("*");

  return {
    trucks: (trucks || []).map((t: any) => ({
      id: t.truck_id,
      lat: t.lat,
      lng: t.lng,
      speed: t.speed_kmh,
      status: t.status || "ACTIVE"
    })),
    requests: (requests || []).map((r: any) => ({
      id: r.id,
      lat: r.pickup_lat,
      lng: r.pickup_lng,
      status: r.status
    }))
  };
}
