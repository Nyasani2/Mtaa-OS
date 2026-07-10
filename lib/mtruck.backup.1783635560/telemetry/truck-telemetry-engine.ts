import { supabase } from "../../supabase";

export interface TruckTelemetry {
  truck_id: string;

  speed_kph: number;

  engine_temp: number;

  fuel_level: number;

  engine_health: number;

  battery_voltage: number;

  gps_lat: number;

  gps_lng: number;
}

export async function ingestTelemetry(
  telemetry: TruckTelemetry
) {

  const { error } = await supabase
    .from("mtruck_telemetry")
    .insert({
      truck_id: telemetry.truck_id,
      speed_kph: telemetry.speed_kph,
      engine_temp: telemetry.engine_temp,
      fuel_level: telemetry.fuel_level,
      engine_health:
        telemetry.engine_health,
      battery_voltage:
        telemetry.battery_voltage,
      gps_lat: telemetry.gps_lat,
      gps_lng: telemetry.gps_lng,
    });

  if (error) throw error;

  await supabase
    .from("mtruck_fleet")
    .update({
      speed_kph:
        telemetry.speed_kph,

      fuel_level:
        telemetry.fuel_level,

      engine_health:
        telemetry.engine_health,

      last_lat:
        telemetry.gps_lat,

      last_lng:
        telemetry.gps_lng,
    })
    .eq("id", telemetry.truck_id);

  return true;
}
