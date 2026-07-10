export type FleetVehicle = {
  id: string;
  driverName: string;
  latitude: number;
  longitude: number;
  status: 'idle' | 'moving' | 'offline';
};

class LiveFleetMapEngine {
  private vehicles: FleetVehicle[] = [];

  getVehicles() {
    return this.vehicles;
  }

  updateVehicle(vehicle: FleetVehicle) {
    const existingIndex = this.vehicles.findIndex(
      (v) => v.id === vehicle.id
    );

    if (existingIndex >= 0) {
      this.vehicles[existingIndex] = vehicle;
    } else {
      this.vehicles.push(vehicle);
    }
  }

  removeVehicle(vehicleId: string) {
    this.vehicles = this.vehicles.filter(
      (v) => v.id !== vehicleId
    );
  }

  clear() {
    this.vehicles = [];
  }
}

export const liveFleetMapEngine =
  new LiveFleetMapEngine();
