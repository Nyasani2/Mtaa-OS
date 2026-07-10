import { optimizeRoutes } from "./route-optimization-engine";

export async function rerouteTruck(truck_id: string) {
  const possibleRoutes = [
    {
      route_id: "A",
      distance_km: 120,
      traffic_level: 8,
      road_risk: 3,
      fuel_cost: 40,
      toll_cost: 5,
    },
    {
      route_id: "B",
      distance_km: 140,
      traffic_level: 3,
      road_risk: 2,
      fuel_cost: 35,
      toll_cost: 10,
    },
    {
      route_id: "C",
      distance_km: 100,
      traffic_level: 9,
      road_risk: 7,
      fuel_cost: 38,
      toll_cost: 2,
    },
  ];

  const ranked = optimizeRoutes(possibleRoutes);

  return {
    truck_id,
    best_route: ranked[0],
    alternatives: ranked,
  };
}
