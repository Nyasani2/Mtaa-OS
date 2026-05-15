import { kernelEventBus } from "../event-bus/kernel-event-bus";
import {
  kernelTracer,
  kernelLogEngine,
  kernelAutonomyGate,
  kernelSystemBrain,
  kernelAutonomy,
  kernelMetrics
} from "../core/kernel-services";

class KernelOrchestrator {

  private route(input: any) {
    if (input?.type === "realtime") return "REALTIME_PIPE";
    if (input?.type === "wallet") return "WALLET_PIPE";
    if (input?.type === "civic") return "CIVIC_PIPE";
    return "DEFAULT_PIPE";
  }

  async tick(input: any) {

    const traceId = `trace_${Date.now()}`;

    kernelTracer.span("TICK_START", {
      traceId,
      input
    });

    kernelLogEngine.info("tick_start", { traceId });

    // SAFETY GATE
    const safetyCheck = kernelAutonomyGate.allow(
      input?.action || "unknown",
      input?.riskScore || 0.1
    );

    if (!safetyCheck.allowed) {
      return {
        traceId,
        status: "BLOCKED",
        reason: safetyCheck.reason
      };
    }

    // BRAIN
    const brain = kernelSystemBrain.think(input);

    // AUTONOMY
    const autonomy = kernelAutonomy.cycle();

    // ROUTING
    const route = this.route(input);

    // METRICS
    kernelMetrics.record("last_tick", Date.now());

    // LOG
    kernelLogEngine.info("tick_complete", {
      traceId,
      route
    });

    return {
      traceId,
      status: "OK",
      route,
      brain,
      autonomy,
      timestamp: Date.now()
    };
  }
}

export const kernelOrchestrator = new KernelOrchestrator();
