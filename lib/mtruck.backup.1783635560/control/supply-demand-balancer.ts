import { supabase } from "../../supabase";

export async function computeImbalance() {
  const { data: trucks } = await supabase.from("truck_locations").select("*");
  const { data: requests } = await supabase.from("freight_requests").select("*");

  const demand = requests?.length || 0;
  const supply = trucks?.length || 1;

  const ratio = demand / supply;

  let state = "BALANCED";

  if (ratio > 2) state = "CRITICAL_DEMAND";
  else if (ratio > 1.2) state = "HIGH_DEMAND";
  else if (ratio < 0.5) state = "OVERSUPPLY";

  return {
    demand,
    supply,
    ratio,
    state
  };
}

export async function generateRebalanceSignals() {
  const state = await computeImbalance();

  if (state.state === "OVERSUPPLY") {
    return {
      action: "REPOSITION_TRUCKS",
      message: "Move trucks to high-demand zones"
    };
  }

  if (state.state === "HIGH_DEMAND") {
    return {
      action: "INCREASE_SURGE",
      message: "Increase pricing + activate standby drivers"
    };
  }

  return {
    action: "NO_ACTION",
    message: "System stable"
  };
}
