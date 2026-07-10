export interface RouteCandidate {
  route_id: string;
  distance_km: number;
  traffic_level: number;
  road_risk: number;
  fuel_cost: number;
  toll_cost: number;
}

export interface OptimizedRoute {
  route_id: string;
  score: number;
  recommendation: string;
}

function calculateScore(route: RouteCandidate) {
  const distanceWeight = route.distance_km * 0.35;
  const trafficWeight = route.traffic_level * 0.25;
  const riskWeight = route.road_risk * 0.20;
  const fuelWeight = route.fuel_cost * 0.15;
  const tollWeight = route.toll_cost * 0.05;

  return (
    distanceWeight +
    trafficWeight +
    riskWeight +
    fuelWeight +
    tollWeight
  );
}

export function optimizeRoutes(
  routes: RouteCandidate[]
): OptimizedRoute[] {
  return routes
    .map((route) => ({
      route_id: route.route_id,
      score: calculateScore(route),
      recommendation:
        route.traffic_level > 7
          ? "AVOID_CONGESTION"
          : route.road_risk > 7
          ? "HIGH_RISK"
          : "OPTIMAL",
    }))
    .sort((a, b) => a.score - b.score);
}
