export function computeSatelliteRoute(
  origin: any,
  destination: any
) {

  const base_distance =
    Math.sqrt(
      Math.pow(
        origin.lat - destination.lat,
        2
      ) +
      Math.pow(
        origin.lng - destination.lng,
        2
      )
    ) * 111;

  const latency_penalty = 1.4;

  return {
    distance_km: base_distance,
    routing_mode: "SATELLITE_FALLBACK",
    adjusted_time:
      base_distance * latency_penalty,
  };
}
