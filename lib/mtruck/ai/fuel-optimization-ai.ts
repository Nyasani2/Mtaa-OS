export interface FuelInput {
  distance_km: number;
  cargo_weight_kg: number;
  avg_speed: number;
  traffic_multiplier: number;
}

export function predictFuelUsage(input: FuelInput) {
  const baseConsumption = input.distance_km * 0.28;

  const cargoPenalty =
    input.cargo_weight_kg * 0.00004;

  const trafficPenalty =
    input.traffic_multiplier * 2;

  const speedPenalty =
    input.avg_speed > 90 ? 4 : 1;

  const estimatedFuel =
    baseConsumption +
    cargoPenalty +
    trafficPenalty +
    speedPenalty;

  return {
    estimated_liters: Number(
      estimatedFuel.toFixed(2)
    ),
    eco_score:
      estimatedFuel < 25
        ? "EFFICIENT"
        : estimatedFuel < 45
        ? "MODERATE"
        : "HIGH_CONSUMPTION",
  };
}
