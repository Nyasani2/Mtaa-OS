// ============================================================
// RUNTIME KERNEL — Central execution loop
// REQUEST → VALIDATION → DISPATCH → EXECUTION → RESULT → STATE → LOG
// ============================================================

import { IRuntimeKernel } from './interfaces';
import { ExecutionRequest, ExecutionResult, RuntimeEvent, ModuleState } from './types';
import { IExecutionEngine } from './interfaces';
import { IEventRuntimeBus } from './interfaces';
import { IModuleRegistry } from './interfaces';
import { ILifecycleManager } from './interfaces';
import { IExecutionHooks } from './interfaces';

export class RuntimeKernel implements IRuntimeKernel {
  private executionEngine: IExecutionEngine;
  private eventBus: IEventRuntimeBus;
  private registry: IModuleRegistry;
  private lifecycle: ILifecycleManager;
  private hooks: IExecutionHooks;
  private systemState: Map<string, ModuleState> = new Map();
  private executionLog: Array<{ requestId: string; status: string; timestamp: string }> = [];

  constructor(deps: {
    executionEngine: IExecutionEngine;
    eventBus: IEventRuntimeBus;
    registry: IModuleRegistry;
    lifecycle: ILifecycleManager;
    hooks: IExecutionHooks;
  }) {
    this.executionEngine = deps.executionEngine;
    this.eventBus = deps.eventBus;
    this.registry = deps.registry;
    this.lifecycle = deps.lifecycle;
    this.hooks = deps.hooks;
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // 1. VALIDATION
      const valid = await this.validate(request);
      if (!valid) {
        return this.buildResult(request.id, 'failed', null, ['Validation failed'], 0, 0, 1, false);
      }

      // 2. PRE-EXECUTION HOOKS
      await this.hooks.executePre({
        request, timestamp: new Date().toISOString(), metadata: {},
      });

      // 3. EVENT DISPATCH (execution started)
      await this.eventBus.emit({
        id: `evt_${Date.now()}`, type: 'execution_started',
        source: request.source, payload: { requestId: request.id, type: request.type },
        priority: request.priority, timestamp: new Date().toISOString(),
        correlationId: request.correlationId, processed: false, listeners: [],
      });

      // 4. EXECUTION
      const plan = await this.executionEngine.plan(request);
      const result = await this.executionEngine.execute(plan);

      // 5. POST-EXECUTION HOOKS
      await this.hooks.executePost({
        request, result, timestamp: new Date().toISOString(), metadata: {},
      });

      // 6. STATE UPDATE
      this.updateSystemState(request.source, result.status === 'completed' ? 'active' : 'degraded');

      // 7. LOGGING
      this.logExecution(request.id, result.status);

      // 8. EVENT DISPATCH (execution completed)
      await this.eventBus.emit({
        id: `evt_${Date.now()}`, type: 'execution_completed',
        source: request.source, payload: { requestId: request.id, status: result.status },
        priority: request.priority, timestamp: new Date().toISOString(),
        correlationId: request.correlationId, processed: false, listeners: [],
      });

      return { ...result, executionTimeMs: Date.now() - startTime };

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);

      // FAILURE HOOKS
      await this.hooks.executeFailure({
        request, error: error instanceof Error ? error : new Error(errMsg),
        timestamp: new Date().toISOString(), metadata: {},
      });

      // STATE UPDATE
      this.updateSystemState(request.source, 'failed');

      // FAILURE EVENT
      await this.eventBus.emit({
        id: `evt_${Date.now()}`, type: 'execution_failed',
        source: request.source, payload: { requestId: request.id, error: errMsg },
        priority: 'critical', timestamp: new Date().toISOString(),
        correlationId: request.correlationId, processed: false, listeners: [],
      });

      return this.buildResult(request.id, 'failed', null, [errMsg], 0, 0, 1, false);
    }
  }

  async validate(request: ExecutionRequest): Promise<boolean> {
    // Check source module exists and is active
    const module = this.registry.get(request.source);
    if (!module) {
      console.error(`[RuntimeKernel] Unknown source module: ${request.source}`);
      return false;
    }
    if (module.state !== 'active' && module.state !== 'degraded') {
      console.error(`[RuntimeKernel] Module ${request.source} not active (state: ${module.state})`);
      return false;
    }

    // Validate payload structure
    if (!request.payload || Object.keys(request.payload).length === 0) {
      console.error(`[RuntimeKernel] Empty payload for request ${request.id}`);
      return false;
    }

    return true;
  }

  async dispatch(event: RuntimeEvent): Promise<void> {
    await this.eventBus.emit(event);
  }

  getSystemState(): Record<string, ModuleState> {
    const state: Record<string, ModuleState> = {};
    for (const [id, s] of this.systemState.entries()) {
      state[id] = s;
    }
    return state;
  }

  transitionState(moduleId: string, state: ModuleState): void {
    this.systemState.set(moduleId, state);
    this.lifecycle.transition(moduleId, state).catch(err => {
      console.error(`[RuntimeKernel] Failed to transition ${moduleId} to ${state}:`, err);
    });
  }

  private updateSystemState(moduleId: string, state: ModuleState): void {
    this.systemState.set(moduleId, state);
  }

  private logExecution(requestId: string, status: string): void {
    this.executionLog.push({ requestId, status, timestamp: new Date().toISOString() });
    if (this.executionLog.length > 1000) this.executionLog.shift(); // keep last 1000
  }

  private buildResult(
    requestId: string, status: ExecutionResult['status'], output: any,
    errors: string[], completed: number, failed: number, total: number, rolledBack: boolean
  ): ExecutionResult {
    return {
      requestId, status, output, errors,
      executionTimeMs: 0, tasksCompleted: completed, tasksFailed: failed,
      rolledBack, completedAt: new Date().toISOString(),
    };
  }
}
