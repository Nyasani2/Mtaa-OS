/**
 * ASIS Layer 5 — Wallet Assistant
 * AI-assisted financial guidance
 * Speaks naturally, remains concise, prioritizes clarity
 */

import { Currency, PaymentMethod, Transfer, TransferPreview, FXRate, FeeEstimate, CashPoint, WalletContext } from './types';
import { IWalletIntelligence } from './interfaces';

export class WalletAssistant implements IWalletIntelligence {
  private language: string = 'en';

  setLanguage(lang: string): void {
    this.language = lang;
  }

  /**
   * Explain a wallet action in natural, calm language
   */
  async explainAction(action: string, params: Record<string, unknown>): Promise<string> {
    const explanations: Record<string, (p: Record<string, unknown>) => string> = {
      'transfer_initiated': (p) => {
        const amount = p.amount as number;
        const currency = p.currency as string;
        const recipient = p.recipient as string;
        return `You're sending ${this.formatMoney(amount, currency)} to ${recipient}. The money will leave your wallet immediately. ${recipient} will receive a notification to claim it.`;
      },
      'transfer_claimable': (p) => {
        const amount = p.amount as number;
        const currency = p.currency as string;
        return `${this.formatMoney(amount, currency)} is waiting for the recipient. They'll get a link to install MTAA and claim it. The link expires in 7 days.`;
      },
      'fee_explanation': (p) => {
        const fee = p.fee as number;
        const method = p.method as string;
        return `This transfer has a ${this.formatMoney(fee, p.currency as string)} fee. ${this.methodFeeReason(method)}`;
      },
      'fx_explanation': (p) => {
        const from = p.from as string;
        const to = p.to as string;
        const rate = p.rate as number;
        return `Converting from ${from} to ${to} at approximately ${rate.toFixed(4)}. This rate includes a small spread for network costs.`;
      },
      'withdrawal_options': (p) => {
        const currency = p.currency as string;
        return `You can withdraw ${currency} to your bank, mobile money, or a nearby cash point. Cash points are usually fastest.`;
      },
      'cash_point_guide': (p) => {
        const name = p.name as string;
        const distance = p.distance as number;
        return `${name} is about ${distance.toFixed(1)} km away. Bring your ID and the withdrawal code. They're open now.`;
      },
      'pin_setup': (p) => {
        return `Your PIN protects your wallet. Choose 4 digits you'll remember. Don't use your birthday.`;
      },
      'security_basics': (p) => {
        return `Your money is held securely. Only you can access it with your PIN. We never ask for your PIN outside the app.`;
      },
      'claim_process': (p) => {
        const sender = p.sender as string;
        const amount = p.amount as number;
        const currency = p.currency as string;
        return `${sender} sent you ${this.formatMoney(amount, currency)}. Tap "Claim" to add it to your wallet. It's already yours — just needs to land here.`;
      },
      'kyc_limit': (p) => {
        const limit = p.limit as number;
        const currency = p.currency as string;
        return `To send more than ${this.formatMoney(limit, currency)}, we'll need to verify your ID. This keeps everyone safe.`;
      },
    };

    const explainer = explanations[action];
    if (explainer) {
      return explainer(params);
    }

    return `I'll help you with that. What would you like to know?`;
  }

  /**
   * Suggest optimal payment method with reasoning
   */
  async suggestMethod(transfer: Omit<Transfer, 'id' | 'status'>): Promise<{ method: PaymentMethod; reason: string }> {
    const { amount, currency, recipientPhone, recipientId } = transfer;

    // If recipient has MTAA wallet → instant, free
    if (recipientId) {
      return {
        method: PaymentMethod.MTAA_WALLET,
        reason: 'Instant transfer between MTAA wallets. No fees.',
      };
    }

    // If recipient has phone → mobile money
    if (recipientPhone) {
      return {
        method: PaymentMethod.MOBILE_MONEY,
        reason: `Direct to their phone. They don't need MTAA.`,
      };
    }

    // Large amount → bank for security
    if (amount > 50000) {
      return {
        method: PaymentMethod.BANK_TRANSFER,
        reason: 'Bank transfer for large amounts. More secure, takes 1-2 hours.',
      };
    }

    // Default → claimable link (viral growth)
    return {
      method: PaymentMethod.MTAA_WALLET,
      reason: 'Send a claim link. They install MTAA and get the money instantly.',
    };
  }

  /**
   * Detect unusual patterns and warn
   */
  async detectAnomaly(userId: string, action: string): Promise<{ anomaly: boolean; warning?: string; suggestion?: string }> {
    // Scaffold — will integrate with fraud monitor
    const anomalies: Record<string, { warning: string; suggestion: string }> = {
      'large_transfer': {
        warning: 'This is larger than your usual transfers.',
        suggestion: 'Double-check the amount and recipient before confirming.',
      },
      'new_recipient': {
        warning: `You haven't sent to this person before.`,
        suggestion: 'Verify their phone number is correct.',
      },
      'late_night': {
        warning: `It's late. Are you sure about this transfer?`,
        suggestion: 'You can schedule it for tomorrow if you prefer.',
      },
      'rapid_transfers': {
        warning: `You've made several transfers quickly.`,
        suggestion: 'Take a moment to review each one.',
      },
    };

    const detected = anomalies[action];
    if (detected) {
      return { anomaly: true, ...detected };
    }

    return { anomaly: false };
  }

  /**
   * Guide user through complex flow
   */
  async guideFlow(flow: string, step: number, context: Record<string, unknown>): Promise<{ message: string; nextStep: number; done: boolean }> {
    const flows: Record<string, Array<(ctx: Record<string, unknown>) => string>> = {
      'first_transfer': [
        (ctx) => `Let's send money. First, who are you sending to?`,
        (ctx) => `How much? You have ${this.formatMoney(ctx.balance as number, ctx.currency as string)} available.`,
        (ctx) => `Great. Here's what will happen: ${ctx.recipient} gets ${this.formatMoney(ctx.amount as number, ctx.currency as string)}. Fee: ${this.formatMoney(ctx.fee as number, ctx.currency as string)}.`,
        (ctx) => `Enter your PIN to confirm.`,
        (ctx) => `Done! ${ctx.recipient} will get a notification.`,
      ],
      'claim_funds': [
        (ctx) => `You have money waiting! ${ctx.sender} sent ${this.formatMoney(ctx.amount as number, ctx.currency as string)}.`,
        (ctx) => `Tap "Claim" and the money moves to your wallet.`,
        (ctx) => `Perfect. ${this.formatMoney(ctx.amount as number, ctx.currency as string)} is now in your wallet.`,
      ],
      'withdraw_cash': [
        (ctx) => `Let's get cash. How much?`,
        (ctx) => `Here are nearby cash points. ${ctx.cashPoints?.length || 0} options.`,
        (ctx) => `Choose one and I'll generate a withdrawal code.`,
        (ctx) => `Show this code at ${ctx.cashPointName}. It expires in 30 minutes.`,
      ],
    };

    const flowSteps = flows[flow];
    if (!flowSteps || step >= flowSteps.length) {
      return { message: 'All done!', nextStep: step, done: true };
    }

    return {
      message: flowSteps[step](context),
      nextStep: step + 1,
      done: step + 1 >= flowSteps.length,
    };
  }

  private formatMoney(amount: number, currency: string): string {
    const symbols: Record<string, string> = {
      KES: 'KSh', UGX: 'USh', TZS: 'TSh', RWF: 'RF', NGN: '₦',
      GHS: 'GH₵', ZAR: 'R', USD: '$', EUR: '€', GBP: '£',
    };
    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toLocaleString()}`;
  }

  private methodFeeReason(method: string): string {
    const reasons: Record<string, string> = {
      mtaa_wallet: 'MTAA to MTAA transfers are free.',
      bank_transfer: 'Banks charge a small fee for transfers.',
      mobile_money: 'Mobile money networks charge a convenience fee.',
      cash_point: 'Cash points charge a small fee for withdrawal.',
      cross_border: 'Cross-border transfers include network and FX fees.',
    };
    return reasons[method] || 'A small fee applies for this transfer method.';
  }
}
