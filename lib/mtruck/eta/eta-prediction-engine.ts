/**
 * MTRUCK ETA ENGINE v1
 * Lightweight but extensible logistics prediction model
 */

export interface ETACalcInput {
  distance_km: number;
  avg_speed_kmh: number;
  traffic_factor?: number; // 1 = normal, >1 = traffic
}

/**
 * Predict ETA in minutes
 */
export function calculateETA(input: ETACalcInput): number {

  const traffic_factor = input.traffic_factor ?? 1.2;

  const effective_speed = input.avg_speed_kmh / traffic_factor;

  if (effective_speed <= 0) return 999;

  const hours = input.distance_km / effective_speed;

  const minutes = hours * 60;

  return Math.round(minutes);
}

/**
 * Dynamic ETA using live speed updates
 */
export function dynamicETA(
  distance_remaining_km: number,
  current_speed_kmh: number
): number {

  const SAFE_SPEED = Math.max(current_speed_kmh, 10); // avoid division crash

  return Math.round((distance_remaining_km / SAFE_SPEED) * 60);
}
