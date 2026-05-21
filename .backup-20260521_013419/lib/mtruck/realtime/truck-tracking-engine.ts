import { supabase } from "../../supabase";

export interface TruckLocationUpdate {
  driver_id: string;
  lat: number;
  lng: number;
  speed_kmh?: number;
  heading?: number;
  timestamp: string;
}

/**
 * LIVE TRACKING WRITER
 * Pushes GPS updates into Supabase realtime table
 */
export async function updateTruckLocation(update: TruckLocationUpdate) {
  const { error } = await supabase
    .from("freight_driver_locations")
    .upsert({
      driver_id: update.driver_id,
      lat: update.lat,
      lng: update.lng,
      speed_kmh: update.speed_kmh ?? 0,
      heading: update.heading ?? 0,
      updated_at: update.timestamp,
    });

  if (error) {
    console.error("TRACKING ERROR:", error);
    return { success: false };
  }

  return { success: true };
}

/**
 * SUBSCRIBE TO LIVE DRIVER POSITION STREAM
 */
export function subscribeToTruck(driver_id: string, callback: (data: any) => void) {
  return supabase
    .channel(`truck-${driver_id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "freight_driver_locations",
        filter: `driver_id=eq.${driver_id}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
}
