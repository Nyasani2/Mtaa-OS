import {
  kernelOrchestrator
} from "../orchestrator/kernel-orchestrator";

class KernelRuntimeLoop {

  start() {

    setInterval(() => {

      kernelOrchestrator.tick({
        heartbeat: true,
        timestamp: Date.now()
      });

    }, 5000);
  }
}

export const kernelRuntimeLoop =
  new KernelRuntimeLoop();
