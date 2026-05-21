import { runMTruckDispatchBrain, rebalanceIdleFleet } from "../dispatch/mtruck-dispatch-brain";

/**
 * MTRUCK OS AUTONOMOUS DISPATCH WORKER
 * Runs continuous freight orchestration
 */

let running = false;

export function startMTruckDispatchWorker(intervalMs = 5000) {
  if (running) return;
  running = true;

  console.log("🚛 MTRUCK DISPATCH WORKER ONLINE");

  setInterval(async () => {
    try {
      // 1. Run dispatch allocation
      const result = await runMTruckDispatchBrain();

      console.log("📦 Dispatch cycle:", result.dispatched);

      // 2. Rebalance idle fleet (map intelligence layer)
      await rebalanceIdleFleet();

      console.log("🧭 Fleet rebalance complete");
    } catch (err) {
      console.error("❌ Dispatch worker error:", err);
    }
  }, intervalMs);
}
