import { supabase } from "../../supabase";

function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export async function matchFreightRequest(request: any) {
  const { data: trucks } = await supabase
    .from("truck_locations")
    .select("*");

  if (!trucks || trucks.length === 0) return null;

  let bestTruck: any = null;
  let bestScore = Infinity;

  for (const truck of trucks) {
    const d = distance(
      request.pickup_lat,
      request.pickup_lng,
      truck.lat,
      truck.lng
    );

    const score = d * (truck.speed > 0 ? 0.8 : 1.2);

    if (score < bestScore) {
      bestScore = score;
      bestTruck = truck;
    }
  }

  if (!bestTruck) return null;

  await supabase.from("dispatch_assignments").insert({
    request_id: request.id,
    truck_id: bestTruck.truck_id,
    status: "ASSIGNED",
    created_at: new Date().toISOString(),
  });

  return {
    truck: bestTruck,
    score: bestScore,
  };
}
