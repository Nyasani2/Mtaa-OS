import { supabase } from "../../supabase";

export async function logFuel(truck_id: string, liters: number, cost: number) {
  const { error } = await supabase.from("fuel_logs").insert({
    truck_id,
    liters,
    cost,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;

  return { status: "logged" };
}

export async function getFuelStats(truck_id: string) {
  const { data } = await supabase
    .from("fuel_logs")
    .select("*")
    .eq("truck_id", truck_id);

  const totalLiters = (data || []).reduce((sum, f) => sum + f.liters, 0);
  const totalCost = (data || []).reduce((sum, f) => sum + f.cost, 0);

  return {
    truck_id,
    totalLiters,
    totalCost,
    avg_cost_per_liter: totalLiters ? totalCost / totalLiters : 0,
  };
}
