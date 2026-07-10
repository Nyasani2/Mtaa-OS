import { supabase } from "../../supabase";

export async function balanceFleetAcrossCities() {

  const { data: fleet } = await supabase
    .from("mtruck_fleet")
    .select("*");

  const cities: Record<string, number> = {};

  for (const truck of fleet || []) {

    const city = truck.city || "UNKNOWN";

    cities[city] = (cities[city] || 0) + 1;
  }

  const imbalance = Object.entries(cities)
    .map(([city, count]) => ({
      city,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const overCapacity = imbalance[0];

  const underCapacity = imbalance[imbalance.length - 1];

  return {
    overCapacity,
    underCapacity,
    recommendation:
      "REDISTRIBUTE_FLEET",
  };
}
