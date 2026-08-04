import { supabase } from "../../supabase";

export interface GridCell {
  cell_id: string;
  lat: number;
  lng: number;
  demand_score: number;
  supply_score: number;
  imbalance: number;
}

/**
 * GRID SIZE = 0.01 degrees (~1km blocks in Nairobi)
 */
function toGrid(lat: number, lng: number) {
  const size = 0.01;
  return {
    lat: Math.floor(lat / size) * size,
    lng: Math.floor(lng / size) * size
  };
}

/**
 * BUILD DEMAND MAP FROM LIVE ORDERS
 */
export async function buildDemandGrid() {
  const { data: orders } = await supabase
    .from("freight_orders")
    .select("pickup_lat, pickup_lng");

  const { data: trucks } = await supabase
    .from("mtruck_trucks")
    .select("lat, lng");

  const grid: Record<string, GridCell> = {};

  // 🧠 Demand mapping
  for (const o of orders || []) {
    const cell = toGrid(o.pickup_lat, o.pickup_lng);
    const key = `${cell.lat},${cell.lng}`;

    if (!grid[key]) {
      grid[key] = {
        cell_id: key,
        lat: cell.lat,
        lng: cell.lng,
        demand_score: 0,
        supply_score: 0,
        imbalance: 0
      };
    }

    grid[key].demand_score += 1;
  }

  // 🚛 Supply mapping
  for (const t of trucks || []) {
    const cell = toGrid(t.lat, t.lng);
    const key = `${cell.lat},${cell.lng}`;

    if (!grid[key]) {
      grid[key] = {
        cell_id: key,
        lat: cell.lat,
        lng: cell.lng,
        demand_score: 0,
        supply_score: 0,
        imbalance: 0
      };
    }

    grid[key].supply_score += 1;
  }

  // ⚖️ imbalance calculation
  Object.values(grid).forEach(cell => {
    cell.imbalance = cell.demand_score - cell.supply_score;
  });

  return Object.values(grid);
}

/**
 * HOTSPOT DETECTOR (critical zones)
 */
export async function getHotspots() {
  const grid = await buildDemandGrid();

  return grid
    .filter(c => c.imbalance > 2)
    .sort((a, b) => b.imbalance - a.imbalance)
    .slice(0, 10);
}
