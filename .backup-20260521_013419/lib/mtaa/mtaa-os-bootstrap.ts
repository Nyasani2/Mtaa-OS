import { startMTruckLiveOS } from "../mtruck/core/mtruck-live-os-loop";
import { startMTruckOS } from "../mtruck/core/mtruck-os-worker";

export function bootMTAAOS() {

  console.log("🚀 MTAA OS BOOTING...");

  // core mobility brain
  startMTruckOS(5000);

  // live system loop
  startMTruckLiveOS();

  console.log("✅ MTAA OS ONLINE");
}
