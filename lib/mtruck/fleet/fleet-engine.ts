import { supabase } from "../../supabase";

export interface Truck {
  id: string;
  plate_number: string;
  capacity_kg: number;
  status: "ACTIVE" | "IDLE" | "MAINTENANCE" | "OFFLINE";
  fuel_level?: number;
  current_lat?: number;
  current_lng?: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  rating: number;
  status: "AVAILABLE" | "ON_TRIP" | "OFFLINE";
  assigned_truck_id?: string;
}

export async function getFleetOverview() {
  const [{ data: trucks }, { data: drivers }] = await Promise.all([
    supabase.from("mtruck_trucks").select("*"),
    supabase.from("mtruck_drivers").select("*"),
  ]);

  return {
    trucks: trucks || [],
    drivers: drivers || [],
    total_trucks: trucks?.length || 0,
    active_drivers: drivers?.filter((d: any) => d.status === "AVAILABLE").length || 0,
  };
}

export async function assignDriverToTruck(driver_id: string, truck_id: string) {
  const { error } = await supabase
    .from("mtruck_drivers")
    .update({ assigned_truck_id: truck_id })
    .eq("id", driver_id);

  if (error) throw error;

  await supabase
    .from("mtruck_trucks")
    .update({ status: "ACTIVE" })
    .eq("id", truck_id);

  return { status: "assigned" };
}
