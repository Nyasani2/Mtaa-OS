import { forecastZoneDemand } from "./demand-forecast-engine";

/**
 * Balances fleet distribution across zones
 */
export async function computeFleetBalance() {

  const zones = await forecastZoneDemand();

  const overloaded = zones.filter((z: any) => z.demand_score < 0.8 && z.available_drivers > 5);
  const underloaded = zones.filter((z: any) => z.demand_score > 1.5);

  return {
    move_out: overloaded,
    move_in: underloaded,
  };
}
