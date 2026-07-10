import { supabase } from "../../supabase";
import { MTruckRealtimeHub } from "./mtruck-realtime-hub";

const hub = new MTruckRealtimeHub();

export async function streamGPSUpdate(
  truck_id: string,
  lat: number,
  lng: number,
  speed: number
) {

  const update = {
    truck_id,
    lat,
    lng,
    speed,
    timestamp: new Date().toISOString(),
  };

  await supabase
    .from("mtruck_gps_stream")
    .insert(update);

  hub.emit("fleet:update", update);

  return update;
}
