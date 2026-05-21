/**
 * MTAA OS Kernel Bootloader
 */

import { eventBus } from "./event-bus";

let booted = false;

export function bootKernel() {
  if (booted) return;

  console.log("🧠 MTAA Kernel Booting...");

  eventBus.emit({
    type: "kernel.boot",
    domain: "kernel",
    timestamp: Date.now(),
    data: {
      status: "online",
    },
  });

  console.log("✅ MTAA Kernel Online");

  booted = true;
}
