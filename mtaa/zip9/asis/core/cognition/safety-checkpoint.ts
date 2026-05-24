// ============================================================
// SAFETY CHECKPOINT — Validate before ANY action
// Consent, security, risk, domain restrictions, data access
// If failed: block + explain + safe alternative
// ============================================================

import { ISafetyCheckpoint } from './interfaces';
import { CognitiveState, SafetyCheck } from './types';
import { ASISConsentManager } from '../consent/asis-consent-token';
import { ASISBehaviorGuard } from '../behavior/asis-behavior-rules';

export class SafetyCheckpoint implements ISafetyCheckpoint {
  private consent: ASISConsentManager;
  private behaviorGuard: ASISBehaviorGuard;

  constructor(consent: ASISConsentManager, behaviorGuard: ASISBehaviorGuard) {
    this.consent = consent;
    this.behaviorGuard = behaviorGuard;
  }

  async validate(state: CognitiveState): Promise<SafetyCheck[]> {
    const checks: SafetyCheck[] = [];

    checks.push(await this.checkConsent(state));
    checks.push(await this.checkSecurity(state));
    checks.push(await this.checkRisk(state));
    checks.push(await this.checkDomainRestrictions(state));

    return checks;
  }

  async checkConsent(state: CognitiveState): Promise<SafetyCheck> {
    const intent = state.intent?.primaryIntent;
    const sensitiveDomains = ['wallet', 'health', 'cash'];

    if (!intent || !sensitiveDomains.includes(intent.domain)) {
      return {
        checkpoint: 'consent',
        passed: true,
        riskLevel: 'safe',
        violations: [],
        requiredConsents: [],
        explanation: 'No sensitive domain — consent not required.',
      };
    }

    // Check if user has active consent for this domain
    const activeTokens = this.consent.getActiveTokens(state.input.userId, intent.domain as any);
    const hasValidConsent = activeTokens.length > 0;

    if (!hasValidConsent) {
      return {
        checkpoint: 'consent',
        passed: false,
        riskLevel: 'danger',
        violations: ['No valid consent token for sensitive domain'],
        requiredConsents: [`${intent.domain}.read_basic`],
        alternativePath: 'request_explicit_consent',
        explanation: `This action requires your explicit approval. I cannot proceed with ${intent.domain} operations without your consent.`,
      };
    }

    return {
      checkpoint: 'consent',
      passed: true,
      riskLevel: 'safe',
      violations: [],
      requiredConsents: activeTokens.map(t => t.scopes.join(',')),
      explanation: `Valid consent found: ${activeTokens.length} active token(s).`,
    };
  }

  async checkSecurity(state: CognitiveState): Promise<SafetyCheck> {
    const violations: string[] = [];
    let riskLevel: SafetyCheck['riskLevel'] = 'safe';

    // Check for auto-execution of sensitive actions
    const intent = state.intent?.primaryIntent;
    if (intent) {
      const canAuto = this.behaviorGuard.canAutoExecute(intent.action, intent.domain);
      if (!canAuto) {
        violations.push('Sensitive action requires user confirmation');
        riskLevel = 'caution';
      }
    }

    // Check for KYC level
    const kycSignal = state.context?.userProfileSignals.find(s => s.type === 'kyc_level');
    const kycLevel = kycSignal?.value || 0;
    if (intent?.domain === 'wallet' && kycLevel < 1) {
      violations.push('KYC level insufficient for wallet operations');
      riskLevel = 'danger';
    }

    return {
      checkpoint: 'security',
      passed: violations.length === 0,
      riskLevel,
      violations,
      requiredConsents: [],
      alternativePath: violations.length > 0 ? 'escalate_kyc' : undefined,
      explanation: violations.length > 0
        ? `Security check failed: ${violations.join(', ')}`
        : 'All security checks passed.',
    };
  }

  async checkRisk(state: CognitiveState): Promise<SafetyCheck> {
    const intent = state.intent?.primaryIntent;
    if (!intent) {
      return { checkpoint: 'risk', passed: true, riskLevel: 'safe', violations: [], requiredConsents: [], explanation: 'No intent to evaluate.' };
    }

    // High-risk intents
    const highRiskIntents = ['send_payment', 'delete_account', 'purge_data', 'emergency_access'];
    const isHighRisk = highRiskIntents.includes(intent.action);

    if (isHighRisk) {
      return {
        checkpoint: 'risk',
        passed: false,
        riskLevel: 'danger',
        violations: [`High-risk action detected: ${intent.action}`],
        requiredConsents: [`${intent.domain}.${intent.action}`],
        alternativePath: 'request_explicit_confirmation',
        explanation: `This is a high-risk action (${intent.action}). I need your explicit PIN confirmation before proceeding.`,
      };
    }

    return {
      checkpoint: 'risk',
      passed: true,
      riskLevel: 'safe',
      violations: [],
      requiredConsents: [],
      explanation: 'Risk level acceptable.',
    };
  }

  async checkDomainRestrictions(state: CognitiveState): Promise<SafetyCheck> {
    const intent = state.intent?.primaryIntent;
    if (!intent) {
      return { checkpoint: 'domain', passed: true, riskLevel: 'safe', violations: [], requiredConsents: [], explanation: 'No intent to evaluate.' };
    }

    // Domain cross-over restrictions
    const currentDomain = state.context?.currentDomain;
    if (currentDomain && currentDomain !== 'general' && currentDomain !== intent.domain) {
      // User was in wallet, now asking about health — OK with consent
      // But flag for awareness
      return {
        checkpoint: 'domain',
        passed: true,
        riskLevel: 'caution',
        violations: [`Domain switch: ${currentDomain} → ${intent.domain}`],
        requiredConsents: [`${intent.domain}.read_basic`],
        explanation: `Switching from ${currentDomain} to ${intent.domain}. I will request consent if needed.`,
      };
    }

    return {
      checkpoint: 'domain',
      passed: true,
      riskLevel: 'safe',
      violations: [],
      requiredConsents: [],
      explanation: 'Domain restrictions satisfied.',
    };
  }
}
