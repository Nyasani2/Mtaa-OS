// ============================================================
// EXECUTION HOOKS MANAGER — Pre/post/failure/safety hook orchestration
// ============================================================

import { IExecutionHooks } from './interfaces';
import { ExecutionHook, HookContext } from './types';

export class ExecutionHooks implements IExecutionHooks {
  private hooks: Map<string, ExecutionHook> = new Map();

  register(hook: ExecutionHook): void {
    this.hooks.set(hook.id, hook);
  }

  unregister(hookId: string): void {
    this.hooks.delete(hookId);
  }

  async executePre(context: HookContext): Promise<void> {
    // Safety hooks first (priority 0)
    const safetyHooks = this.getHooksByType('safety');
    for (const hook of safetyHooks) {
      if (hook.enabled) await hook.handler(context);
    }

    // Then pre-execution hooks
    const preHooks = this.getHooksByType('pre_execution');
    for (const hook of preHooks) {
      if (hook.enabled) await hook.handler(context);
    }
  }

  async executePost(context: HookContext): Promise<void> {
    const postHooks = this.getHooksByType('post_execution');
    for (const hook of postHooks) {
      if (hook.enabled) await hook.handler(context);
    }
  }

  async executeFailure(context: HookContext): Promise<void> {
    const failureHooks = this.getHooksByType('failure');
    for (const hook of failureHooks) {
      if (hook.enabled) await hook.handler(context);
    }
  }

  async executeSafety(context: HookContext): Promise<void> {
    const safetyHooks = this.getHooksByType('safety');
    for (const hook of safetyHooks) {
      if (hook.enabled) await hook.handler(context);
    }
  }

  private getHooksByType(type: ExecutionHook['type']): ExecutionHook[] {
    return Array.from(this.hooks.values())
      .filter(h => h.type === type)
      .sort((a, b) => a.priority - b.priority);
  }
}
