import { supabase } from "../../supabase";

export interface SurgeZone {
  zone_id: string;
  demand: number;
  supply: number;
  surge_multiplier: number;
}

export async function computeSurgePricing() {

  const { data: gps } = await supabase
    .from("mtruck_gps_stream")
    .select("*");

  const { data: shipments } = await supabase
    .from("mtruck_shipments")
    .select("*")
    .eq("status", "PENDING");

  const demand = shipments?.length || 0;
  const supply = gps?.length || 1;

  const ratio = demand / supply;

  let multiplier = 1;

  if (ratio > 2.5) multiplier = 2.2;
  else if (ratio > 1.5) multiplier = 1.6;
  else if (ratio > 1) multiplier = 1.2;

  await supabase
    .from("mtruck_pricing_state")
    .insert({
      demand,
      supply,
      surge_multiplier: multiplier,
      created_at: new Date().toISOString(),
    });

  return {
    demand,
    supply,
    surge_multiplier: multiplier,
  };
}
