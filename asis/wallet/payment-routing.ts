/**
 * ASIS Layer 5 — Payment Routing Abstraction
 * Future-ready architecture for all payment methods
 * NO real integrations yet — interfaces and orchestration only
 */

import {
  PaymentMethod,
  Currency,
  Transfer,
  FeeEstimate,
  TransferStatus,
} from './types';
import { IPaymentRouteProvider } from './interfaces';

export class PaymentRouter {
  private providers: Map<PaymentMethod, IPaymentRouteProvider> = new Map();
  private fallbackOrder: PaymentMethod[] = [
    PaymentMethod.MTAA_WALLET,
    PaymentMethod.MOBILE_MONEY,
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.CASH_POINT,
    PaymentMethod.CROSS_BORDER,
  ];

  /**
   * Register a payment provider
   */
  registerProvider(method: PaymentMethod, provider: IPaymentRouteProvider): void {
    this.providers.set(method, provider);
  }

  /**
   * Find best route for a transfer
   */
  async findBestRoute(
    transfer: Omit<Transfer, 'id' | 'status'>,
    preferences?: { preferSpeed?: boolean; preferLowFee?: boolean; requireInstant?: boolean }
  ): Promise<{ method: PaymentMethod; provider: IPaymentRouteProvider; reason: string; fees: FeeEstimate; estimatedTime: Date }> {
    const candidates: Array<{
      method: PaymentMethod;
      provider: IPaymentRouteProvider;
      canRoute: boolean;
      fees: FeeEstimate;
      time: Date;
      score: number;
    }> = [];

    for (const method of this.fallbackOrder) {
      const provider = this.providers.get(method);
      if (!provider) continue;

      const canRoute = await provider.canRoute(transfer);
      const fees = await provider.estimateFees(transfer);
      const time = await provider.estimateCompletion(transfer);
      const health = await provider.health();

      let score = 0;

      // Speed preference
      if (preferences?.preferSpeed) {
        const minutes = (time.getTime() - Date.now()) / 60000;
        score += Math.max(0, 100 - minutes);
      }

      // Low fee preference
      if (preferences?.preferLowFee) {
        score += Math.max(0, 100 - fees.totalFee);
      }

      // Instant requirement
      if (preferences?.requireInstant && (time.getTime() - Date.now()) > 60000) {
        score = -1000; // Disqualify
      }

      // Provider availability bonus
      if (health.available) score += 50;

      // MTAA wallet bonus (free, instant)
      if (method === PaymentMethod.MTAA_WALLET) score += 100;

      candidates.push({ method, provider, canRoute, fees, time, score });
    }

    // Sort by score
    candidates.sort((a, b) => b.score - a.score);

    const best = candidates[0];
    if (!best || !best.canRoute) {
      throw new PaymentRouteError('No available payment route for this transfer');
    }

    const reasons: Record<PaymentMethod, string> = {
      mtaa_wallet: 'Instant and free between MTAA wallets',
      bank_transfer: 'Secure bank transfer, 1-2 hours',
      mobile_money: 'Direct to phone, recipient doesn't need MTAA',
      cash_point: 'Withdraw cash at nearby agent',
      cross_border: 'Cross-border transfer with FX conversion',
    };

    return {
      method: best.method,
      provider: best.provider,
      reason: reasons[best.method] || 'Available payment route',
      fees: best.fees,
      estimatedTime: best.time,
    };
  }

  /**
   * Get all available routes with comparison
   */
  async compareRoutes(transfer: Omit<Transfer, 'id' | 'status'>): Promise<
    Array<{
      method: PaymentMethod;
      available: boolean;
      fees: FeeEstimate;
      estimatedTime: Date;
      reason: string;
    }>
  > {
    const comparisons = [];

    for (const method of this.fallbackOrder) {
      const provider = this.providers.get(method);
      if (!provider) {
        comparisons.push({
          method,
          available: false,
          fees: this.placeholderFeeEstimate(),
          estimatedTime: new Date(),
          reason: 'Provider not configured',
        });
        continue;
      }

      try {
        const canRoute = await provider.canRoute(transfer);
        const fees = await provider.estimateFees(transfer);
        const time = await provider.estimateCompletion(transfer);

        comparisons.push({
          method,
          available: canRoute,
          fees,
          estimatedTime: time,
          reason: canRoute ? 'Available' : 'Not available for this transfer',
        });
      } catch {
        comparisons.push({
          method,
          available: false,
          fees: this.placeholderFeeEstimate(),
          estimatedTime: new Date(),
          reason: 'Provider error',
        });
      }
    }

    return comparisons;
  }

  /**
   * Execute via specific provider
   */
  async executeWithProvider(
    method: PaymentMethod,
    transfer: Transfer
  ): Promise<{ success: boolean; reference?: string; error?: string }> {
    const provider = this.providers.get(method);
    if (!provider) {
      return { success: false, error: `No provider registered for ${method}` };
    }

    return provider.execute(transfer);
  }

  private placeholderFeeEstimate(): FeeEstimate {
    return {
      baseFee: 0,
      percentageFee: 0,
      minimumFee: 0,
      maximumFee: 0,
      fxSpread: 0,
      totalFee: 0,
      totalAmount: 0,
      breakdown: {},
    };
  }
}

export class PaymentRouteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentRouteError';
  }
}
