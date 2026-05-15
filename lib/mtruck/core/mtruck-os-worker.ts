import { runMTruckOSBrain } from "./mtruck-os-brain";

export function startMTruckOS(intervalMs = 8000) {

  console.log("🚛 MTRUCK OS LIVE BRAIN STARTED");

  setInterval(async () => {
    try {

      const result = await runMTruckOSBrain();

      console.log("🧠 OS TICK:", {
        fleet: result.snapshot.active_trucks,
        assignments: result.matches.length,
        decision: result.control.decision
      });

    } catch (e) {
      console.error("MTRUCK OS ERROR:", e);
    }

  }, intervalMs);
}
