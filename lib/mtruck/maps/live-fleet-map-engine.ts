import { supabase } from "../../supabase";

export interface FleetVehicle {
  truck_id: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  status?: string;
}

export async function getFleetVehicles(): Promise<FleetVehicle[]> {
  const { data, error } = await supabase
    .from("truck_locations")
    .select("*");

  if (error) throw error;

  return data || [];
}

export function subscribeFleetMap(
  callback: (vehicles: FleetVehicle[]) => void
) {
  return supabase
    .channel("fleet-live-map")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "truck_locations",
      },
      async () => {
        const vehicles = await getFleetVehicles();
        callback(vehicles);
      }
    )
    .subscribe();
}
