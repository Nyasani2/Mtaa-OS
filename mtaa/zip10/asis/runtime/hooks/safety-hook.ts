// ============================================================
// SAFETY HOOK — Final safety validation before execution
// Domain restrictions, consent re-validation, risk assessment
// ============================================================

import { ExecutionHook, HookContext } from '../types';

export const SafetyHook: ExecutionHook = {
  id: 'hook_safety',
  type: 'safety',
  priority: 0, // runs before pre-execution
  enabled: true,
  handler: async (context: HookContext) => {
    console.log(`[SafetyHook] Running safety checks for ${context.request.id}`);

    const violations: string[] = [];

    // Check sensitive domains
    const sensitiveDomains = ['wallet', 'health', 'cash'];
    const source = context.request.source;

    if (sensitiveDomains.some(d => source.includes(d))) {
      // Re-validate consent
      // In production: check ASISConsentManager
      const hasConsent = true; // placeholder
      if (!hasConsent) {
        violations.push('Consent not validated for sensitive domain');
      }
    }

    // Check for high-risk actions
    const highRiskActions = ['delete', 'purge', 'transfer', 'override'];
    const payload = JSON.stringify(context.request.payload).toLowerCase();
    if (highRiskActions.some(a => payload.includes(a))) {
      violations.push('High-risk action detected — requires explicit confirmation');
    }

    // Check execution limits
    if (context.request.timeoutMs > 30000) {
      violations.push('Timeout exceeds safe threshold (30s)');
    }

    if (violations.length > 0) {
      throw new Error(`Safety check failed:\n${violations.join('\n')}`);
    }

    console.log(`[SafetyHook] All safety checks passed for ${context.request.id}`);
  },
};
