// ============================================================
// PRIORITIZATION RULES — Urgent health > wallet > transport > general
// Domain priority + urgency weighting
// ============================================================

import { ResolvedIntent, Domain, UrgencyLevel } from '../types';

export class PrioritizationRules {
  private domainPriority: Record<Domain, number> = {
    health: 100,
    wallet: 80,
    cash: 70,
    transport: 60,
    civic: 50,
    education: 40,
    marketplace: 30,
    system: 20,
    general: 10,
  };

  private urgencyWeight: Record<UrgencyLevel, number> = {
    critical: 5.0,
    high: 3.0,
    medium: 1.5,
    low: 1.0,
    background: 0.5,
  };

  calculatePriority(intent: ResolvedIntent): number {
    const domainScore = this.domainPriority[intent.primaryIntent.domain] || 10;
    const urgencyScore = this.urgencyWeight[this.inferUrgency(intent)] || 1;
    const confidenceBoost = intent.confidence === 'certain' ? 1.2 : intent.confidence === 'high' ? 1.1 : 1.0;

    return domainScore * urgencyScore * confidenceBoost;
  }

  getSafetyLevel(intent: ResolvedIntent): string {
    const domain = intent.primaryIntent.domain;
    const action = intent.primaryIntent.name;

    // High-risk actions
    const highRisk = ['send_payment', 'delete_account', 'purge_data', 'emergency_access', 'redeem_points'];
    if (highRisk.includes(action)) return 'danger';

    // Sensitive domains
    if (['wallet', 'health', 'cash'].includes(domain)) return 'caution';

    return 'safe';
  }

  shouldInterruptCurrent(currentPriority: number, newPriority: number): boolean {
    // New request can interrupt if priority is 2x higher
    return newPriority > currentPriority * 2;
  }

  private inferUrgency(intent: ResolvedIntent): UrgencyLevel {
    // Infer from intent name and parameters
    const action = intent.primaryIntent.name;
    if (action.includes('emergency')) return 'critical';
    if (action.includes('urgent') || action.includes('now')) return 'high';
    if (action.includes('schedule') || action.includes('book')) return 'medium';
    return 'low';
  }
}
