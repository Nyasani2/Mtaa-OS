import { getLiveFleetPositions } from "../realtime/mtruck-realtime-gps-engine";

export interface MapDot {
  truck_id: string;
  lat: number;
  lng: number;
  speed: number;
}

export async function buildLiveFleetMap() {

  const gps = await getLiveFleetPositions();

  const latest: Record<string, MapDot> = {};

  for (const point of gps) {

    if (!latest[point.truck_id]) {

      latest[point.truck_id] = {
        truck_id: point.truck_id,
        lat: point.lat,
        lng: point.lng,
        speed: point.speed_kph,
      };
    }
  }

  return Object.values(latest);
}
