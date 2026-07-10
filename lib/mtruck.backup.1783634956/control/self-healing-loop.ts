import { computeImbalance, generateRebalanceSignals } from "./supply-demand-balancer";
import { getFleetMapSnapshot } from "./fleet-map-engine";

export async function runSelfHealingLoop() {
  const state = await computeImbalance();
  const signals = await generateRebalanceSignals();
  const map = await getFleetMapSnapshot();

    // MTruck control event logged via kernel observability
    // MTruck control event logged via kernel observability
    // MTruck control event logged via kernel observability
    // MTruck control event logged via kernel observability

  return {
    state,
    signals,
    fleet_size: map.trucks.length
  };
}

