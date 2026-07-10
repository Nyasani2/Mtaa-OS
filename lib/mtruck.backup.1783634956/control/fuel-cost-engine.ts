export function estimateTripCost(distance_km: number, fuel_price_per_litre = 2.0) {
  const fuel_efficiency_km_per_litre = 5;

  const fuel_needed = distance_km / fuel_efficiency_km_per_litre;

  const cost = fuel_needed * fuel_price_per_litre;

  return {
    fuel_needed,
    cost: Math.round(cost)
  };
}
