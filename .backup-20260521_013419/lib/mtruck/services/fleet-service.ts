import { supabase } from "@/lib/supabase";
import type { Truck, Load, Driver, FleetAlert, FleetMetrics } from "@/lib/mtruck/types";

export async function getFleetStatus(): Promise<{
  trucks: Truck[];
  activeTrucks: number;
  onRoad: number;
  pendingLoads: number;
  revenueToday: number;
}> {
  const { data, error } = await supabase.from("mtruck_trucks").select("*").eq("status", "active");
  if (error) throw error;
  const trucks = data || [];
  return { trucks, activeTrucks: trucks.length, onRoad: trucks.filter((t: Truck) => t.status === "active").length, pendingLoads: 0, revenueToday: 0 };
}

export async function getTrucks(): Promise<Truck[]> {
  const { data, error } = await supabase.from("mtruck_trucks").select("*");
  if (error) throw error;
  return data || [];
}

export async function getDrivers(): Promise<Driver[]> {
  const { data, error } = await supabase.from("mtruck_drivers").select("*");
  if (error) throw error;
  return data || [];
}

export async function getLoads(): Promise<Load[]> {
  const { data, error } = await supabase.from("mtruck_loads").select("*");
  if (error) throw error;
  return data || [];
}

export async function getAlerts(): Promise<FleetAlert[]> {
  const { data, error } = await supabase.from("mtruck_alerts").select("*").eq("resolved", false).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getMetrics(): Promise<FleetMetrics> {
  return { totalDistance: 12450, fuelEfficiency: 8.2, onTimeRate: 94, costPerMile: 1.85, revenuePerTruck: 2450, utilizationRate: 78 };
}
