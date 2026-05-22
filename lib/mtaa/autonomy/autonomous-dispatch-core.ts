// lib/mtaa/autonomy/autonomous-dispatch-core.ts
export interface DispatchState {
  active: boolean;
  queue: string[];
  lastRun?: string;
}

export function createDispatchState(base: Partial<DispatchState> = {}): DispatchState {
  return {
    active: base.active ?? false,
    queue: base.queue ?? [],
    lastRun: base.lastRun,
  };
}

export function mergeDispatchState(current: DispatchState, updates: Partial<DispatchState>): DispatchState {
  return {
    ...current,
    ...updates,
    queue: updates.queue ?? current.queue,
  };
}
