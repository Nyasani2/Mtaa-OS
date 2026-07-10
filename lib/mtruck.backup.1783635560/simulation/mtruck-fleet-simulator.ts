export function simulateFleetBehavior(fleetSize: number) {

  const simulated = [];

  for (let i = 0; i < fleetSize; i++) {

    simulated.push({
      truck_id: "SIM_" + i,
      lat: -1.29 + Math.random() * 0.1,
      lng: 36.82 + Math.random() * 0.1,
      speed: Math.random() * 80,
      status:
        Math.random() > 0.5
          ? "ACTIVE"
          : "IDLE",
    });
  }

  return {
    fleet_size: fleetSize,
    simulated,
  };
}
