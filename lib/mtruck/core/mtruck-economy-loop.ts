// lib/mtruck/core/mtruck-economy-loop.ts
export interface EconomyLoopState {
  dispatched: number;
  matched: any[];
  matches: any[];
  control: { decision: string };
  payload: any;
}

export function runEconomyLoop(payload: any): EconomyLoopState {
  const state: EconomyLoopState = {
    dispatched: 0,
    matched: [],
    matches: [],
    control: { decision: "hold" },
    payload,
  };

  // Economy logic here
  if (payload?.trucks && Array.isArray(payload.trucks)) {
    state.dispatched = payload.trucks.length;
    state.matched = payload.trucks.filter((t: any) => t.available);
    state.matches = state.matched;
    state.control.decision = state.matched.length > 0 ? "dispatch" : "hold";
  }

  return state;
}
