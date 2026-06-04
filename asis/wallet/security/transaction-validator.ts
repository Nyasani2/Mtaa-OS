/**
 * ASIS Wallet Security — Transaction Validator
 * Stub implementation. Replace with real validation logic when ready.
 */

import { Transfer } from '../types'
import { ITransactionValidator } from '../interfaces'

export class TransactionValidator implements ITransactionValidator {
  async validate(transfer: Transfer): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = []
    const warnings: string[] = []

    if (!transfer.senderId) errors.push('Missing sender')
    if (!transfer.amount || transfer.amount <= 0) errors.push('Invalid amount')
    if (!transfer.currency) errors.push('Missing currency')
    if (transfer.amount > 1000000) warnings.push('Large amount transfer')

    return { valid: errors.length === 0, errors, warnings }
  }

  validateAmount(amount: number, currency: string): { valid: boolean; error?: string } {
    if (amount <= 0) return { valid: false, error: 'Amount must be positive' }
    if (amount > 10000000) return { valid: false, error: 'Amount exceeds maximum' }
    return { valid: true }
  }

  async validateKyc(userId: string, requiredLevel: number): Promise<{ valid: boolean; currentLevel: number }> {
    // TODO: Wire to actual KYC service
    return { valid: true, currentLevel: 2 }
  }
}
