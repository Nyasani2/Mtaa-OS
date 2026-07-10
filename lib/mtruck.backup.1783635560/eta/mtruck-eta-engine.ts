import { supabase } from "../../supabase";

export async function computeETA(
  truck_id: string,
  shipment_id: string
) {

  const { data: gps } = await supabase
    .from("mtruck_gps_stream")
    .select("*")
    .eq("truck_id", truck_id)
    .order("timestamp", { ascending: false })
    .limit(1)
    .single();

  const { data: shipment } = await supabase
    .from("mtruck_shipments")
    .select("*")
    .eq("id", shipment_id)
    .single();

  if (!gps || !shipment) {
    return null;
  }

  const distance_km =
    Math.sqrt(
      Math.pow(
        gps.lat - shipment.dropoff_lat,
        2
      ) +
      Math.pow(
        gps.lng - shipment.dropoff_lng,
        2
      )
    ) * 111;

  const speed = gps.speed || 30;

  const eta_minutes =
    Math.round((distance_km / speed) * 60);

  await supabase
    .from("mtruck_shipments")
    .update({
      eta_minutes,
    })
    .eq("id", shipment_id);

  return {
    distance_km,
    eta_minutes,
  };
}
