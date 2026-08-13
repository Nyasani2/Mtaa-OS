import { supabase } from "../../supabase";
import { buildDemandGrid } from "../maps/mtruck-grid-intelligence";

export interface ForecastCell {
  cell_id: string;
  predicted_demand: number;
  confidence: number;
  surge_probability: number;
}

/**
 * TIME WEIGHTS (real-world logistics behavior)
 */
function getTimeWeight(hour: number) {
  if (hour >= 7 && hour <= 10) return 1.8;   // morning logistics rush
  if (hour >= 17 && hour <= 21) return 2.3;  // evening freight surge
  if (hour >= 0 && hour <= 5) return 0.5;    // low movement
  return 1;
}

/**
 * SIMPLE PREDICTION MODEL (v1)
 * Based on:
 * - historical demand
 * - current grid imbalance
 * - time pressure
 */
export async function forecastDemand() {
  const now = new Date();
  const hour = now.getHours();

  const timeWeight = getTimeWeight(hour);

  const grid = await buildDemandGrid();

  const { data: history } = await supabase
    .from("freight_orders")
    .select("pickup_lat, pickup_lng, created_at");

  const forecast: ForecastCell[] = [];

  for (const cell of grid) {
    const historicalFactor =
      (history || []).filter((h: any) => {
        const latMatch = Math.abs(h.pickup_lat - cell.lat) < 0.01;
        const lngMatch = Math.abs(h.pickup_lng - cell.lng) < 0.01;
        return latMatch && lngMatch;
      }).length;

    const predicted = (cell.demand_score + historicalFactor) * timeWeight;

    const surge_probability =
      cell.imbalance > 3 ? 0.85 :
      cell.imbalance > 1 ? 0.6 :
      0.3;

    forecast.push({
      cell_id: cell.cell_id,
      predicted_demand: predicted,
      confidence: Math.min(0.95, 0.5 + historicalFactor * 0.05),
      surge_probability
    });
  }

  return forecast.sort((a, b) => b.predicted_demand - a.predicted_demand);
}
