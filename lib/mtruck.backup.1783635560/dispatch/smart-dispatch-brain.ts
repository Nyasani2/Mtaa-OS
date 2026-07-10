import { getPendingFreightQueue, markAssigned } from "./dispatch-queue-engine";
import { matchFreightRequest } from "./freight-dispatch-brain";

export async function runSmartDispatchCycle() {
  const queue = await getPendingFreightQueue();

  const results = [];

  for (const request of queue) {
    const result = await matchFreightRequest(request);

    if (result.matched) {
      await markAssigned(request.id, result.truck_id);

      results.push({
        request_id: request.id,
        truck_id: result.truck_id,
        eta: result.eta_minutes,
      });
    }
  }

  return {
    processed: queue.length,
    results,
  };
}
