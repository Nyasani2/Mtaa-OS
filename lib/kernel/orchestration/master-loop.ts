import {
  kernelMonitor
} from "../monitoring/kernel-monitor";

import {
  kernelScaling
} from "../scaling/kernel-scaling";

import {
  kernelWatchdog
} from "../watchdog/kernel-watchdog";

class KernelMasterLoop {

  tick() {

    const health =
      kernelMonitor.health();

    const scaling =
      kernelScaling.evaluate({
        cpu: 50
      });

    kernelWatchdog.monitor(
      "MTAA_CORE"
    );

    return {
      health,
      scaling,
      timestamp: Date.now()
    };
  }
}

export const kernelMasterLoop =
  new KernelMasterLoop();
