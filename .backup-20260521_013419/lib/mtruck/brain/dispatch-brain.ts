import { generateRepositionSignals } from "./reposition-engine";
import { computeFleetBalance } from "./fleet-balancer";

/**
 * MTRUCK DISPATCH BRAIN v2
 * Runs full fleet intelligence loop
 */
export async function runDispatchBrain() {

  const balance = await computeFleetBalance();

  await generateRepositionSignals();

  return {
    status: "BRAIN_CYCLE_COMPLETE",
    fleet_balance: balance,
  };
}
