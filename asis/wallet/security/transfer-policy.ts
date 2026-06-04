/**
 * ASIS Wallet Security — Transfer Policy
 * Defines limits, allowed methods, currencies for all transfers
 */

import { PaymentMethod } from '../types'

export class TransferPolicy {
  minAmount = 10
  maxAmount = 10000000
  allowedMethods: PaymentMethod[] = [
    PaymentMethod.MTAA_WALLET,
    PaymentMethod.MPESA,
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.CARD,
  ]
  allowedCurrencies: string[] = ['KES', 'USD', 'EUR', 'GBP', 'UGX', 'TZS', 'RWF']
  requireKyc = 1
  dailyLimit = 500000
  monthlyLimit = 10000000

  /**
   * Check if transfer is within policy limits
   */
  checkLimits(amount: number, dailyUsed: number, monthlyUsed: number): { allowed: boolean; reason?: string } {
    if (amount < this.minAmount) return { allowed: false, reason: `Minimum amount is ${this.minAmount}` }
    if (amount > this.maxAmount) return { allowed: false, reason: `Maximum amount is ${this.maxAmount}` }
    if (dailyUsed + amount > this.dailyLimit) return { allowed: false, reason: 'Daily limit exceeded' }
    if (monthlyUsed + amount > this.monthlyLimit) return { allowed: false, reason: 'Monthly limit exceeded' }
    return { allowed: true }
  }

  /**
   * Check if method is allowed
   */
  isMethodAllowed(method: PaymentMethod): boolean {
    return this.allowedMethods.includes(method)
  }

  /**
   * Check if currency is supported
   */
  isCurrencySupported(currency: string): boolean {
    return this.allowedCurrencies.includes(currency)
  }
}
