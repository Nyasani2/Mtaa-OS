import { runPredictiveBrain } from "../ai/mtruck-predictive-brain";
import { computeSystemState } from "../core/mtruck-core-brain";

export async function runControlTower() {

  const system = await computeSystemState();
  const prediction = await runPredictiveBrain();

  const decision =
    system.congestion_index > 0.6
      ? "REDISTRIBUTE_FLEET"
      : "NORMAL_FLOW";

  return {
    system_state: system,
    prediction,
    decision,
    timestamp: new Date().toISOString(),
  };
}
