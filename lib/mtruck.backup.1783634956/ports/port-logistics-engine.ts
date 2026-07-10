import { supabase } from "../../supabase";

export interface PortShipment {
  shipment_id: string;

  container_number: string;

  port_name: string;

  arrival_eta: string;

  customs_status:
    | "PENDING"
    | "CLEARED"
    | "HOLD";
}

export async function registerPortShipment(
  shipment: PortShipment
) {

  const { data, error } = await supabase
    .from("mtruck_port_shipments")
    .insert({
      shipment_id:
        shipment.shipment_id,

      container_number:
        shipment.container_number,

      port_name:
        shipment.port_name,

      arrival_eta:
        shipment.arrival_eta,

      customs_status:
        shipment.customs_status,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getPortShipments() {

  const { data, error } = await supabase
    .from("mtruck_port_shipments")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data || [];
}
