// ============================================================
// RUNTIME TYPES — ASIS System Runtime Core (ZIP 10)
// Execution runtime. NOT AI logic. NOT cognition.
// ============================================================

export type BootPhase = 'validation' | 'registration' | 'event_bus' | 'agent_attach' | 'cognitive_attach' | 'ready';
export type ModuleState = 'initializing' | 'active' | 'degraded' | 'suspended' | 'failed' | 'recovering';
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'rolled_back';
export type EventPriority = 'critical' | 'high' | 'normal' | 'low' | 'background';
export type RecoveryStrategy = 'retry' | 'rollback' | 'degrade' | 'isolate' | 'restart';
export type ThrottleLevel = 'normal' | 'reduced' | 'minimal' | 'emergency';

export interface RuntimeConfig {
  country: string;
  kycLevel: number;
  systemProfile: 'production' | 'staging' | 'development';
  maxConcurrentExecutions: number;
  defaultTimeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  circuitBreakerThreshold: number;
  circuitBreakerResetMs: number;
  memoryThresholdMB: number;
  cpuThresholdPercent: number;
  requestRateLimit: number;
  enableHotReload: boolean;
  enablePartialBoot: boolean;
}

export interface ModuleRegistration {
  id: string;
  name: string;
  version: string;
  domain: string;
  state: ModuleState;
  dependencies: string[];
  health: ModuleHealth;
  instance: any;
  metadata: Record<string, any>;
}

export interface ModuleHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: string;
  uptimeMs: number;
  errorCount: number;
  lastError?: string;
  latencyAvgMs: number;
}

export interface ExecutionRequest {
  id: string;
  type: 'tool_call' | 'agent_run' | 'workflow' | 'system_task';
  source: string; // module ID that originated
  payload: Record<string, any>;
  priority: EventPriority;
  timeoutMs: number;
  retryPolicy: { attempts: number; delayMs: number; backoffMultiplier: number };
  createdAt: string;
  correlationId: string;
}

export interface ExecutionResult {
  requestId: string;
  status: ExecutionStatus;
  output: any;
  errors: string[];
  executionTimeMs: number;
  tasksCompleted: number;
  tasksFailed: number;
  rolledBack: boolean;
  completedAt: string;
}

export interface ExecutionPlan {
  id: string;
  requestId: string;
  tasks: ExecutionTask[];
  strategy: 'parallel' | 'sequential' | 'mixed';
  rollbackPlan: RollbackTask[];
  estimatedDurationMs: number;
}

export interface ExecutionTask {
  id: string;
  type: 'tool_call' | 'agent_run' | 'sub_workflow';
  target: string; // tool ID or agent ID
  input: Record<string, any>;
  dependencies: string[]; // task IDs that must complete first
  timeoutMs: number;
  retryCount: number;
  maxRetries: number;
  status: ExecutionStatus;
  result?: any;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface RollbackTask {
  taskId: string;
  rollbackAction: string;
  rollbackInput: Record<string, any>;
  executed: boolean;
}

export interface RuntimeEvent {
  id: string;
  type: string;
  source: string;
  target?: string;
  payload: any;
  priority: EventPriority;
  timestamp: string;
  correlationId: string;
  processed: boolean;
  listeners: string[];
}

export interface ScheduledTask {
  id: string;
  request: ExecutionRequest;
  scheduledAt: string;
  executeAt: string;
  recurring: boolean;
  cronExpression?: string;
  executed: boolean;
  cancelled: boolean;
}

export interface FailureRecord {
  id: string;
  moduleId: string;
  error: string;
  stackTrace?: string;
  timestamp: string;
  recoveryStrategy: RecoveryStrategy;
  recovered: boolean;
  recoveryAttempts: number;
  impact: 'isolated' | 'cascading' | 'system_wide';
}

export interface ThrottleState {
  level: ThrottleLevel;
  cpuLoad: number;
  memoryUsageMB: number;
  activeExecutions: number;
  queueDepth: number;
  requestRate: number;
  lastUpdated: string;
}

export interface RuntimeSnapshot {
  timestamp: string;
  bootPhase: BootPhase;
  moduleStates: Record<string, ModuleState>;
  activeExecutions: number;
  queuedExecutions: number;
  eventQueueDepth: number;
  throttleLevel: ThrottleLevel;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  uptimeMs: number;
  failureRate: number;
  avgLatencyMs: number;
}

export interface ExecutionHook {
  id: string;
  type: 'pre_execution' | 'post_execution' | 'failure' | 'safety';
  priority: number;
  handler: (context: HookContext) => Promise<void>;
  enabled: boolean;
}

export interface HookContext {
  request: ExecutionRequest;
  result?: ExecutionResult;
  error?: Error;
  moduleId?: string;
  timestamp: string;
  metadata: Record<string, any>;
}
