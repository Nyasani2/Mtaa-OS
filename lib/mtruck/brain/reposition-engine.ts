import { supabase } from "../../supabase";
import { forecastZoneDemand } from "./demand-forecast-engine";

/**
 * Sends proactive reposition signals to drivers
 */
export async function generateRepositionSignals() {

  const zones = await forecastZoneDemand();

  const highDemandZones = zones
    .filter(z => z.demand_score > 1.5);

  for (const zone of highDemandZones) {

    const { data: drivers } = await supabase
      .from("freight_driver_locations")
      .select("*")
      .eq("available", true)
      .limit(10);

    for (const driver of drivers || []) {

      await supabase.from("mtruck_locations").insert({
        driver_id: driver.driver_id,
        target_lat: zone.lat,
        target_lng: zone.lng,
        reason: "HIGH_DEMAND_FORECAST",
        urgency: zone.demand_score > 2 ? "CRITICAL" : "HIGH",
        created_at: new Date().toISOString(),
      });
    }
  }

  return { status: "REPOSITION_SIGNALS_SENT" };
}
