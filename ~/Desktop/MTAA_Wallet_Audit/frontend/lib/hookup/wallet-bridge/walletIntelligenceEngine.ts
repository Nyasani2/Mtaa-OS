import { supabase } from '@/lib/supabase'

/**
 * MTAA Wallet Intelligence Engine
 * - receipts
 * - transaction state tracking
 * - fraud guard
 * - event normalization
 */

class WalletIntelligenceEngine {
  private processedEvents = new Set<string>()

  /**
   * Normalize and process wallet events
   */
  async handleTransactionEvent(event: any) {
    const tx = event?.new
    if (!tx) return

    // 🛡️ FRAUD / DUPLICATE GUARD
    if (this.processedEvents.has(tx.id)) {
      console.log('⚠️ Duplicate transaction ignored:', tx.id)
      return
    }

    this.processedEvents.add(tx.id)

    // 🔄 STATE NORMALIZATION
    const normalized = this.normalize(tx)

    // 📜 GENERATE RECEIPT
    const receipt = this.generateReceipt(normalized)

    // 📬 SEND TO WALLET INBOX
    await this.pushToInbox(normalized, receipt)

    console.log('💳 Wallet Intelligence processed:', normalized.id)
  }

  /**
   * Standardize transaction states
   */
  normalize(tx: any) {
    return {
      id: tx.id,
      user_id: tx.user_id,
      amount: tx.amount,
      currency: tx.currency || 'KES',
      status: this.mapStatus(tx.status),
      type: tx.type,
      created_at: tx.created_at,
    }
  }

  /**
   * Map backend status → OS state machine
   */
  mapStatus(status: string) {
    switch (status) {
      case 'pending':
      case 'processing':
        return 'PENDING'

      case 'completed':
      case 'success':
        return 'CONFIRMED'

      case 'failed':
      case 'error':
        return 'FAILED'

      default:
        return 'UNKNOWN'
    }
  }

  /**
   * 📜 RECEIPT GENERATION (ledger style)
   */
  generateReceipt(tx: any) {
    return {
      receipt_id: `rcpt_${tx.id}`,
      timestamp: new Date().toISOString(),
      summary: `${tx.type.toUpperCase()} ${tx.amount} ${tx.currency}`,
      status: tx.status,
      hash: this.simpleHash(tx.id + tx.amount + tx.status),
    }
  }

  /**
   * 📬 PUSH INTO WALLET INBOX (Supabase table hook later)
   */
  async pushToInbox(tx: any, receipt: any) {
    try {
      await supabase.from('wallet_inbox').insert({
        user_id: tx.user_id,
        transaction_id: tx.id,
        payload: {
          tx,
          receipt,
        },
      })
    } catch (err) {
      console.log('Inbox push failed (table may not exist yet)')
    }
  }

  /**
   * 🔐 Lightweight integrity hash
   */
  simpleHash(input: string) {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i)
      hash |= 0
    }
    return `h_${Math.abs(hash)}`
  }
}

export const walletIntelligenceEngine = new WalletIntelligenceEngine()
