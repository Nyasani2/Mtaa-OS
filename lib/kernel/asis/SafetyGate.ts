export type AsisCapability = 'observe_events' | 'generate_insights' | 'flag_anomalies' | 'assist_forms' | 'generate_content' | 'read_analytics';

interface SafetyRule {
  capability: AsisCapability;
  restrictions: string[];
  auditLog: boolean;
  userConfirmRequired: boolean;
}

const ASIS_RULES: Record<string, SafetyRule> = {
  observe_events: { capability: 'observe_events', restrictions: ['no_callback_access'], auditLog: true, userConfirmRequired: false },
  generate_insights: { capability: 'generate_insights', restrictions: ['no_kernel_write', 'no_financial_execute'], auditLog: true, userConfirmRequired: false },
  flag_anomalies: { capability: 'flag_anomalies', restrictions: ['no_kernel_write'], auditLog: true, userConfirmRequired: false },
  assist_forms: { capability: 'assist_forms', restrictions: ['no_financial_execute', 'no_business_number_assign'], auditLog: true, userConfirmRequired: true },
  generate_content: { capability: 'generate_content', restrictions: ['no_kernel_write'], auditLog: false, userConfirmRequired: false },
  read_analytics: { capability: 'read_analytics', restrictions: ['no_callback_access'], auditLog: true, userConfirmRequired: false },
};

export class AsisSafetyGate {
  private auditLog: Array<{ timestamp: number; action: string; capability: AsisCapability; allowed: boolean; reason?: string; userConfirmed?: boolean; }> = [];

  canPerform(capability: AsisCapability, action: string): { allowed: boolean; reason?: string } {
    const rule = ASIS_RULES[capability];
    if (!rule) return { allowed: false, reason: `Unknown capability: ${capability}` };

    if (action.includes('create_till') || action.includes('create_paybill'))
      return { allowed: false, reason: 'ASIS cannot create business numbers — System assigns only' };
    if (action.includes('callback') || action.includes('webhook'))
      return { allowed: false, reason: 'ASIS cannot access payment callbacks — Edge functions handle' };
    if (action.includes('execute_payment') || action.includes('transfer_funds'))
      return { allowed: false, reason: 'ASIS cannot execute financial transactions' };
    if (action.includes('modify_auth') || action.includes('change_password'))
      return { allowed: false, reason: 'ASIS cannot modify authentication state' };

    return { allowed: true };
  }

  guard<T>(capability: AsisCapability, action: string, fn: () => T, userConfirmed = false): T {
    const check = this.canPerform(capability, action);
    this.auditLog.push({ timestamp: Date.now(), action, capability, allowed: check.allowed, reason: check.reason, userConfirmed });
    if (!check.allowed) throw new Error(`[ASIS BLOCKED] ${action}: ${check.reason}`);
    const rule = ASIS_RULES[capability];
    if (rule.userConfirmRequired && !userConfirmed) throw new Error(`[ASIS BLOCKED] ${action}: User confirmation required`);
    return fn();
  }

  getAuditLog(limit = 100) { return this.auditLog.slice(-limit); }

  getCapabilities() {
    return Object.entries(ASIS_RULES).map(([key, rule]) => ({
      capability: key as AsisCapability,
      description: this.getCapabilityDescription(key as AsisCapability),
      restrictions: rule.restrictions,
    }));
  }

  private getCapabilityDescription(cap: AsisCapability): string {
    const d: Record<AsisCapability, string> = {
      observe_events: 'Watch system events and payment flows',
      generate_insights: 'Analyze business data and generate reports',
      flag_anomalies: 'Detect unusual patterns and alert owners',
      assist_forms: 'Help fill forms with suggestions (user confirms)',
      generate_content: 'Create descriptions, messages, and marketing copy',
      read_analytics: 'Access analytics dashboards and metrics',
    };
    return d[cap];
  }
}

export const asisGate = new AsisSafetyGate();
