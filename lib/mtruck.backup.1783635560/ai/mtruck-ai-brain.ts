import { optimizeRoute } from "./route-optimizer";
import { calculateFreightPrice } from "./dynamic-pricing-engine";
import { generateDemandHeat } from "./demand-heat-engine";

export async function runMTruckAIBrain(sample: any) {
  const route = optimizeRoute(sample.route);
  const price = calculateFreightPrice(sample.priceInput);
  const heat = await generateDemandHeat();

  return {
    route,
    price,
    heat_map_hotspots: heat.slice(0, 10)
  };
}
