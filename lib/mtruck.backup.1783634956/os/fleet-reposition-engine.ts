// lib/mtruck/os/fleet-reposition-engine.ts
export interface Truck {
  id: string;
  lat: number;
  lng: number;
  available: boolean;
  capacity: number;
}

export interface DemandZone {
  lat: number;
  lng: number;
  weight: number;
}

export interface RepositionPlan {
  truckId: string;
  targetLat: number;
  targetLng: number;
  reason: string;
}

export function computeRepositionPlan(trucks: Truck[] | null, demandZones: DemandZone[]): RepositionPlan[] {
  if (!trucks || trucks.length === 0 || demandZones.length === 0) return [];

  const topZone = demandZones.sort((a, b) => b.weight - a.weight)[0];
  const plans: RepositionPlan[] = [];

  for (const truck of trucks) {
    if (!truck.available) continue;
    const targetLat = truck.lat + (topZone.lat - truck.lat) * 0.1;
    const targetLng = truck.lng + (topZone.lng - truck.lng) * 0.1;
    plans.push({
      truckId: truck.id,
      targetLat,
      targetLng,
      reason: `Move toward demand zone (${topZone.weight} weight)`,
    });
  }

  return plans;
}

export function repositionFleet(trucks: Truck[] | null, demandZones: DemandZone[]): Truck[] {
  if (!trucks || trucks.length === 0) return [];
  if (demandZones.length === 0) return trucks;

  const topZone = demandZones.sort((a, b) => b.weight - a.weight)[0];

  return trucks.map(truck => {
    if (!truck.available) return truck;
    const newLat = truck.lat + (topZone.lat - truck.lat) * 0.1;
    const newLng = truck.lng + (topZone.lng - truck.lng) * 0.1;
    return { ...truck, lat: newLat, lng: newLng };
  });
}
