/**
 * ASIS Layer 5 — Transfer Policy
 * KYC-aware limits, confirmation gates, audit logging
 */

import { TransferPolicy, PaymentMethod, Currency, Transfer } from '../types';

export class TransferPolicyEngine {
  private policies: Map<number, TransferPolicy> = new Map(); // kycLevel -> policy

  constructor() {
    // Default policies by KYC level
    this.policies.set(0, {
      minAmount: 10,
      maxAmount: 5000,
      dailyLimit: 10000,
      monthlyLimit: 50000,
      requireConfirmation: true,
      requirePin: true,
      requireBiometric: false,
      requireKyc: 0,
      allowedMethods: [PaymentMethod.MTAA_WALLET, PaymentMethod.MOBILE_MONEY],
      allowedCurrencies: [Currency.KES, Currency.UGX, Currency.TZS],
      coolingOffMinutes: 0,
    });

    this.policies.set(1, {
      minAmount: 10,
      maxAmount: 50000,
      dailyLimit: 100000,
      monthlyLimit: 500000,
      requireConfirmation: true,
      requirePin: true,
      requireBiometric: false,
      requireKyc: 1,
      allowedMethods: [PaymentMethod.MTAA_WALLET, PaymentMethod.MOBILE_MONEY, PaymentMethod.BANK_TRANSFER],
      allowedCurrencies: [Currency.KES, Currency.UGX, Currency.TZS, Currency.RWF, Currency.NGN],
      coolingOffMinutes: 0,
    });

    this.policies.set(2, {
      minAmount: 10,
      maxAmount: 500000,
      dailyLimit: 1000000,
      monthlyLimit: 5000000,
      requireConfirmation: true,
      requirePin: true,
      requireBiometric: true,
      requireKyc: 2,
      allowedMethods: Object.values(PaymentMethod),
      allowedCurrencies: Object.values(Currency),
      coolingOffMinutes: 0,
    });
  }

  /**
   * Get policy for KYC level
   */
  getPolicy(kycLevel: number): TransferPolicy {
    return this.policies.get(kycLevel) || this.policies.get(0)!;
  }

  /**
   * Check if transfer is allowed
   */
  checkTransfer(kycLevel: number, transfer: Omit<Transfer, 'id' | 'status'>): { allowed: boolean; reason?: string } {
    const policy = this.getPolicy(kycLevel);

    if (transfer.amount < policy.minAmount) {
      return { allowed: false, reason: `Minimum amount is ${policy.minAmount}` };
    }
    if (transfer.amount > policy.maxAmount) {
      return { allowed: false, reason: `Maximum amount for your KYC level is ${policy.maxAmount}` };
    }
    if (!policy.allowedMethods.includes(transfer.method)) {
      return { allowed: false, reason: `Payment method not allowed at KYC level ${kycLevel}` };
    }
    if (!policy.allowedCurrencies.includes(transfer.currency)) {
      return { allowed: false, reason: `Currency not supported at KYC level ${kycLevel}` };
    }

    return { allowed: true };
  }

  /**
   * Get required confirmations
   */
  getRequiredConfirmations(kycLevel: number, amount: number): {
    pin: boolean;
    biometric: boolean;
    confirmation: boolean;
  } {
    const policy = this.getPolicy(kycLevel);
    return {
      pin: policy.requirePin || amount > 5000,
      biometric: policy.requireBiometric || amount > 50000,
      confirmation: policy.requireConfirmation || amount > 1000,
    };
  }
}
