import { computeSurgePricing } from "../pricing/mtruck-surge-engine";
import { runDispatchMatching } from "../dispatch/mtruck-dispatch-brain";
import { runPredictiveBrain } from "../ai/mtruck-predictive-brain";
import { buildSurgeHeatmap } from "../heatmap/mtruck-heatmap-engine";

export async function runMTruckEconomyLoop() {

  const surge = await computeSurgePricing();
  const dispatch = await runDispatchMatching();
  const ai = await runPredictiveBrain();
  const heatmap = await buildSurgeHeatmap();

  return {
    surge,
    dispatch_count: dispatch.length,
    ai,
    heatmap,
    status: "ECONOMY_LOOP_ACTIVE"
  };
}
