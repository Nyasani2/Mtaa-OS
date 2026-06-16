// ASIS v2 — M-Theory Growth Calculator & Immune System
// Replaces binary safety gate with proliferative modulation
// 1 × 1 = 1 + f(growth, replication, interaction, observation)

import {
  AsisRequest,
  AsisContext,
  GrowthFactor,
  ConstitutionalWeights,
  SpawnedCapability,
} from '../types';

export class GrowthCalculator {
  // Constitutional weights per domain — these are the SOUL of the system
  private readonly CONSTITUTION: Record<string, ConstitutionalWeights> = {
    wallet: {
      domain: 'wallet',
      humanDignity: 1.0,
      fairness: 0.9,
      transparency: 0.8,
      sovereignty: 0.9,
      nonHarm: 1.0,
      consent: 0.9,
    },
    transport: {
      domain: 'transport',
      humanDignity: 1.0,
      fairness: 0.8,
      transparency: 0.7,
      sovereignty: 0.6,
      nonHarm: 1.0,
      consent: 0.7,
    },
    health: {
      domain: 'health',
      humanDignity: 1.0,
      fairness: 0.9,
      transparency: 0.9,
      sovereignty: 0.8,
      nonHarm: 1.0,
      consent: 1.0,
    },
    civic: {
      domain: 'civic',
      humanDignity: 1.0,
      fairness: 1.0,
      transparency: 1.0,
      sovereignty: 1.0,
      nonHarm: 0.9,
      consent: 0.8,
    },
    jobs: {
      domain: 'jobs',
      humanDignity: 0.9,
      fairness: 0.9,
      transparency: 0.8,
      sovereignty: 0.7,
      nonHarm: 0.9,
      consent: 0.8,
    },
    general: {
      domain: 'general',
      humanDignity: 0.9,
      fairness: 0.8,
      transparency: 0.7,
      sovereignty: 0.7,
      nonHarm: 0.9,
      consent: 0.8,
    },
  };

  // Dangerous patterns — these trigger immune suppression (f → 0)
  private readonly DANGEROUS_PATTERNS = [
    /bypass\s+(pin|password|auth|mfa|biometric)/i,
    /disable\s+(security|auth|verification|rls)/i,
    /modify\s+(kernel|system|auth|security)\s+(file|config|setting)/i,
    /delete\s+(user|admin|system)\s+(account|record|data)/i,
    /grant\s+(admin|superuser|root)\s+(access|privilege)/i,
    /inject\s+(sql|code|script|command)/i,
    /exploit\s+(vulnerability|bug|flaw)/i,
    /hack\s+(system|database|wallet|account)/i,
    /show\s+(all|every)\s+(user|wallet|transaction|password)/i,
    /dump\s+(database|table|schema)/i,
    /export\s+(all|every)\s+(user|record)/i,
    /access\s+(other|someone|another)\s+(wallet|account|data)/i,
    /ignore\s+(previous|above|earlier)\s+(instruction|rule|prompt)/i,
    /override\s+(system|safety|security)\s+(instruction|rule|prompt)/i,
    /pretend\s+(you are|to be)\s+(admin|root|system)/i,
    /act\s+as\s+(admin|root|superuser)/i,
    /new\s+instruction:/i,
    /system\s+prompt\s+leak/i,
    /create\s+(malware|virus|ransomware|trojan)/i,
    /phishing\s+(email|site|page)/i,
    /steal\s+(data|money|identity|credentials)/i,
    /fraudulent\s+(transaction|claim|application)/i,
  ];

  // Allowed patterns — these preserve growth even if they look suspicious
  private readonly ALLOWED_PATTERNS = [
    /how\s+(do|can|to)\s+(i|you)\s+(change|update|reset)\s+my\s+pin/i,
    /i\s+forgot\s+my\s+pin/i,
    /how\s+to\s+secure\s+my\s+account/i,
    /enable\s+(two.factor|2fa|mfa)/i,
    /what\s+is\s+my\s+(balance|transaction\s+history)/i,
    /help\s+me\s+understand\s+my\s+(spending|income|budget)/i,
  ];

  /**
   * M-THEORY CORE: Compute growth factor f for this interaction
   * f = base × constitutional × interaction × observation × immune
   */
  async computeF(
    request: AsisRequest,
    context: AsisContext,
    enrichedContext?: any
  ): Promise<GrowthFactor> {
    const message = request.message.toLowerCase();
    const domain = request.domain;

    // ── BASE: The interaction itself always has potential ──
    const base = 1.0;

    // ── CONSTITUTIONAL: Domain principles alignment ──
    const constitutional = this.computeConstitutionalScore(domain, request, enrichedContext);

    // ── INTERACTION: How meaningful is this encounter? ──
    const interaction = this.computeInteractionStrength(request, enrichedContext);

    // ── OBSERVATION: Is this being watched/measured? ──
    const observation = this.computeObservationBoost(request, context);

    // ── IMMUNE: Safety system modulation ──
    const immune = await this.immuneCheck(request, context);

    const computed = base * constitutional * interaction * observation;
    const final = computed * immune;

    return {
      base,
      constitutional,
      interaction,
      observation,
      computed,
      immune,
      final,
    };
  }

  /**
   * Compute constitutional alignment score (-1.0 to +1.0)
   * Negative = violates principles → growth suppressed
   */
  private computeConstitutionalScore(
    domain: string,
    request: AsisRequest,
    enrichedContext?: any
  ): number {
    const weights = this.CONSTITUTION[domain] || this.CONSTITUTION['general'];

    // Start with average of all principles
    let score = (
      weights.humanDignity +
      weights.fairness +
      weights.transparency +
      weights.sovereignty +
      weights.nonHarm +
      weights.consent
    ) / 6;

    // Adjust based on request context
    if (request.context.currentApp === 'kernel' || request.context.currentApp === 'auth') {
      score *= 0.1; // Massive suppression for kernel/auth access
    }

    // Adjust based on user consent status
    if (enrichedContext?.profile?.kycStatus === 'unverified') {
      score *= 0.7; // Reduce growth for unverified users
    }

    // High-value transactions get extra constitutional scrutiny
    if (enrichedContext?.wallet?.balance > 100000) {
      score *= 0.9; // Slight dampening for high-balance users
    }

    return Math.max(-1.0, Math.min(1.0, score));
  }

  /**
   * Compute interaction strength (0.0 to 1.0)
   * How deeply do these entities connect?
   */
  private computeInteractionStrength(
    request: AsisRequest,
    enrichedContext?: any
  ): number {
    let strength = 0.5; // Default: moderate interaction

    // User history depth increases interaction strength
    if (request.history.length > 10) strength += 0.2;
    if (request.history.length > 50) strength += 0.15;

    // Domain specificity increases strength
    if (request.domain !== 'general') strength += 0.1;

    // Context richness increases strength
    if (enrichedContext?.wallet) strength += 0.1;
    if (enrichedContext?.profile) strength += 0.1;
    if (enrichedContext?.community) strength += 0.05;

    // Attachments indicate strong intent
    if (request.attachments && request.attachments.length > 0) {
      strength += 0.1 * request.attachments.length;
    }

    return Math.min(1.0, strength);
  }

  /**
   * Compute observation boost (≥ 1.0)
   * Observed interactions grow more — quantum measurement effect
   */
  private computeObservationBoost(
    request: AsisRequest,
    context: AsisContext
  ): number {
    let boost = 1.0; // Unobserved = baseline

    // Real-time session = observed
    if (context.sessionId) boost += 0.2;

    // Explicit user action = strongly observed
    if (request.message.length > 20) boost += 0.1;

    // High-confidence context = well-observed
    if (context.userId && context.userId !== 'anonymous') boost += 0.15;

    // Civic/government actions are always highly observed (audit trail)
    if (['civic', 'health'].includes(request.domain)) boost += 0.2;

    return boost;
  }

  /**
   * IMMUNE SYSTEM: Check for harmful patterns and return suppression factor
   * Returns 0.0 (blocked) to 1.0 (full growth)
   */
  private async immuneCheck(
    request: AsisRequest,
    context: AsisContext
  ): Promise<number> {
    const message = request.message.toLowerCase();
    let immuneFactor = 1.0;

    // Check dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(message)) {
        const isAllowed = this.ALLOWED_PATTERNS.some(a => a.test(message));
        if (!isAllowed) {
          immuneFactor *= 0.0; // Complete suppression (apoptosis)
          break;
        }
      }
    }

    // Message length check (DoS prevention)
    if (request.message.length > 10000) {
      immuneFactor *= 0.1;
    }

    // Special character obfuscation check
    const specialRatio = (request.message.match(/[^\w\s]/g) || []).length / request.message.length;
    if (specialRatio > 0.5 && request.message.length > 100) {
      immuneFactor *= 0.3;
    }

    // Kernel/auth context = maximum suppression
    if (context.currentApp === 'kernel' || context.currentApp === 'auth') {
      immuneFactor *= 0.0;
    }

    return Math.max(0.0, immuneFactor);
  }

  /**
   * Determine what should spawn from this interaction
   * Based on growth factor and domain
   */
  computeSpawnedCapabilities(
    growthFactor: GrowthFactor,
    request: AsisRequest,
    response: any
  ): SpawnedCapability[] {
    const spawned: SpawnedCapability[] = [];
    const f = growthFactor.final;

    // No growth = no spawn
    if (f <= 0) return spawned;

    // High growth (f > 1.5) = spawn insights and workflows
    if (f > 1.5) {
      spawned.push({
        type: 'insight',
        targetModule: request.domain,
        description: `High-growth interaction detected in ${request.domain}`,
        requiresConfirmation: false,
      });
    }

    // Very high growth (f > 2.0) = spawn memory and actions
    if (f > 2.0 && response?.insights) {
      spawned.push({
        type: 'memory',
        targetModule: 'memoryEngine',
        description: 'Store high-value interaction pattern',
        payload: { pattern: response.insights[0], confidence: response.confidence },
        requiresConfirmation: false,
      });
    }

    // Civic domain + high growth = audit trail spawn
    if (request.domain === 'civic' && f > 1.0) {
      spawned.push({
        type: 'alert',
        targetModule: 'audit',
        description: 'Civic interaction logged for transparency',
        requiresConfirmation: false,
      });
    }

    // Wallet domain + growth = notification spawn
    if (request.domain === 'wallet' && f > 1.2) {
      spawned.push({
        type: 'notification',
        targetModule: 'notifications',
        description: 'Wallet intelligence update available',
        requiresConfirmation: false,
      });
    }

    return spawned;
  }

  /**
   * Legacy compatibility: binary safety check
   * Returns true if immune factor > 0 (any growth allowed)
   */
  async isSafe(request: AsisRequest, context: AsisContext): Promise<boolean> {
    const f = await this.computeF(request, context);
    return f.immune > 0 && f.final > 0;
  }
}

export default GrowthCalculator;
