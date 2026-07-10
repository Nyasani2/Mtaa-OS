import { getPendingFreightQueue } from "../dispatch/dispatch-queue-engine";
import { matchFreightRequest } from "../dispatch/freight-dispatch-brain";
import { runSelfHealingLoop } from "../control/self-healing-loop";

export async function runAutonomousDispatcher() {
  const queue = await getPendingFreightQueue();

  const results = [];

  for (const request of queue) {
    const match = await matchFreightRequest(request);

    if (match.matched) {
      results.push({
        request_id: request.id,
        truck_id: match.truck_id,
        eta: match.eta_minutes
      });
    }
  }

  const systemState = await runSelfHealingLoop();

  return {
    dispatched: results.length,
    assignments: results,
    system: systemState
  };
}
