/**
 * MTAA OS — Event Bus Core (Wallet + System Runtime)
 * --------------------------------------------------
 * Single-source reactive event system for:
 * - Wallet engine
 * - UI updates
 * - Cross-app OS communication
 */

type WalletEventType =
  | 'WALLET_LOADED'
  | 'BALANCE_UPDATED'
  | 'TRANSACTION_CREATED'
  | 'TRANSACTION_CONFIRMED'
  | 'TRANSACTION_FAILED'
  | 'MPESA_PENDING'
  | 'MPESA_SUCCESS'
  | 'MPESA_FAILED'
  | 'SYSTEM_BOOT'
  | 'SYSTEM_READY'

export type WalletEvent = {
  type: WalletEventType
  payload?: any
  timestamp: number
  source?: string
}

type Listener = (event: WalletEvent) => void

class WalletEventBus {
  private listeners: Set<Listener> = new Set()
  private eventHistory: WalletEvent[] = []

  /**
   * Subscribe to system events
   */
  on(listener: Listener) {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Emit event to all subscribers
   */
  emit(type: WalletEventType, payload?: any, source = 'system') {
    const event: WalletEvent = {
      type,
      payload,
      timestamp: Date.now(),
      source,
    }

    // store lightweight history (debug + replay potential)
    this.eventHistory.push(event)

    // keep memory bounded
    if (this.eventHistory.length > 200) {
      this.eventHistory.shift()
    }

    // broadcast
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (err) {
        console.error('WalletEventBus listener error:', err)
      }
    }
  }

  /**
   * Get recent events (debug / audit layer)
   */
  getHistory(limit = 50) {
    return this.eventHistory.slice(-limit)
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = []
  }
}

// SINGLETON (OS-level bus)
export const walletEventBus = new WalletEventBus()

