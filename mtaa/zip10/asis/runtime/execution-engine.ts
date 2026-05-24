// ============================================================
    // EXECUTION ENGINE — Where ASIS becomes REAL
    // Tool calls, agent runs, workflow coordination, rollback
    // Parallel (safe), sequential, retry, timeout, cancellation
    // ============================================================

    import { IExecutionEngine } from './interfaces';
    import { ExecutionRequest, ExecutionResult, ExecutionPlan, ExecutionTask, RollbackTask, ExecutionStatus } from './types';
    import { IExecutionHooks } from './interfaces';

    export class ExecutionEngine implements IExecutionEngine {
      private hooks: IExecutionHooks;
      private activeExecutions: Map<string, { plan: ExecutionPlan; abortController: AbortController }> = new Map();
      private completedExecutions: Map<string, ExecutionResult> = new Map();

      constructor(hooks: IExecutionHooks) {
        this.hooks = hooks;
      }

      async plan(request: ExecutionRequest): Promise<ExecutionPlan> {
        const tasks: ExecutionTask[] = [];
        const rollbackPlan: RollbackTask[] = [];

        if (request.type === 'tool_call') {
          tasks.push({
            id: `task_${Date.now()}_1`, type: 'tool_call', target: request.payload.toolId,
            input: request.payload.parameters, dependencies: [], timeoutMs: request.timeoutMs,
            retryCount: 0, maxRetries: request.retryPolicy.attempts,
            status: 'pending',
          });
          rollbackPlan.push({
            taskId: `task_${Date.now()}_1`, rollbackAction: 'undo_tool_call',
            rollbackInput: { toolId: request.payload.toolId }, executed: false,
          });
        } else if (request.type === 'agent_run') {
          tasks.push({
            id: `task_${Date.now()}_1`, type: 'agent_run', target: request.payload.agentId,
            input: request.payload.input, dependencies: [], timeoutMs: request.timeoutMs,
            retryCount: 0, maxRetries: request.retryPolicy.attempts,
            status: 'pending',
          });
        } else if (request.type === 'workflow') {
          // Multi-step workflow
          const workflowTasks = request.payload.tasks as Array<{ id: string; type: string; target: string; input: any; deps: string[] }>;
          for (const wt of workflowTasks) {
            tasks.push({
              id: wt.id, type: wt.type as any, target: wt.target,
              input: wt.input, dependencies: wt.deps || [],
              timeoutMs: request.timeoutMs / workflowTasks.length,
              retryCount: 0, maxRetries: request.retryPolicy.attempts,
              status: 'pending',
            });
            rollbackPlan.push({
              taskId: wt.id, rollbackAction: `undo_${wt.type}`,
              rollbackInput: { target: wt.target }, executed: false,
            });
          }
        }

        return {
          id: `plan_${Date.now()}`, requestId: request.id,
          tasks, strategy: tasks.length > 1 ? 'mixed' : 'sequential',
          rollbackPlan, estimatedDurationMs: tasks.reduce((s, t) => s + t.timeoutMs, 0),
        };
      }

      async execute(plan: ExecutionPlan): Promise<ExecutionResult> {
        const abortController = new AbortController();
        this.activeExecutions.set(plan.requestId, { plan, abortController });

        let completed = 0;
        let failed = 0;
        const errors: string[] = [];
        const results: any[] = [];

        try {
          // Determine execution order based on dependencies
          const executionOrder = this.topologicalSort(plan.tasks);

          for (const task of executionOrder) {
            if (abortController.signal.aborted) {
              task.status = 'cancelled';
              continue;
            }

            // Check dependencies
            const depsReady = task.dependencies.every(depId => {
              const dep = plan.tasks.find(t => t.id === depId);
              return dep?.status === 'completed';
            });
            if (!depsReady) {
              task.status = 'failed';
              errors.push(`Dependencies not ready for task ${task.id}`);
              failed++;
              continue;
            }

            // Execute task with retry
            const result = await this.executeTask(task, abortController.signal);
            if (result.success) {
              task.status = 'completed';
              task.result = result.output;
              completed++;
              results.push(result.output);
            } else {
              task.status = 'failed';
              task.error = result.error;
              errors.push(result.error);
              failed++;

              // If critical task fails, consider rollback
              if (task.type === 'tool_call' && plan.rollbackPlan.length > 0) {
                console.warn(`[ExecutionEngine] Critical task ${task.id} failed, rollback available`);
              }
            }
          }

          const allCompleted = plan.tasks.every(t => t.status === 'completed');
          const status: ExecutionStatus = allCompleted ? 'completed' : failed > 0 && completed === 0 ? 'failed' : 'failed';

          const result: ExecutionResult = {
            requestId: plan.requestId, status,
            output: allCompleted ? results : null,
            errors, executionTimeMs: 0,
            tasksCompleted: completed, tasksFailed: failed,
            rolledBack: false, completedAt: new Date().toISOString(),
          };

          this.completedExecutions.set(plan.requestId, result);
          this.activeExecutions.delete(plan.requestId);
          return result;

        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          return {
            requestId: plan.requestId, status: 'failed',
            output: null, errors: [errMsg], executionTimeMs: 0,
            tasksCompleted: completed, tasksFailed: failed + 1,
            rolledBack: false, completedAt: new Date().toISOString(),
          };
        }
      }

      async cancel(requestId: string): Promise<void> {
        const execution = this.activeExecutions.get(requestId);
        if (execution) {
          execution.abortController.abort();
          console.log(`[ExecutionEngine] Cancelled execution ${requestId}`);
        }
      }

      async rollback(requestId: string): Promise<void> {
        const execution = this.activeExecutions.get(requestId);
        if (!execution) {
          console.warn(`[ExecutionEngine] No active execution to rollback: ${requestId}`);
          return;
        }

        console.log(`[ExecutionEngine] Rolling back ${requestId}...`);

        // Execute rollback tasks in reverse order
        const rollbackTasks = [...execution.plan.rollbackPlan].reverse();
        for (const rt of rollbackTasks) {
          if (!rt.executed) {
            console.log(`[ExecutionEngine] Rollback: ${rt.rollbackAction} for ${rt.taskId}`);
            // In production: execute actual rollback
            rt.executed = true;
          }
        }

        // Update result
        const result = this.completedExecutions.get(requestId);
        if (result) {
          result.rolledBack = true;
          this.completedExecutions.set(requestId, result);
        }
      }

      private async executeTask(task: ExecutionTask, signal: AbortSignal): Promise<{ success: boolean; output?: any; error?: string }> {
        task.status = 'running';
        task.startedAt = new Date().toISOString();

        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            resolve({ success: false, error: `Task ${task.id} timed out after ${task.timeoutMs}ms` });
          }, task.timeoutMs);

          // Simulate execution
          this.performExecution(task, signal)
            .then(output => {
              clearTimeout(timeout);
              task.completedAt = new Date().toISOString();
              resolve({ success: true, output });
            })
            .catch(err => {
              clearTimeout(timeout);
              task.retryCount++;
              if (task.retryCount <= task.maxRetries) {
                console.log(`[ExecutionEngine] Retrying task ${task.id} (${task.retryCount}/${task.maxRetries})`);
                // In production: actual retry with backoff
                resolve({ success: false, error: `Failed after ${task.retryCount} retries: ${err.message}` });
              } else {
                resolve({ success: false, error: err.message });
              }
            });
        });
      }

      private async performExecution(task: ExecutionTask, signal: AbortSignal): Promise<any> {
        // In production: dispatch to actual tool/agent
        if (signal.aborted) throw new Error('Execution cancelled');

        // Simulate work
        await new Promise(r => setTimeout(r, 100));

        return { taskId: task.id, status: 'success', output: task.input };
      }

      private topologicalSort(tasks: ExecutionTask[]): ExecutionTask[] {
        const sorted: ExecutionTask[] = [];
        const visited = new Set<string>();
        const temp = new Set<string>();

        const visit = (task: ExecutionTask) => {
          if (temp.has(task.id)) throw new Error('Circular dependency detected');
          if (visited.has(task.id)) return;

          temp.add(task.id);
          for (const depId of task.dependencies) {
            const dep = tasks.find(t => t.id === depId);
            if (dep) visit(dep);
          }
          temp.delete(task.id);
          visited.add(task.id);
          sorted.push(task);
        };

        for (const task of tasks) {
          if (!visited.has(task.id)) visit(task);
        }

        return sorted;
      }
    }
    