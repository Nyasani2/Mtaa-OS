// lib/mtaa/mtaa-os-bootstrap.ts
import { startMTruckOS } from "../mtruck/core/mtruck-os-worker";

export function bootMTAAOS() {
  console.log("🚀 MTAA OS BOOTING...");

  const stopMTruck = startMTruckOS(5000);

  console.log("✅ MTAA OS ONLINE");

  return () => {
    stopMTruck();
    console.log("🛑 MTAA OS shutdown complete");
  };
}
