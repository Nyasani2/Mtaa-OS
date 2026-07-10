import { supabase } from "../../supabase";

export interface RouteRisk {
  score: number;

  level:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  reasons: string[];
}

export async function analyzeRouteRisk(
  originLat: number,
  originLng: number,
  destinationLat: number,
  destinationLng: number
): Promise<RouteRisk> {

  const reasons: string[] = [];

  let riskScore = 0;

  const hour = new Date().getHours();

  if (hour >= 22 || hour <= 5) {
    riskScore += 25;

    reasons.push(
      "Night transport risk"
    );
  }

  const distance =
    Math.sqrt(
      Math.pow(
        destinationLat - originLat,
        2
      ) +
      Math.pow(
        destinationLng - originLng,
        2
      )
    ) * 111;

  if (distance > 300) {
    riskScore += 30;

    reasons.push(
      "Long haul route"
    );
  }

  const { data: hotspots } =
    await supabase
      .from(
        "mtruck_traffic_hotspots"
      )
      .select("*");

  if ((hotspots || []).length > 10) {
    riskScore += 15;

    reasons.push(
      "Heavy traffic corridor"
    );
  }

  let level:
    | "LOW"
    | "MEDIUM"
    | "HIGH" = "LOW";

  if (riskScore >= 60) {
    level = "HIGH";
  } else if (riskScore >= 30) {
    level = "MEDIUM";
  }

  return {
    score: riskScore,
    level,
    reasons,
  };
}
