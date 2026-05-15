import { supabase } from "../../supabase";

export interface ETAResult {
  estimated_minutes: number;
  traffic_multiplier: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
}

export async function predictDeliveryETA(
  distanceKm: number,
  truckSpeedKph: number
): Promise<ETAResult> {

  const baseMinutes =
    (distanceKm / Math.max(truckSpeedKph, 20)) * 60;

  const hour = new Date().getHours();

  let trafficMultiplier = 1;

  if (hour >= 6 && hour <= 9) {
    trafficMultiplier = 1.4;
  }

  if (hour >= 16 && hour <= 20) {
    trafficMultiplier = 1.7;
  }

  let riskLevel:
    | "LOW"
    | "MEDIUM"
    | "HIGH" = "LOW";

  if (trafficMultiplier >= 1.7) {
    riskLevel = "HIGH";
  } else if (trafficMultiplier >= 1.4) {
    riskLevel = "MEDIUM";
  }

  return {
    estimated_minutes: Math.round(
      baseMinutes * trafficMultiplier
    ),

    traffic_multiplier: trafficMultiplier,

    risk_level: riskLevel,
  };
}

export async function saveETAForecast(
  deliveryId: string,
  eta: ETAResult
) {

  const { error } = await supabase
    .from("mtruck_eta_predictions")
    .insert({
      delivery_id: deliveryId,
      estimated_minutes:
        eta.estimated_minutes,
      traffic_multiplier:
        eta.traffic_multiplier,
      risk_level: eta.risk_level,
    });

  if (error) {
    throw error;
  }

  return true;
}
