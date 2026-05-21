import { runMTruckOSBrain } from "./mtruck-os-brain";
import { safeArray, safeObject } from "@/lib/kernel/safe-types";

export function startMTruckOS(intervalMs = 8000) {
  console.log("🚛 MTRUCK OS LIVE BRAIN STARTED");

  setInterval(async () => {
    try {
      const result = await runMTruckOSBrain();

      const safeResult = safeObject(result, {
        snapshot: {
          active_trucks: 0,
        },
        matches: [],
        control: {
          decision: "noop",
        },
      });

      const matches = safeArray<any>(safeResult.matches);

      console.log("🧠 OS TICK:", {
        fleet: safeResult.snapshot?.active_trucks ?? 0,
        assignments: matches.length,
        decision: safeResult.control?.decision ?? "noop",
      });

    } catch (e) {
      console.error("MTRUCK OS ERROR:", e);
    }
  }, intervalMs);
}
