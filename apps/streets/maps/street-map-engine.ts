import { getStreetSnapshot } from "../intelligence/streets-brain";

/**
 * STREET MAP ENGINE
 * Converts raw signals into map overlays
 */

export async function buildStreetMapLayer() {
  const snapshot = await getStreetSnapshot();

  return {
    heatmap: snapshot.hotspots.map((h) => ({
      lat: h.lat,
      lng: h.lng,
      intensity: h.intensity,
    })),

    pressureIndex: snapshot.mobility_pressure,

    alerts: snapshot.hotspots
      .filter((h) => h.intensity > 5)
      .map((h) => ({
        type: "HOTSPOT_ALERT",
        lat: h.lat,
        lng: h.lng,
      })),
  };
}
