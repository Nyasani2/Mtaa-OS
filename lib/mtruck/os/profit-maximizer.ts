import { calculateFreightPrice } from "../ai/dynamic-pricing-engine";

export function evaluateOpportunity(request: any) {
  const pricing = calculateFreightPrice({
    base_price: 50,
    distance_km: request.distance_km || 10,
    demand_level: request.demand_level || 2,
    truck_availability: request.availability || 0.5
  });

  const profit_score = pricing.price / (request.distance_km || 1);

  return {
    price: pricing.price,
    profit_score,
    should_accept: profit_score > 8
  };
}
