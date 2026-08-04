import { supabase } from "../../supabase";
import { calculateETA } from "../eta/eta-engine";

export async function runMTruckBrain() {
  const { data: activeTrips } = await supabase
    .from("freight_trips")
    .select("*")
    .eq("status", "IN_TRANSIT");

  if (!activeTrips) return;

  const insights = [];

  for (const trip of activeTrips) {
    const eta = calculateETA({
      distance_km: trip.distance_km || 10,
      avg_speed_kmh: 60,
      traffic_multiplier: 1.2,
      loading_time_min: 20,
    });

    await supabase.from("mtruck_ai_insights").upsert({
      trip_id: trip.id,
      eta_minutes: eta.eta_minutes,
      confidence: eta.confidence,
      updated_at: new Date().toISOString(),
    });

    insights.push({ trip_id: trip.id, eta });
  }

  return {
    processed: insights.length,
    insights,
  };
}
