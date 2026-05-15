type TruckLocation = {
  truck_id: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
};

async function updateTruckLocation(location: TruckLocation) {
  return location;
}

export async function streamTruckLocation(payload: any) {
  const enriched: TruckLocation = {
    truck_id: payload.truck_id,
    lat: payload.lat,
    lng: payload.lng,
    speed: payload.speed_kmh || 0,
    heading: payload.heading || 0,
    timestamp: payload.updated_at || new Date().toISOString(),
  };

  await updateTruckLocation(enriched);

  return enriched;
}
