export async function runDispatchMatching(payload: any = {}) {
  return {
    dispatched: 0,
    matched: [],
    matches: [],
    control: {
      decision: 'balanced',
    },
    payload,
  };
}

export async function runMTruckDispatchBrain() {
  return runDispatchMatching();
}

export async function rebalanceIdleFleet() {
  return true;
}
