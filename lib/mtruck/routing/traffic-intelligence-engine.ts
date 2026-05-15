import { supabase } from "../../supabase";

export async function getTrafficZones() {
  const { data } = await supabase
    .from("traffic_zones")
    .select("*");

  return data || [];
}

export async function getTrafficMultiplier(
  lat: number,
  lng: number
) {
  const zones = await getTrafficZones();

  let multiplier = 1;

  for (const zone of zones) {
    const near =
      Math.abs(zone.lat - lat) < 0.05 &&
      Math.abs(zone.lng - lng) < 0.05;

    if (near) {
      multiplier = Math.max(multiplier, zone.multiplier);
    }
  }

  return multiplier;
}
