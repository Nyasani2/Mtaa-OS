import "../apps/register-core-apps";

import {
  kernelMonitor
} from "../monitoring/kernel-monitor";

import {
  kernelTelemetry
} from "../telemetry/kernel-telemetry";

class KernelBootstrap {

  boot() {

    const health =
      kernelMonitor.health();

    kernelTelemetry.track(
      "KERNEL_BOOT",
      health
    );

    console.log(
      "[MTAA KERNEL ONLINE]"
    );

    return {
      state: "ONLINE",
      health
    };
  }
}

export const kernelBootstrap =
  new KernelBootstrap();
