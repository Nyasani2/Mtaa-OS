import { supabase } from "../../supabase";

export interface TruckLocation {
  truck_id: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: number;
}

export async function updateTruckLocation(data: TruckLocation) {
  const { error } = await supabase
    .from("truck_locations")
    .upsert({
      truck_id: data.truck_id,
      lat: data.lat,
      lng: data.lng,
      speed: data.speed,
      heading: data.heading,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;

  return { status: "ok" };
}

export async function subscribeTruck(truck_id: string, callback: (payload: any) => void) {
  return supabase
    .channel(`truck-${truck_id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "truck_locations",
        filter: `truck_id=eq.${truck_id}`,
      },
      callback
    )
    .subscribe();
}
