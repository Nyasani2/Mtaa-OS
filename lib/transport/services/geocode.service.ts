const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  if (!GOOGLE_API_KEY) {
    console.warn('MTAA: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY not set');
    throw new Error('Google Maps API key not configured. Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to your .env');
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === 'ZERO_RESULTS') return [];
  if (data.status !== 'OK') throw new Error(data.error_message || `Geocoding failed: ${data.status}`);
  return data.results.map((r: any) => ({
    address: r.formatted_address,
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    placeId: r.place_id,
  }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!GOOGLE_API_KEY) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK' && data.results.length > 0) return data.results[0].formatted_address;
    return null;
  } catch { return null; }
}
