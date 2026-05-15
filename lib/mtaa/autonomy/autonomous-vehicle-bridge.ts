export interface AutonomousVehicle {
  id: string;
  type: "TRUCK" | "DRONE" | "ROBOT";
  status: "IDLE" | "ACTIVE" | "CHARGING";
  battery_level: number;
  lat: number;
  lng: number;
}

export function assignAutonomousRoute(
  vehicle: AutonomousVehicle,
  route: any
) {

  return {
    vehicle_id: vehicle.id,
    route,
    mode: "AUTONOMOUS_EXECUTION",
    estimated_completion:
      Date.now() + Math.random() * 1000000,
  };
}
