import { supabase } from "../../supabase";

export async function assignShipment(
  shipmentId: string,
  truckId: string
) {

  const { error } = await supabase
    .from("mtruck_shipments")
    .update({
      assigned_truck_id: truckId,
      status: "ASSIGNED",
    })
    .eq("id", shipmentId);

  if (error) throw error;

  await supabase
    .from("mtruck_fleet")
    .update({
      status: "BUSY",
    })
    .eq("id", truckId);

  return true;
}
