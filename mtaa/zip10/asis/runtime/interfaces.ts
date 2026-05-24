// ============================================================
// RUNTIME INTERFACES — Service contracts for execution runtime
// ============================================================

import {
  RuntimeConfig, ModuleRegistration, ExecutionRequest, ExecutionResult,
  ExecutionPlan, RuntimeEvent, ScheduledTask, FailureRecord, ThrottleState,
  RuntimeSnapshot, ExecutionHook, HookContext, ModuleState, BootPhase
} from './types';

export interface ISystemBootloader {
  boot(config: RuntimeConfig): Promise<void>;
  getCurrentPhase(): BootPhase;
  isReady(): boolean;
  shutdown(): Promise<void>;
  getBootLog(): string[];
}

export interface IRuntimeKernel {
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
  validate(request: ExecutionRequest): Promise<boolean>;
  dispatch(event: RuntimeEvent): Promise<void>;
  getSystemState(): Record<string, ModuleState>;
  transitionState(moduleId: string, state: ModuleState): void;
}

export interface IModuleRegistry {
  register(module: ModuleRegistration): void;
  unregister(moduleId: string): void;
  get(moduleId: string): ModuleRegistration | undefined;
  getAll(): ModuleRegistration[];
  getByDomain(domain: string): ModuleRegistration[];
  validateDependencies(): string[];
  checkHealth(moduleId: string): Promise<ModuleRegistration['health']>;
}

export interface ILifecycleManager {
  transition(moduleId: string, toState: ModuleState): Promise<void>;
  getState(moduleId: string): ModuleState;
  recover(moduleId: string): Promise<void>;
  shutdown(moduleId: string): Promise<void>;
  restart(moduleId: string): Promise<void>;
}

export interface IExecutionEngine {
  plan(request: ExecutionRequest): Promise<ExecutionPlan>;
  execute(plan: ExecutionPlan): Promise<ExecutionResult>;
  cancel(requestId: string): Promise<void>;
  rollback(requestId: string): Promise<void>;
}

export interface IEventRuntimeBus {
  emit(event: RuntimeEvent): Promise<void>;
  on(eventType: string, listener: (event: RuntimeEvent) => void): () => void;
  once(eventType: string, listener: (event: RuntimeEvent) => void): () => void;
  replay(correlationId: string): Promise<RuntimeEvent[]>;
  getQueueDepth(): number;
}

export interface ITaskScheduler {
  schedule(request: ExecutionRequest, delayMs: number): Promise<string>;
  scheduleRecurring(request: ExecutionRequest, cronExpression: string): Promise<string>;
  cancel(taskId: string): Promise<void>;
  processQueue(): Promise<void>;
  getQueue(): ScheduledTask[];
}

export interface IFailureRecovery {
  detect(moduleId: string, error: Error): Promise<FailureRecord>;
  recover(record: FailureRecord): Promise<boolean>;
  isolate(moduleId: string): Promise<void>;
  getCircuitState(moduleId: string): 'closed' | 'open' | 'half_open';
}

export interface IPerformanceThrottle {
  updateMetrics(metrics: { cpu: number; memory: number; active: number; queue: number; rate: number }): void;
  getThrottleLevel(): ThrottleLevel;
  shouldThrottle(): boolean;
  getAdaptiveConfig(): Partial<RuntimeConfig>;
}

export interface IRuntimeMonitor {
  snapshot(): RuntimeSnapshot;
  getMetrics(moduleId?: string): Record<string, number>;
  trackLatency(moduleId: string, durationMs: number): void;
  trackFailure(moduleId: string, error: string): void;
  getHealthReport(): string;
}

export interface IExecutionHooks {
  register(hook: ExecutionHook): void;
  unregister(hookId: string): void;
  executePre(context: HookContext): Promise<void>;
  executePost(context: HookContext): Promise<void>;
  executeFailure(context: HookContext): Promise<void>;
  executeSafety(context: HookContext): Promise<void>;
}
