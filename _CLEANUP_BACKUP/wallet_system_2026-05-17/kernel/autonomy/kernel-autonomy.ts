import {
  kernelMonitor
} from "../monitoring/kernel-monitor";

import {
  kernelPredictiveScaling
} from "../predictive-scaling/kernel-predictive-scaling";

import {
  kernelSelfHealing
} from "../self-healing/kernel-self-healing";

class KernelAutonomy {

  cycle() {

    const health =
      kernelMonitor.health();

    const scaling =
      kernelPredictiveScaling.forecast(80);

    if (scaling === "PRE_SCALE") {

      kernelSelfHealing.repair(
        "REALTIME_CLUSTER"
      );
    }

    return {
      state: "AUTONOMOUS",
      scaling,
      health
    };
  }
}

export const kernelAutonomy =
  new KernelAutonomy();
