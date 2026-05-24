// ============================================================
// POST-EXECUTION HOOK — Cleanup, logging, state update
// Result validation, metrics recording
// ============================================================

import { ExecutionHook, HookContext } from '../types';

export const PostExecutionHook: ExecutionHook = {
  id: 'hook_post_execution',
  type: 'post_execution',
  priority: 2,
  enabled: true,
  handler: async (context: HookContext) => {
    if (!context.result) {
      console.warn(`[PostExecutionHook] No result for ${context.request.id}`);
      return;
    }

    console.log(`[PostExecutionHook] Processing result for ${context.request.id}`);

    // Validate result structure
    if (!context.result.status) {
      console.warn(`[PostExecutionHook] Result missing status`);
    }

    // Log execution time
    if (context.result.executionTimeMs > 5000) {
      console.warn(`[PostExecutionHook] Slow execution detected: ${context.result.executionTimeMs}ms`);
    }

    // Record metrics
    // In production: send to runtime monitor

    // Cleanup temporary data
    // In production: clear execution caches

    console.log(`[PostExecutionHook] Result processed for ${context.request.id}`);
  },
};
