import { supabase } from "../../supabase";

export async function optimizeRoute(
  truck_id: string,
  destination_lat: number,
  destination_lng: number
) {

  const { data: gps } = await supabase
    .from("mtruck_gps_stream")
    .select("*")
    .eq("truck_id", truck_id)
    .order("timestamp", { ascending: false })
    .limit(1)
    .single();

  const baseDistance =
    Math.sqrt(
      Math.pow(gps.lat - destination_lat, 2) +
      Math.pow(gps.lng - destination_lng, 2)
    ) * 111;

  const congestionPenalty =
    Math.random() * 0.4 + 1; // placeholder congestion model

  const optimizedDistance =
    baseDistance * congestionPenalty;

  const eta_minutes =
    Math.round((optimizedDistance / 40) * 60);

  return {
    baseDistance,
    optimizedDistance,
    eta_minutes,
  };
}
