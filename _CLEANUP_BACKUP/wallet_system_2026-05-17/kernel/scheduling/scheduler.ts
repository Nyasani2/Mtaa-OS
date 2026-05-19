/**
 * MTAA OS — Kernel Scheduler
 * Unified task scheduling. No duplicate schedulers.
 */

import { KernelEventSystem } from '../events/kernel-event-system';

export interface ScheduledTask {
  id: string;
  name: string;
  cron?: string; // cron expression
  intervalMs?: number;
  executeAt?: number; // timestamp
  handler: () => Promise<void>;
  domain: string;
  retryCount?: number;
}

export class KernelScheduler {
  private eventSystem: KernelEventSystem;
  private tasks: Map<string, ScheduledTask> = new Map();
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private isRunning = false;

  constructor(eventSystem: KernelEventSystem) {
    this.eventSystem = eventSystem;
  }

  async boot(): Promise<void> {
    this.isRunning = true;
    this.eventSystem.publish({
      domain: 'kernel',
      type: 'kernel.scheduler.booted',
      payload: {},
      priority: 'normal',
      
    });
  }

shutdown(): void {
  this.isRunning = false;
  this.timers.forEach((t) => clearInterval(t));
  this.timers.clear();
}

  register(task: ScheduledTask): void {
    this.tasks.set(task.id, task);

    if (task.intervalMs) {
      const timer = setInterval(async () => {
        await this._execute(task);
      }, task.intervalMs);
      this.timers.set(task.id, timer);
    }

    if (task.executeAt) {
      const delay = task.executeAt - Date.now();
      if (delay > 0) {
        setTimeout(async () => {
          await this._execute(task);
        }, delay);
      }
    }

    this.eventSystem.publish({
      domain: 'kernel',
      type: 'kernel.scheduler.task_registered',
      payload: { taskId: task.id, name: task.name },
      priority: 'low',
      
    });
  }

  unregister(taskId: string): void {
    const timer = this.timers.get(taskId);
    if (timer) clearInterval(timer);
    this.timers.delete(taskId);
    this.tasks.delete(taskId);
  }

  getTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  private async _execute(task: ScheduledTask): Promise<void> {
    try {
      await task.handler();
      this.eventSystem.publish({
        domain: 'kernel',
        type: 'kernel.scheduler.task_completed',
        payload: { taskId: task.id, name: task.name },
        priority: 'low',
        
      });
    } catch (err) {
      this.eventSystem.publish({
        domain: 'kernel',
        type: 'kernel.scheduler.task_failed',
        payload: { taskId: task.id, name: task.name, error: String(err) },
        priority: 'high',
        
      });
    }
  }
}

export default KernelScheduler;
