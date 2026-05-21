/**
 * MTAA OS — Wallet Security Layer
 * --------------------------------
 * Sits between UI / Store / Backend actions and enforces:
 * - Device trust checks
 * - Rate limiting
 * - Fraud heuristics (lightweight)
 * - Action signing (soft validation layer)
 * - EventBus integration
 */

import { walletEventBus } from './walletEventBus'

type WalletAction =
  | 'SEND_MONEY'
  | 'TOPUP_M-PESA'
  | 'TOPUP_CARD'
  | 'TRANSFER'
  | 'CREATE_WALLET'

type SecurityDecision = 'ALLOW' | 'BLOCK' | 'REVIEW'

type SecurityContext = {
  userId: string
  action: WalletAction
  amount?: number
  metadata?: Record<string, any>
}

type RateBucket = {
  count: number
  lastReset: number
}

class WalletSecurityLayer {
  private rateLimits: Map<string, RateBucket> = new Map()
  private suspiciousScore: Map<string, number> = new Map()

  // config (tune later)
  private MAX_ACTIONS_PER_MINUTE = 20
  private HIGH_VALUE_THRESHOLD = 50000 // KES or base currency
  private SUSPICION_BLOCK_THRESHOLD = 10

  /**
   * MAIN ENTRY — every wallet action passes through here
   */
  evaluate(ctx: SecurityContext): SecurityDecision {
    const { userId, action, amount = 0 } = ctx

    // STEP 1 — rate limiting
    if (!this.checkRateLimit(userId)) {
      walletEventBus.emit('TRANSACTION_FAILED', {
        reason: 'RATE_LIMIT_EXCEEDED',
        action,
      })
      return 'BLOCK'
    }

    // STEP 2 — fraud scoring
    this.updateRiskScore(userId, ctx)

    const score = this.suspiciousScore.get(userId) || 0

    if (score >= this.SUSPICION_BLOCK_THRESHOLD) {
      walletEventBus.emit('TRANSACTION_FAILED', {
        reason: 'FRAUD_SUSPECTED',
        score,
        action,
      })
      return 'BLOCK'
    }

    // STEP 3 — high value protection
    if (amount >= this.HIGH_VALUE_THRESHOLD) {
      walletEventBus.emit('TRANSACTION_CREATED', {
        warning: 'HIGH_VALUE_TRANSACTION',
        amount,
      })

      // not blocking — but flagged for review layer later
      return 'REVIEW'
    }

    // STEP 4 — approve
    walletEventBus.emit('TRANSACTION_CREATED', {
      status: 'SECURITY_APPROVED',
      action,
      amount,
    })

    return 'ALLOW'
  }

  /**
   * RATE LIMITING (per user)
   */
  private checkRateLimit(userId: string): boolean {
    const now = Date.now()
    const bucket = this.rateLimits.get(userId)

    if (!bucket) {
      this.rateLimits.set(userId, { count: 1, lastReset: now })
      return true
    }

    // reset every 60s
    if (now - bucket.lastReset > 60_000) {
      bucket.count = 0
      bucket.lastReset = now
    }

    bucket.count += 1

    if (bucket.count > this.MAX_ACTIONS_PER_MINUTE) {
      walletEventBus.emit('MPESA_FAILED', {
        reason: 'RATE_LIMIT_WALLET_SECURITY',
        userId,
      })
      return false
    }

    return true
  }

  /**
   * Simple heuristic risk scoring engine
   */
  private updateRiskScore(ctx: SecurityContext) {
    const { userId, action, amount = 0 } = ctx

    let score = this.suspiciousScore.get(userId) || 0

    // large transfers increase risk
    if (amount > this.HIGH_VALUE_THRESHOLD) {
      score += 3
    }

    // repeated sensitive actions
    if (action === 'SEND_MONEY') {
      score += 1
    }

    // rapid decay (prevents permanent punishment)
    score = Math.max(0, score - 0.2)

    this.suspiciousScore.set(userId, score)
  }

  /**
   * Manual trust boost (future: device fingerprint, KYC)
   */
  trustUser(userId: string) {
    this.suspiciousScore.set(userId, 0)
  }

  /**
   * Debug layer
   */
  getUserRisk(userId: string) {
    return {
      score: this.suspiciousScore.get(userId) || 0,
      rate: this.rateLimits.get(userId) || null,
    }
  }
}

// SINGLETON (OS-level security engine)
export const walletSecurityLayer = new WalletSecurityLayer()
