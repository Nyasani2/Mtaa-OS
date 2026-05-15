import { dispatchCargo } from "./dispatch/freight-dispatch-engine";
import { calculateFreightPrice } from "./pricing/freight-pricing-engine";
import { getFleetState } from "./intelligence/fleet-brain";

/**
 * MTRUCK CORE CONTROLLER
 */

export async function MTruckApp() {
  const fleet = await getFleetState();

  return {
    fleet,
    dispatch: dispatchCargo,
    pricing: calculateFreightPrice,
  };
}
