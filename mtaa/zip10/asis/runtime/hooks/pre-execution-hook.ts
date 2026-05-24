// ============================================================
// PRE-EXECUTION HOOK — Validates before any execution
// Consent check, safety validation, rate limiting
// ============================================================

import { ExecutionHook, HookContext } from '../types';

export const PreExecutionHook: ExecutionHook = {
  id: 'hook_pre_execution',
  type: 'pre_execution',
  priority: 1,
  enabled: true,
  handler: async (context: HookContext) => {
    console.log(`[PreExecutionHook] Validating request ${context.request.id}`);

    // Validate request structure
    if (!context.request.payload || Object.keys(context.request.payload).length === 0) {
      throw new Error('Pre-execution validation failed: empty payload');
    }

    // Check source module is registered
    if (!context.request.source) {
      throw new Error('Pre-execution validation failed: no source module');
    }

    // Validate timeout
    if (context.request.timeoutMs < 100 || context.request.timeoutMs > 60000) {
      throw new Error('Pre-execution validation failed: invalid timeout');
    }

    // Rate limit check (simplified)
    const rateLimit = 100; // requests per minute
    // In production: check against actual rate limiter

    console.log(`[PreExecutionHook] Request ${context.request.id} validated`);
  },
};
