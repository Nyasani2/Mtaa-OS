import { supabase } from "../../supabase";

export async function getFleetAnalytics() {
  const { data: trips } = await supabase
    .from("freight_trips")
    .select("*");

  const { data: trucks } = await supabase
    .from("mtruck_trucks")
    .select("*");

  const utilization =
    trucks?.length && trips?.length
      ? trips.length / trucks.length
      : 0;

  const completed = (trips || []).filter(t => t.status === "COMPLETED").length;

  const cancelled = (trips || []).filter(t => t.status === "CANCELLED").length;

  return {
    total_trucks: trucks?.length || 0,
    total_trips: trips?.length || 0,
    completed_trips: completed,
    cancelled_trips: cancelled,
    utilization_ratio: utilization,
  };
}
