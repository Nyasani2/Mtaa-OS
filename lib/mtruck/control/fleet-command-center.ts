import { supabase } from "../../supabase";

export interface FleetCommand {
  id?: string;
  truck_id: string;

  command_type:
    | "REROUTE"
    | "STOP"
    | "SLOW_DOWN"
    | "PRIORITY_DELIVERY"
    | "RETURN_TO_DEPOT";

  payload: any;

  issued_by: string;

  created_at?: string;
}

export async function issueFleetCommand(
  command: FleetCommand
) {
  const { data, error } = await supabase
    .from("mtruck_fleet_commands")
    .insert({
      truck_id: command.truck_id,
      command_type: command.command_type,
      payload: command.payload,
      issued_by: command.issued_by,
    })
    .select()
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function getTruckCommands(
  truckId: string
) {
  const { data, error } = await supabase
    .from("mtruck_fleet_commands")
    .select("*")
    .eq("truck_id", truckId)
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data || [];
}

export async function acknowledgeCommand(
  commandId: string
) {
  const { error } = await supabase
    .from("mtruck_fleet_commands")
    .update({
      acknowledged: true,
      acknowledged_at:
        new Date().toISOString(),
    })
    .eq("id", commandId);

  if (error) throw error;

  return true;
}
