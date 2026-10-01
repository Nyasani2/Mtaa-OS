export interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

// Using free OpenStreetMap Nominatim API
export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MTAA-OS/1.0 (kevin@mtaa.africa)' }
    });
    const data = await res.json();
    return data.map((r: any) => ({
      address: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      placeId: r.place_id,
    }));
  } catch (error) {
    console.error('Nominatim geocoding failed:', error);
    return [];
  }
}

// Using free OpenStreetMap Nominatim Reverse Geocoding
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MTAA-OS/1.0 (kevin@mtaa.africa)' }
    });
    const data = await res.json();
    return data.display_name || null;
  } catch (error) {
    console.error('Nominatim reverse geocoding failed:', error);
    return null;
  }
}
