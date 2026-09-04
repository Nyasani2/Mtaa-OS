/**
 * MTAA OS — Wallet Security Engine (Kernel Layer)
 * ------------------------------------------------
 * Protects wallet integrity at runtime:
 * - duplicate transaction prevention
 * - replay attack mitigation
 * - balance sanity checks
 * - request fingerprinting
 */

import { walletEventBus } from './walletEventBus';

class WalletSecurityEngine {
  private processedTx = new Set<string>()
  private requestFingerprints = new Map<string, number>()

  /**
   * 🔐 MAIN GUARD — validate any transaction before execution
   */
  validateTransaction(input: {
    id?: string
    userId?: string
    amount?: number
    type?: string
    currency?: string
  }): boolean {
    if (!input) return false

    // ❌ missing critical data
    if (!input.userId || !input.amount) {
      console.warn('🚨 Invalid transaction payload')
      return false
    }

    // ❌ negative or zero amounts
    if (input.amount <= 0) {
      console.warn('🚨 Invalid amount')
      return false
    }

    return true
  }

  /**
   * 🛑 DUPLICATE TRANSACTION GUARD
   */
  isDuplicate(txId: string): boolean {
    if (!txId) return false

    if (this.processedTx.has(txId)) {
      console.warn('⚠️ Duplicate transaction blocked:', txId)
      return true
    }

    this.processedTx.add(txId)
    return false
  }

  /**
   * 🔁 REPLAY ATTACK PROTECTION
   * Blocks identical payloads sent in short time windows
   */
  checkReplay(payload: any): boolean {
    const fingerprint = this.createFingerprint(payload)
    const now = Date.now()

    const lastSeen = this.requestFingerprints.get(fingerprint)

    // if same request within 3 seconds → block
    if (lastSeen && now - lastSeen < 3000) {
      console.warn('⚠️ Replay attack detected')
      walletEventBus.emit('TRANSACTION_FAILED', {
        payload,
        reason: 'REPLAY_DETECTED',
      })
      return true
    }

    this.requestFingerprints.set(fingerprint, now)
    return false
  }

  /**
   * 🧬 SIMPLE REQUEST FINGERPRINTING
   */
  createFingerprint(payload: any): string {
    const raw = `${payload?.userId}-${payload?.amount}-${payload?.type}-${payload?.currency}`

    let hash = 0
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i)
      hash |= 0
    }

    return `fp_${Math.abs(hash)}`
  }

  /**
   * 💰 BASIC BALANCE SANITY CHECK
   * (prevents obvious client-side manipulation patterns)
   */
  sanityCheckBalance(balance: number): boolean {
    if (balance < 0) {
      console.warn('🚨 Negative balance detected')
      return false
    }

    if (balance > 1e9) {
      console.warn('🚨 Suspiciously large balance detected')
      return false
    }

    return true
  }

  /**
   * 🧠 FULL PIPELINE GUARD
   */
  guardTransaction(input: any): boolean {
    if (!this.validateTransaction(input)) return false
    if (input.id && this.isDuplicate(input.id)) return false
    if (this.checkReplay(input)) return false

    return true
  }

  /**
   * 🧹 RESET (optional system reset / logout)
   */
  reset() {
    this.processedTx.clear()
    this.requestFingerprints.clear()
  }
}

export const walletSecurityEngine = new WalletSecurityEngine()

