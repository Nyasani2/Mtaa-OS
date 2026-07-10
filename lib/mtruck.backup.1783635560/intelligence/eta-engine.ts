export interface ETAInput {
  distance_km: number;
  avg_speed_kmh: number;
  traffic_factor?: number; // 1.0 normal, 1.5 heavy traffic
}

export function calculateETA(input: ETAInput): number {
  const traffic = input.traffic_factor ?? 1;

  const effectiveSpeed = input.avg_speed_kmh / traffic;

  if (effectiveSpeed <= 0) return Infinity;

  const hours = input.distance_km / effectiveSpeed;

  return Math.round(hours * 60); // minutes
}
