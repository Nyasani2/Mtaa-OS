import { supabase } from "../../../supabase";

/**
 * STREETS BRAIN
 * Real-time urban activity intelligence system
 */

export interface StreetSignal {
  lat: number;
  lng: number;
  type: "TRAFFIC" | "CROWD" | "COMMERCIAL" | "EVENT" | "RISK";
  intensity: number;
}

export interface CitySnapshot {
  signals: StreetSignal[];
  hotspots: StreetSignal[];
  mobility_pressure: number;
}

/**
 * Collect raw street signals
 */
export async function collectStreetSignals(): Promise<StreetSignal[]> {
  const { data: gps, error } = await supabase
    .from("street_gps_stream")
    .select("*");

  if (error || !gps) return [];

  return gps.map((g: any) => ({
    lat: g.lat,
    lng: g.lng,
    type: g.type || "CROWD",
    intensity: g.intensity || 1,
  }));
}

/**
 * Cluster hotspots
 */
export function buildHotspots(signals: StreetSignal[]) {
  const map = new Map<string, StreetSignal>();

  for (const s of signals) {
    const key = `${Math.round(s.lat * 100)}_${Math.round(s.lng * 100)}`;

    if (!map.has(key)) {
      map.set(key, { ...s });
    } else {
      const existing = map.get(key)!;
      existing.intensity += s.intensity;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.intensity - a.intensity);
}

/**
 * Main streets snapshot engine
 */
export async function getStreetSnapshot(): Promise<CitySnapshot> {
  const signals = await collectStreetSignals();
  const hotspots = buildHotspots(signals);

  const mobility_pressure =
    signals.reduce((sum, s) => sum + s.intensity, 0) / (signals.length || 1);

  return {
    signals,
    hotspots,
    mobility_pressure,
  };
}
