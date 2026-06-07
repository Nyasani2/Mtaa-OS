import { supabase } from "../../supabase";

export async function pushTruckLocation(
  truck_id: string,
  lat: number,
  lng: number
) {
  await supabase.from("truck_locations").upsert({
    truck_id,
    lat,
    lng,
    speed: Math.floor(Math.random() * 90),
    heading: Math.floor(Math.random() * 360),
    updated_at: new Date().toISOString(),
  });
}

export async function simulateMovement() {
  let lat = -1.2921;
  let lng = 36.8219;

  setInterval(async () => {
    lat += (Math.random() - 0.5) * 0.01;
    lng += (Math.random() - 0.5) * 0.01;

    await pushTruckLocation("TRUCK_001", lat, lng);

    // Truck location event logged via kernel observability
  }, 5000);
}

