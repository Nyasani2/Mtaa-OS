// lib/mtaa/autonomy/global-autonomous-orchestrator.ts
import { createDispatchState, mergeDispatchState, DispatchState } from "./autonomous-dispatch-core";

export interface OrchestratorConfig {
  intervalMs: number;
  maxRetries: number;
  enabledModules: string[];
}

export function runAutonomousDispatchCycle(
  state: DispatchState,
  config: OrchestratorConfig
): DispatchState {
  // Run one cycle of autonomous dispatch
  const updated = mergeDispatchState(state, {
    active: true,
    lastRun: new Date().toISOString(),
  });

  // Process queue
  if (updated.queue.length > 0) {
    const processed = updated.queue.slice(0, config.maxRetries);
    updated.queue = updated.queue.slice(config.maxRetries);
  }

  return updated;
}

export function initializeOrchestrator(config?: Partial<OrchestratorConfig>): OrchestratorConfig {
  return {
    intervalMs: config?.intervalMs ?? 5000,
    maxRetries: config?.maxRetries ?? 3,
    enabledModules: config?.enabledModules ?? [],
  };
}

export function startAutonomousLoop(config: OrchestratorConfig, onTick: (state: DispatchState) => void) {
  let state = createDispatchState({ active: true });

  const interval = setInterval(() => {
    state = runAutonomousDispatchCycle(state, config);
    onTick(state);
  }, config.intervalMs);

  return {
    stop: () => clearInterval(interval),
    getState: () => state,
  };
}
