// ============================================================
    // TASK SCHEDULER — Delayed actions, retries, batch optimization
    // Priority: health > wallet > transport > cash > general
    // ============================================================

    import { ITaskScheduler } from './interfaces';
    import { ExecutionRequest, ScheduledTask, EventPriority } from './types';

    export class TaskScheduler implements ITaskScheduler {
      private tasks: Map<string, ScheduledTask> = new Map();
      private taskQueue: string[] = [];
      private processing: boolean = false;
      private readonly DOMAIN_PRIORITY: Record<string, number> = {
        health: 0, wallet: 1, transport: 2, cash: 3, general: 4,
      };

      async schedule(request: ExecutionRequest, delayMs: number): Promise<string> {
        const id = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const task: ScheduledTask = {
          id, request,
          scheduledAt: new Date().toISOString(),
          executeAt: new Date(Date.now() + delayMs).toISOString(),
          recurring: false, executed: false, cancelled: false,
        };
        this.tasks.set(id, task);
        this.insertByPriority(id);
        return id;
      }

      async scheduleRecurring(request: ExecutionRequest, cronExpression: string): Promise<string> {
        const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const task: ScheduledTask = {
          id, request,
          scheduledAt: new Date().toISOString(),
          executeAt: new Date().toISOString(),
          recurring: true, cronExpression,
          executed: false, cancelled: false,
        };
        this.tasks.set(id, task);
        this.insertByPriority(id);
        return id;
      }

      async cancel(taskId: string): Promise<void> {
        const task = this.tasks.get(taskId);
        if (task) {
          task.cancelled = true;
          this.taskQueue = this.taskQueue.filter(id => id !== taskId);
        }
      }

      async processQueue(): Promise<void> {
        if (this.processing) return;
        this.processing = true;

        const now = Date.now();
        const ready: ScheduledTask[] = [];

        for (const id of this.taskQueue) {
          const task = this.tasks.get(id);
          if (!task || task.cancelled || task.executed) continue;

          const executeAt = new Date(task.executeAt).getTime();
          if (executeAt <= now) {
            ready.push(task);
          }
        }

        // Sort by domain priority
        ready.sort((a, b) => {
          const pa = this.DOMAIN_PRIORITY[a.request.source] ?? 99;
          const pb = this.DOMAIN_PRIORITY[b.request.source] ?? 99;
          return pa - pb;
        });

        for (const task of ready) {
          if (task.cancelled) continue;

          console.log(`[TaskScheduler] Executing scheduled task ${task.id} (${task.request.type})`);
          task.executed = true;

          // In production: dispatch to runtime kernel for execution

          // If recurring, reschedule
          if (task.recurring && task.cronExpression) {
            const nextExecution = this.calculateNextCron(task.cronExpression);
            if (nextExecution) {
              const newTask: ScheduledTask = {
                ...task,
                id: `${task.id}_next`,
                scheduledAt: new Date().toISOString(),
                executeAt: nextExecution.toISOString(),
                executed: false,
              };
              this.tasks.set(newTask.id, newTask);
              this.insertByPriority(newTask.id);
            }
          }
        }

        this.processing = false;
      }

      getQueue(): ScheduledTask[] {
        return Array.from(this.tasks.values()).filter(t => !t.executed && !t.cancelled);
      }

      private insertByPriority(taskId: string): void {
        const task = this.tasks.get(taskId);
        if (!task) return;

        const priority = this.DOMAIN_PRIORITY[task.request.source] ?? 99;
        const insertIdx = this.taskQueue.findIndex(id => {
          const other = this.tasks.get(id);
          if (!other) return false;
          return (this.DOMAIN_PRIORITY[other.request.source] ?? 99) > priority;
        });

        if (insertIdx === -1) this.taskQueue.push(taskId);
        else this.taskQueue.splice(insertIdx, 0, taskId);
      }

      private calculateNextCron(cronExpression: string): Date | null {
        // Simplified cron parser — in production use a proper library
        const parts = cronExpression.split(' ');
        if (parts.length !== 5) return null;

        const now = new Date();
        const next = new Date(now.getTime() + 60000); // default: 1 minute from now
        return next;
      }
    }
    