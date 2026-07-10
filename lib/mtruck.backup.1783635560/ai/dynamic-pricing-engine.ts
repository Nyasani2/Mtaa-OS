export interface PriceInput {
  base_price: number;
  distance_km: number;
  demand_level: number; // 1 low, 2 medium, 3 high
  truck_availability: number; // 0–1
}

export function calculateFreightPrice(input: PriceInput) {
  const demandMultiplier = 1 + (input.demand_level * 0.35);
  const scarcityMultiplier = 1 + (1 - input.truck_availability) * 0.5;

  const distanceCost = input.distance_km * 1.2;

  const finalPrice =
    (input.base_price + distanceCost) *
    demandMultiplier *
    scarcityMultiplier;

  return {
    price: Math.round(finalPrice),
    breakdown: {
      base: input.base_price,
      distance: distanceCost,
      demand_multiplier: demandMultiplier,
      scarcity_multiplier: scarcityMultiplier
    }
  };
}
