// ============================================================
// FAILURE HOOK — Handles execution failures
// Logging, alerting, triggering recovery
// ============================================================

import { ExecutionHook, HookContext } from '../types';

export const FailureHook: ExecutionHook = {
  id: 'hook_failure',
  type: 'failure',
  priority: 0, // highest priority
  enabled: true,
  handler: async (context: HookContext) => {
    if (!context.error) {
      console.warn(`[FailureHook] Called without error for ${context.request.id}`);
      return;
    }

    console.error(`[FailureHook] Execution failed: ${context.request.id}`);
    console.error(`[FailureHook] Error: ${context.error.message}`);

    // Log detailed failure info
    const failureInfo = {
      requestId: context.request.id,
      source: context.request.source,
      type: context.request.type,
      error: context.error.message,
      stack: context.error.stack,
      timestamp: context.timestamp,
    };

    // In production: send to failure recovery system
    console.error(`[FailureHook] Failure info:`, JSON.stringify(failureInfo, null, 2));

    // Trigger recovery if configured
    if (context.request.retryPolicy.attempts > 0) {
      console.log(`[FailureHook] Retry configured: ${context.request.retryPolicy.attempts} attempts`);
    }

    // Alert if critical
    if (context.request.priority === 'critical') {
      console.error(`[FailureHook] CRITICAL FAILURE — immediate attention required`);
    }
  },
};
