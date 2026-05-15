import { supabase } from "../../supabase";

export interface FreightPricingInput {
  distance_km: number;
  weight_kg: number;
  cargo_type: "SMALL" | "MEDIUM" | "HEAVY" | "CONTAINER";
  surge_multiplier: number;
}

export interface FreightPricingBreakdown {
  base_fare: number;
  distance_cost: number;
  weight_cost: number;
  surge_cost: number;

  subtotal: number;
  system_fee: number;
  tax: number;

  driver_payout: number;
  total: number;
}

export function calculateFreightPrice(
  input: FreightPricingInput
): FreightPricingBreakdown {

  const BASE_FARE = 5;
  const PRICE_PER_KM = 1.2;
  const PRICE_PER_KG = 0.01;

  const base_fare = BASE_FARE;
  const distance_cost = input.distance_km * PRICE_PER_KM;
  const weight_cost = input.weight_kg * PRICE_PER_KG;

  const raw_subtotal = base_fare + distance_cost + weight_cost;
  const surge_cost = raw_subtotal * (input.surge_multiplier - 1);

  const subtotal = raw_subtotal + surge_cost;

  // 10% split (system + tax)
  const system_fee = subtotal * 0.07;
  const tax = subtotal * 0.03;

  const driver_payout = subtotal - (system_fee + tax);

  return {
    base_fare,
    distance_cost,
    weight_cost,
    surge_cost,
    subtotal,
    system_fee,
    tax,
    driver_payout,
    total: subtotal,
  };
}
