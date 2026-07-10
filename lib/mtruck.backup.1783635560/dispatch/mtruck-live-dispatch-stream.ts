import { supabase } from "../../supabase";
import { MTruckRealtimeHub } from "../realtime/mtruck-realtime-hub";

const hub = new MTruckRealtimeHub();

export async function liveDispatchCycle() {

  const { data: pending } = await supabase
    .from("mtruck_shipments")
    .select("*")
    .eq("status", "PENDING");

  const { data: idleTrucks } = await supabase
    .from("mtruck_fleet")
    .select("*")
    .eq("status", "IDLE");

  if (!pending?.length || !idleTrucks?.length) {
    return { matched: 0 };
  }

  const assignments = [];

  for (const shipment of pending) {

    const bestTruck = idleTrucks[0]; // simplified scoring core

    await supabase
      .from("mtruck_shipments")
      .update({
        status: "ASSIGNED",
        assigned_truck_id: bestTruck.id,
      })
      .eq("id", shipment.id);

    await supabase
      .from("mtruck_fleet")
      .update({
        status: "BUSY",
      })
      .eq("id", bestTruck.id);

    const event = hub.emit("dispatch:update", {
      shipment_id: shipment.id,
      truck_id: bestTruck.id,
    });

    assignments.push(event);
  }

  return {
    matched: assignments.length,
  };
}
