/**
 * ASIS Layer 5 — Conversational Onboarding
 * Human, calm, guided — NOT overwhelming fintech wizard
 */

import { OnboardingStep, WalletContext } from './types';
import { WalletAssistant } from './wallet-assistant';

export class ConversationalOnboarding {
  private assistant: WalletAssistant;

  constructor(assistant: WalletAssistant) {
    this.assistant = assistant;
  }

  /**
   * Get onboarding flow for new user
   */
  async getOnboardingFlow(userId: string, context?: Record<string, unknown>): Promise<OnboardingStep[]> {
    const isClaimContext = context?.claimAmount !== undefined;
    const senderName = context?.senderName as string;
    const claimAmount = context?.claimAmount as number;
    const currency = context?.currency as string;

    const steps: OnboardingStep[] = [
      {
        id: 'welcome',
        title: isClaimContext ? 'You have money waiting!' : 'Welcome to MTAA',
        description: isClaimContext
          ? `${senderName} sent you ${this.formatMoney(claimAmount, currency)}. Let's get you set up to claim it.`
          : `Welcome! I'm ASIS, your guide. Let's set up your wallet in a few simple steps.`,
        action: 'show_welcome',
        completed: false,
        skippable: false,
        context: { senderName, claimAmount, currency },
      },
      {
        id: 'pin_setup',
        title: 'Create your PIN',
        description: await this.assistant.explainAction('pin_setup', {}),
        action: 'setup_pin',
        completed: false,
        skippable: false,
      },
      {
        id: 'security_basics',
        title: 'How your money stays safe',
        description: await this.assistant.explainAction('security_basics', {}),
        action: 'show_security',
        completed: false,
        skippable: true,
      },
      {
        id: 'profile_setup',
        title: 'Your profile',
        description: 'Add your name so people know who sent them money.',
        action: 'setup_profile',
        completed: false,
        skippable: true,
      },
      {
        id: 'claim_money',
        title: 'Claim your money',
        description: isClaimContext
          ? await this.assistant.explainAction('claim_process', { sender: senderName, amount: claimAmount, currency })
          : 'Your wallet is ready! You can now send and receive money.',
        action: 'claim_funds',
        completed: false,
        skippable: false,
        context: { senderName, claimAmount, currency },
      },
      {
        id: 'first_transfer_guide',
        title: 'Try sending money',
        description: 'Send a small amount to a friend to see how easy it is.',
        action: 'guide_first_transfer',
        completed: false,
        skippable: true,
      },
      {
        id: 'withdrawal_options',
        title: 'Getting cash out',
        description: await this.assistant.explainAction('withdrawal_options', { currency: currency || 'KES' }),
        action: 'show_withdrawal_options',
        completed: false,
        skippable: true,
      },
    ];

    // If not claim context, remove claim-specific step
    if (!isClaimContext) {
      steps.splice(4, 1); // Remove claim_money step
    }

    return steps;
  }

  /**
   * Get onboarding flow for claim link recipient
   */
  async getClaimOnboarding(claim: { senderName: string; amount: number; currency: string }): Promise<OnboardingStep[]> {
    return this.getOnboardingFlow('claim_user', {
      senderName: claim.senderName,
      claimAmount: claim.amount,
      currency: claim.currency,
    });
  }

  /**
   * Get progress
   */
  getProgress(steps: OnboardingStep[]): { completed: number; total: number; percentage: number } {
    const completed = steps.filter(s => s.completed).length;
    return {
      completed,
      total: steps.length,
      percentage: Math.round((completed / steps.length) * 100),
    };
  }

  /**
   * Mark step complete
   */
  completeStep(steps: OnboardingStep[], stepId: string): OnboardingStep[] {
    return steps.map(s => s.id === stepId ? { ...s, completed: true } : s);
  }

  /**
   * Skip step
   */
  skipStep(steps: OnboardingStep[], stepId: string): OnboardingStep[] {
    return steps.map(s => s.id === stepId && s.skippable ? { ...s, completed: true } : s);
  }

  private formatMoney(amount: number, currency: string): string {
    const symbols: Record<string, string> = {
      KES: 'KSh', UGX: 'USh', TZS: 'TSh', RWF: 'RF', NGN: '₦',
      GHS: 'GH₵', ZAR: 'R', USD: '$', EUR: '€', GBP: '£',
    };
    return `${symbols[currency] || currency}${amount.toLocaleString()}`;
  }
}