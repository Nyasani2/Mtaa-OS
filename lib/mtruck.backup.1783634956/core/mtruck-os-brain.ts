import { runDispatchMatching } from "../dispatch/mtruck-dispatch-brain";
import { saveFleetSnapshot } from "../intelligence/fleet-intelligence-brain";
import { runPredictiveBrain } from "../ai/mtruck-predictive-brain";
import { runControlTower } from "./mtruck-control-tower";
import { emitEvent, createEvent } from "./mtruck-event-bus";

export async function runMTruckOSBrain() {

  // 1. Fleet snapshot
  const snapshot = await saveFleetSnapshot();

  emitEvent(
    createEvent("SYSTEM_TICK", snapshot)
  );

  // 2. Dispatch optimization
  const matches = await runDispatchMatching();

  emitEvent(
    createEvent("TRUCK_ASSIGNED", matches)
  );

  // 3. AI prediction layer
  const prediction = await runPredictiveBrain();

  emitEvent(
    createEvent("TRAFFIC_SPIKE", prediction)
  );

  // 4. Control tower decision
  const control = await runControlTower();

  return {
    snapshot,
    matches,
    prediction,
    control,
    status: "MTRUCK_OS_RUNNING"
  };
}
