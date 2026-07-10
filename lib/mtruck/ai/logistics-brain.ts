import { rerouteTruck } from "../routing/dynamic-rerouting-engine";
import { supabase } from "../../supabase";

export async function runLogisticsBrain() {
  const { data: activeTrips } = await supabase
    .from("freight_trips")
    .select("*")
    .eq("status", "IN_TRANSIT");

  if (!activeTrips) return [];

  const decisions = [];

  for (const trip of activeTrips) {
    const reroute = await rerouteTruck(
      trip.truck_id
    );

    decisions.push({
      trip_id: trip.id,
      reroute,
    });

    await supabase
      .from("// STUB_REMOVED: "logistics_ai_decisions"")
      .insert({
        trip_id: trip.id,
        truck_id: trip.truck_id,
        recommendation: reroute.best_route.route_id,
        score: reroute.best_route.score,
        created_at: new Date().toISOString(),
      });
  }

  return decisions;
}
