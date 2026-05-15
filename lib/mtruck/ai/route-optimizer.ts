export interface RouteInput {
  distance_km: number;
  traffic_level: number; // 1.0 normal, 2.0 heavy
  road_quality: number;  // 1.0 good, 0.5 bad
  weather_factor?: number;
}

export function optimizeRoute(input: RouteInput) {
  const weather = input.weather_factor ?? 1;

  const penalty =
    input.traffic_level *
    (2 - input.road_quality) *
    weather;

  const adjustedDistance = input.distance_km * penalty;

  const estimated_time_hours = adjustedDistance / 45; // avg truck speed baseline

  return {
    adjusted_distance_km: adjustedDistance,
    eta_minutes: Math.round(estimated_time_hours * 60),
    efficiency_score: 1 / penalty
  };
}
