export interface ETAInput {
  distance_km: number;
  avg_speed_kmh: number;
  traffic_multiplier: number;
  loading_time_min?: number;
}

export function calculateETA(input: ETAInput) {
  const baseTimeHours = input.distance_km / Math.max(input.avg_speed_kmh, 1);

  const trafficAdjusted = baseTimeHours * input.traffic_multiplier;

  const loading = (input.loading_time_min || 0) / 60;

  const totalHours = trafficAdjusted + loading;

  const etaMinutes = Math.round(totalHours * 60);

  return {
    eta_minutes: etaMinutes,
    eta_hours: totalHours,
    confidence: input.traffic_multiplier > 1.5 ? "LOW" : "HIGH",
  };
}
