import { calculateETA, dynamicETA } from "../eta/eta-prediction-engine";

/**
 * MTRUCK TRACKING BRAIN
 * Combines GPS + ETA prediction
 */

export function computeLiveTripState(data: {
  distance_remaining_km: number;
  speed_kmh: number;
}) {

  const eta = dynamicETA(
    data.distance_remaining_km,
    data.speed_kmh
  );

  return {
    eta_minutes: eta,
    status: eta < 10 ? "ARRIVING_SOON" : "IN_TRANSIT",
  };
}
