// lib/mtruck/os/mtruck-master-loop.ts
import { computeRepositionPlan, Truck, DemandZone } from "./fleet-reposition-engine";

export interface MasterLoopState {
  trucks: Truck[];
  demandZones: DemandZone[];
  repositionPlans: any[];
  lastUpdated: string;
}

export function initializeMasterLoop(trucks: Truck[] = [], demandZones: DemandZone[] = []): MasterLoopState {
  return {
    trucks,
    demandZones,
    repositionPlans: computeRepositionPlan(trucks, demandZones),
    lastUpdated: new Date().toISOString(),
  };
}

export function runMasterLoop(state: MasterLoopState): MasterLoopState {
  const plans = computeRepositionPlan(state.trucks, state.demandZones);
  return {
    ...state,
    repositionPlans: plans,
    lastUpdated: new Date().toISOString(),
  };
}

// Default export for backward compatibility
export default function mtruckMasterLoop(trucks?: Truck[], demandZones?: DemandZone[]) {
  return initializeMasterLoop(trucks, demandZones);
}
