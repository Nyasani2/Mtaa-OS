import { matchFreightRequest } from "./freight-dispatch-brain";
import { getFleetState } from "../intelligence/fleet-state-engine";

export async function runMTruckDispatchLoop() {
  const fleet = await getFleetState();

  console.log("🚛 Fleet State:", fleet);

  // pull pending requests
  const pending = [
    // later replaced with DB queue
  ];

  for (const req of pending) {
    const result = await matchFreightRequest(req);
    console.log("DISPATCH RESULT:", result);
  }

  return fleet;
}
