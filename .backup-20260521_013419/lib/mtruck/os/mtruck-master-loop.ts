import { runAutonomousDispatcher } from "./autonomous-dispatcher";
import { computeRepositionPlan } from "./fleet-reposition-engine";
import { predictDemandWindow } from "./predictive-demand-engine";

export function startMTruckOSMasterLoop(intervalMs = 5000) {
  setInterval(async () => {
    try {
      const dispatch = await runAutonomousDispatcher();
      const reposition = await computeRepositionPlan();
      const demand = await predictDemandWindow();

      console.log("🚛 MTRUCK OS LIVE");
      console.log("DISPATCH:", dispatch.dispatched);
      console.log("REPOSITION PLAN:", reposition.length);
      console.log("DEMAND ZONES:", demand.length);

    } catch (err) {
      console.error("MTRUCK OS ERROR:", err);
    }
  }, intervalMs);
}
