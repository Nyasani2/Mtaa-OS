import { supabase } from "../../supabase";
import { calculateETA } from "../intelligence/eta-engine";

export async function matchFreightRequest(request: any) {
  const { data: trucks } = await supabase
    .from("truck_locations")
    .select("*");

  if (!trucks || trucks.length === 0) {
    return { matched: false, reason: "NO_AVAILABLE_TRUCKS" };
  }

  // simple scoring engine (upgrade later to ML)
  const scored = trucks.map((t: any) => {
    const distance = Math.sqrt(
      Math.pow(t.lat - request.pickup_lat, 2) +
      Math.pow(t.lng - request.pickup_lng, 2)
    );

    const eta = calculateETA({
      distance_km: distance * 111, // crude geo conversion
      avg_speed_kmh: t.speed_kmh || 40,
      traffic_factor: 1.2
    });

    return {
      truck_id: t.truck_id,
      score: eta
    };
  });

  scored.sort((a, b) => a.score - b.score);

  const best = scored[0];

  await supabase.from("freight_dispatches").insert({
    request_id: request.id,
    truck_id: best.truck_id,
    status: "ASSIGNED"
  });

  return {
    matched: true,
    truck_id: best.truck_id,
    eta_minutes: best.score
  };
}
