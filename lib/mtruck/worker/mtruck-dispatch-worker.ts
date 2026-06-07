import { runMTruckDispatchBrain, rebalanceIdleFleet } from "../dispatch/mtruck-dispatch-brain";

/**
 * MTRUCK OS AUTONOMOUS DISPATCH WORKER
 * Runs continuous freight orchestration
 */

let running = false;

export function startMTruckDispatchWorker(intervalMs = 5000) {
  if (running) return;
  running = true;

    // MTruck dispatch event logged via kernel observability

  setInterval(async () => {
    try {
      // 1. Run dispatch allocation
      const result = await runMTruckDispatchBrain();

    // MTruck dispatch event logged via kernel observability

      // 2. Rebalance idle fleet (map intelligence layer)
      await rebalanceIdleFleet();

    // MTruck dispatch event logged via kernel observability
    } catch (err) {
      console.error("❌ Dispatch worker error:", err);
    }
  }, intervalMs);
}

