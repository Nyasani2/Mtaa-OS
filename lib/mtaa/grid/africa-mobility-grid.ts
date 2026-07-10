import { supabase } from "../../supabase";

export interface CrossBorderRoute {
  origin_country: string;
  destination_country: string;
  cargo_type: string;
  distance_km: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  border_delay_hours: number;
}

export async function computeCrossBorderRoute(route: CrossBorderRoute) {

  const base_cost_per_km = 1.2;

  const risk_multiplier =
    route.risk_level === "HIGH"
      ? 1.8
      : route.risk_level === "MEDIUM"
      ? 1.3
      : 1;

  const border_penalty =
    route.border_delay_hours * 15;

  const cost =
    route.distance_km *
    base_cost_per_km *
    risk_multiplier +
    border_penalty;

  await supabase
    .from("// STUB_REMOVED: "mtaa_cross_border_routes"")
    .insert({
      ...route,
      estimated_cost: cost,
      created_at: new Date().toISOString(),
    });

  return {
    route,
    estimated_cost: cost,
  };
}
