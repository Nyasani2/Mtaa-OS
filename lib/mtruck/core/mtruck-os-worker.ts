// lib/mtruck/core/mtruck-os-worker.ts
export interface MTruckResult {
  [key: string]: unknown;
  snapshot: {
    active_trucks: number;
    pending_jobs: number;
    completed_jobs: number;
  };
  control: {
    decision: string;
    priority: string;
  };
}

export function processMTruckWorker(result: unknown): {
  fleet: number;
  pending: number;
  completed: number;
  decision: string;
} {
  const r = result as MTruckResult;
  const snapshot = (r.snapshot as { active_trucks?: number; pending_jobs?: number; completed_jobs?: number }) || {};
  const control = (r.control as { decision?: string; priority?: string }) || {};

  return {
    fleet: snapshot.active_trucks ?? 0,
    pending: snapshot.pending_jobs ?? 0,
    completed: snapshot.completed_jobs ?? 0,
    decision: control.decision ?? 'noop',
  };
}

export function startMTruckOS(intervalMs: number = 5000): () => void {
    // MTruck worker event logged via kernel observability
  const timer = setInterval(() => {
    // MTruck worker event logged via kernel observability
  }, intervalMs);
  return () => clearInterval(timer);
}

