/**
 * ASIS Layer 5 — FX Engine (Abstraction Only)
 * Rate interfaces, conversion estimation, fee estimation
 * NO live FX APIs — estimation and architecture only
 */

import { Currency, FXRate, FeeEstimate } from './types';
import { IFXProvider } from './interfaces';

export interface FXConfig {
  defaultSpread: number;
  estimationMode: boolean;
  cacheMinutes: number;
}

export class FXEngine {
  private providers: IFXProvider[] = [];
  private rateCache: Map<string, { rate: FXRate; cachedAt: Date }> = new Map();
  private config: FXConfig;

  constructor(config: Partial<FXConfig> = {}) {
    this.config = {
      defaultSpread: 0.02,
      estimationMode: true,
      cacheMinutes: 5,
      ...config,
    };
  }

  registerProvider(provider: IFXProvider): void {
    this.providers.push(provider);
  }

  /**
   * Get FX rate with estimation fallback
   */
  async getRate(from: Currency, to: Currency): Promise<FXRate> {
    const cacheKey = `${from}_${to}`;
    const cached = this.rateCache.get(cacheKey);

    if (cached && !this.isExpired(cached.cachedAt)) {
      return cached.rate;
    }

    // Try providers
    for (const provider of this.providers) {
      try {
        const health = await provider.health();
        if (!health.available) continue;

        const rate = await provider.getRate(from, to);
        this.rateCache.set(cacheKey, { rate, cachedAt: new Date() });
        return rate;
      } catch {
        continue;
      }
    }

    // Fallback: estimation
    const estimatedRate = this.estimateRate(from, to);
    const rate: FXRate = {
      from,
      to,
      rate: estimatedRate,
      inverseRate: 1 / estimatedRate,
      spread: this.config.defaultSpread,
      provider: 'estimated',
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 300000),
      estimated: true,
    };

    this.rateCache.set(cacheKey, { rate, cachedAt: new Date() });
    return rate;
  }

  /**
   * Convert amount with fee estimation
   */
  async convert(
    amount: number,
    from: Currency,
    to: Currency
  ): Promise<{
    convertedAmount: number;
    rate: FXRate;
    fees: FeeEstimate;
    totalReceived: number;
  }> {
    const rate = await this.getRate(from, to);
    const convertedAmount = amount * rate.rate;
    const spreadCost = convertedAmount * rate.spread;
    const totalReceived = convertedAmount - spreadCost;

    const fees: FeeEstimate = {
      baseFee: 0,
      percentageFee: 0,
      minimumFee: 0,
      maximumFee: 0,
      fxSpread: spreadCost,
      totalFee: spreadCost,
      totalAmount: amount,
      breakdown: { fx_spread: spreadCost },
    };

    return { convertedAmount, rate, fees, totalReceived };
  }

  /**
   * Get rate history for trend analysis
   */
  async getRateHistory(from: Currency, to: Currency, days: number = 7): Promise<FXRate[]> {
    for (const provider of this.providers) {
      try {
        const health = await provider.health();
        if (health.available) {
          return await provider.getRateHistory(from, to, days);
        }
      } catch {
        continue;
      }
    }

    // Generate synthetic history
    const baseRate = this.estimateRate(from, to);
    const history: FXRate[] = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
      const rate = baseRate * (1 + variation);

      history.push({
        from,
        to,
        rate,
        inverseRate: 1 / rate,
        spread: this.config.defaultSpread,
        provider: 'estimated',
        timestamp: date,
        expiresAt: new Date(date.getTime() + 86400000),
        estimated: true,
      });
    }

    return history;
  }

  /**
   * Explain FX to user
   */
  explainFX(from: Currency, to: Currency, amount: number, rate: FXRate): string {
    const converted = amount * rate.rate;
    const spreadCost = converted * rate.spread;

    if (rate.estimated) {
      return `Converting ${from} to ${to}: approximately ${rate.rate.toFixed(4)}. ` +
        `You'll get about ${converted.toFixed(2)} ${to} (estimated). ` +
        `A small spread of ${spreadCost.toFixed(2)} ${to} covers network costs.`;
    }

    return `Converting ${from} to ${to} at ${rate.rate.toFixed(4)}. ` +
      `You'll receive ${converted.toFixed(2)} ${to}. ` +
      `Spread: ${spreadCost.toFixed(2)} ${to}.`;
  }

  private estimateRate(from: Currency, to: Currency): number {
    // Estimated rates for African currencies (approximate)
    const rates: Record<string, number> = {
      'KES_UGX': 28.5,
      'KES_TZS': 18.2,
      'KES_RWF': 9.8,
      'KES_NGN': 11.5,
      'KES_GHS': 0.095,
      'KES_ZAR': 0.13,
      'KES_USD': 0.0077,
      'KES_EUR': 0.0071,
      'KES_GBP': 0.0061,
      'UGX_KES': 0.035,
      'TZS_KES': 0.055,
      'NGN_KES': 0.087,
      'GHS_KES': 10.5,
      'ZAR_KES': 7.7,
      'USD_KES': 130,
      'EUR_KES': 141,
      'GBP_KES': 164,
    };

    const pair = `${from}_${to}`;
    if (rates[pair]) return rates[pair];

    // Cross-rate via USD
    const fromUSD = rates[`${from}_USD`] || 1 / (rates[`USD_${from}`] || 1);
    const toUSD = rates[`${to}_USD`] || 1 / (rates[`USD_${to}`] || 1);

    if (fromUSD && toUSD) {
      return fromUSD / toUSD;
    }

    return 1.0; // Same currency or unknown
  }

  private isExpired(cachedAt: Date): boolean {
    return Date.now() - cachedAt.getTime() > this.config.cacheMinutes * 60000;
  }
}