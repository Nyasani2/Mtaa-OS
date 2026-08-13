// @ts-nocheck
/**
 * ASIS CSE — Action Engine (Engine 15)
 * Specification: 15_ACTION_ENGINE.md
 * 
 * Converts plans into real-world actions.
 * The interface between cognition and reality.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveEngine,
  EngineContext,
  EngineResult,
  ExecutionPlan,
  Task,
  ActionLog,
  KAMOSValue,
} from './asis-cse-types';
import { COUPLING, ACTION_TIMEOUT_MS } from './asis-cse-constants';
import { kamosMultiply, emergenceFunction } from './asis-cse-kamos';

interface ActionEngineState {
  actionLog: ActionLog[];
  activeExecutions: Map<string, any>;
  failureCount: number;
}

export class ActionEngine implements CognitiveEngine {
  readonly id = 'action-engine';
  readonly version = '1.0.0';
  readonly capabilities = ['plan-execution', 'service-interfacing', 'hardware-communication', 'failure-detection', 'action-logging'];

  private state: ActionEngineState;

  constructor() {
    this.state = {
      actionLog: [],
      activeExecutions: new Map(),
      failureCount: 0,
    };
  }

  async process(context: EngineContext): Promise<EngineResult> {
    const startTime = Date.now();
    const plan = context.inputs?.plan as ExecutionPlan | undefined;

    if (!plan || !plan.tasks || plan.tasks.length === 0) {
      return this.buildResult([], 0, startTime, 'No execution plan provided for action');
    }

    const identity = context.inputs?.identity || {};
    const permissions = context.inputs?.permissions || [];

    // Validate permissions
    const permissionCheck = this.validatePermissions(plan, permissions);
    if (!permissionCheck.valid) {
      return this.buildResult(
        [{ error: 'Permission denied', details: permissionCheck.violations }],
        0,
        startTime,
        `Action blocked: ${permissionCheck.violations.join('; ')}`
      );
    }

    // Execute tasks in sequence
    const executionResults = [];
    let overallSuccess = true;

    for (const task of plan.tasks) {
      const taskResult = await this.executeTask(task, context);
      executionResults.push(taskResult);

      if (!taskResult.success) {
        overallSuccess = false;
        this.state.failureCount++;

        // Trigger fallback if available
        if (plan.fallbackPlan) {
          const fallbackResult = await this.executeFallback(task, plan.fallbackPlan, context);
          executionResults.push(fallbackResult);
        }

        // Check if we should rollback
        if (task.type === 'critical' || this.state.failureCount > 2) {
          if (plan.rollbackPlan) {
            const rollbackResult = await this.executeRollback(plan, context);
            executionResults.push(rollbackResult);
          }
          break;
        }
      }
    }

    // Log the action
    const actionLog: ActionLog = {
      id: uuidv4(),
      planId: plan.id,
      actor: identity.userId || 'system',
      purpose: plan.objective,
      resourcesUsed: this.summariseResources(executionResults),
      duration: Date.now() - startTime,
      outcome: overallSuccess ? 'success' : 'partial-failure',
      errors: executionResults.filter((r: any) => !r.success).map((r: any) => r.error),
      recoveryPerformed: executionResults.some((r: any) => r.type === 'fallback' || r.type === 'rollback'),
      timestamp: Date.now(),
    };

    this.state.actionLog.push(actionLog);

    const actionOutput = {
      actionLog,
      executionResults,
      overallSuccess,
      tasksCompleted: executionResults.filter((r: any) => r.success).length,
      tasksFailed: executionResults.filter((r: any) => !r.success && r.type !== 'fallback' && r.type !== 'rollback').length,
      fallbacksTriggered: executionResults.filter((r: any) => r.type === 'fallback').length,
      rollbacksTriggered: executionResults.filter((r: any) => r.type === 'rollback').length,
    };

    return this.buildResult(
      [actionOutput],
      overallSuccess ? 0.9 : 0.4,
      startTime,
      `Executed ${plan.tasks.length} tasks. ${actionOutput.tasksCompleted} succeeded, ${actionOutput.tasksFailed} failed. ${actionOutput.fallbacksTriggered} fallbacks, ${actionOutput.rollbacksTriggered} rollbacks.`
    );
  }

  private validatePermissions(plan: ExecutionPlan, permissions: string[]): { valid: boolean; violations: string[] } {
    const violations: string[] = [];
    const requiredPermissions = this.inferRequiredPermissions(plan);

    for (const required of requiredPermissions) {
      if (!permissions.includes(required) && !permissions.includes('admin')) {
        violations.push(`Missing permission: ${required}`);
      }
    }

    return { valid: violations.length === 0, violations };
  }

  private inferRequiredPermissions(plan: ExecutionPlan): string[] {
    const perms = ['execute'];
    for (const task of plan.tasks) {
      if (task.type === 'data-collection') perms.push('read');
      if (task.type === 'execution') perms.push('write');
      if (task.type === 'generation') perms.push('create');
      if (task.requiredResources?.includes('wallet')) perms.push('wallet-transact');
      if (task.requiredResources?.includes('memory-service')) perms.push('memory-write');
    }
    return [...new Set(perms)];
  }

  private async executeTask(task: Task, context: EngineContext): Promise<any> {
    const taskStart = Date.now();

    try {
      // Simulate task execution based on type
      const result = await this.simulateExecution(task, context);

      return {
        taskId: task.id,
        success: true,
        type: task.type,
        duration: Date.now() - taskStart,
        output: result,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        type: task.type,
        duration: Date.now() - taskStart,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  private async simulateExecution(task: Task, context: EngineContext): Promise<any> {
    // In production, this would interface with actual services
    // For now, we simulate based on task type
    const simulationDelay = Math.min(task.estimatedDuration || 1000, ACTION_TIMEOUT_MS);

    await new Promise(resolve => setTimeout(resolve, Math.min(simulationDelay, 100))); // Cap at 100ms for responsiveness

    const successProbability = task.priority || 0.8;
    if (Math.random() > successProbability) {
      throw new Error(`Simulated failure in ${task.name}: resource unavailable`);
    }

    return {
      taskName: task.name,
      status: 'completed',
      simulatedOutput: `Executed ${task.description}`,
      metadata: {
        executedAt: Date.now(),
        executor: 'action-engine',
        contextId: context.sessionId,
      },
    };
  }

  private async executeFallback(failedTask: Task, fallbackPlan: any, context: EngineContext): Promise<any> {
    const fallbackAction = fallbackPlan.actions?.find((a: any) => a.taskId === failedTask.id);

    if (!fallbackAction) {
      return { type: 'fallback', success: false, error: 'No fallback defined for this task' };
    }

    // Attempt fallback
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      return {
        type: 'fallback',
        success: true,
        originalTask: failedTask.id,
        fallbackAction: fallbackAction.fallbackAction,
        message: `Fallback '${fallbackAction.fallbackAction}' executed for task ${failedTask.name}`,
      };
    } catch (error) {
      return {
        type: 'fallback',
        success: false,
        originalTask: failedTask.id,
        error: error instanceof Error ? error.message : 'Fallback failed',
      };
    }
  }

  private async executeRollback(plan: ExecutionPlan, context: EngineContext): Promise<any> {
    const rollbackSteps = plan.rollbackPlan?.steps || [];
    const results = [];

    for (const step of rollbackSteps) {
      try {
        await new Promise(resolve => setTimeout(resolve, 30));
        results.push({
          taskId: step.taskId,
          action: step.rollbackAction,
          success: true,
        });
      } catch (error) {
        results.push({
          taskId: step.taskId,
          action: step.rollbackAction,
          success: false,
          error: error instanceof Error ? error.message : 'Rollback step failed',
        });
      }
    }

    return {
      type: 'rollback',
      success: results.every((r: any) => r.success),
      steps: results,
      statePreserved: plan.rollbackPlan?.stateSnapshotRequired || false,
    };
  }

  private summariseResources(results: any[]): any {
    const types = new Set(results.map((r: any) => r.type).filter(Boolean));
    return {
      types: [...types],
      count: results.length,
      totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
    };
  }

  private buildResult(outputs: any[], confidence: number, startTime: number, explanation: string): EngineResult {
    return {
      engineId: this.id,
      outputs,
      confidence: { overall: confidence, logical: confidence, evidence: confidence },
      processingTime: Date.now() - startTime,
      explanation,
      traceId: uuidv4(),
      timestamp: Date.now(),
    };
  }

  getActionLog(): ActionLog[] {
    return this.state.actionLog;
  }
}
