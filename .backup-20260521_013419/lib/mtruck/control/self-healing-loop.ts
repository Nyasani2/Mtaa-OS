import { computeImbalance, generateRebalanceSignals } from "./supply-demand-balancer";
import { getFleetMapSnapshot } from "./fleet-map-engine";

export async function runSelfHealingLoop() {
  const state = await computeImbalance();
  const signals = await generateRebalanceSignals();
  const map = await getFleetMapSnapshot();

  console.log("🧠 MTRUCK CONTROL TOWER");
  console.log("STATE:", state);
  console.log("SIGNALS:", signals);
  console.log("FLEET:", map.trucks.length);

  return {
    state,
    signals,
    fleet_size: map.trucks.length
  };
}
