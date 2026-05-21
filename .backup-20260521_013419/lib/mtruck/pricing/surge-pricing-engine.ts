import { supabase } from "../../supabase";

/**
 * SURGE PRICING MODEL
 * Based on:
 * - demand vs supply
 * - zone congestion
 * - time pressure
 */

export interface PricingContext {
  zone_id: string;
  active_orders: number;
  available_trucks: number;
  base_fare: number;
  distance_km: number;
  urgency_avg: number;
}

/**
 * Core surge multiplier engine
 */
function calculateSurge(demand: number, supply: number) {
  if (supply === 0) return 3.0; // hard surge cap

  const ratio = demand / supply;

  if (ratio < 0.8) return 1.0;
  if (ratio < 1.2) return 1.2;
  if (ratio < 1.8) return 1.5;
  if (ratio < 2.5) return 2.0;

  return 3.0;
}

/**
 * FINAL PRICE ENGINE
 */
export async function calculateFreightPrice(ctx: PricingContext) {
  const surge = calculateSurge(ctx.active_orders, ctx.available_trucks);

  const distanceFactor = ctx.distance_km * 1.25; // fuel + wear
  const urgencyFactor = 1 + ctx.urgency_avg * 0.15;

  const subtotal = ctx.base_fare * distanceFactor;

  const surgePrice = subtotal * surge * urgencyFactor;

  return {
    base_fare: ctx.base_fare,
    distance_cost: distanceFactor,
    surge_multiplier: surge,
    urgency_multiplier: urgencyFactor,
    subtotal: Number(subtotal.toFixed(2)),
    total: Number(surgePrice.toFixed(2))
  };
}

/**
 * ZONE INTELLIGENCE FEED (used by dispatch brain)
 */
export async function getZoneMarketState(zone_id: string) {
  const [{ data: orders }, { data: trucks }] = await Promise.all([
    supabase.from("freight_orders").select("*").eq("zone_id", zone_id),
    supabase.from("trucks").select("*").eq("zone_id", zone_id)
  ]);

  return {
    zone_id,
    active_orders: orders?.length || 0,
    available_trucks: trucks?.filter(t => t.status === "IDLE").length || 0
  };
}
