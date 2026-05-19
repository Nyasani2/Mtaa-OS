/**
 * MTAA OS — Wallet UI Binding Layer
 * ----------------------------------
 * Connects UI screens to:
 * - WalletCoreEngine (actions)
 * - WalletEventBus (reactive updates)
 *
 * This is the ONLY layer UI should talk to.
 */

import { walletCoreEngine } from './walletCoreEngine'
import { walletEventBus } from './walletEventBus'

class WalletUIBridge {
  private listeners: Set<(state: any) => void> = new Set()

  /**
   * 🚀 INIT ENGINE (call once from app layout)
   */
  async init(userId?: string) {
    await walletCoreEngine.start(userId)

    walletEventBus.emit({
      type: 'ENGINE_START',
      userId,
    })
  }

  /**
   * 💸 SEND MONEY (UI → Engine)
   */
  async sendMoney(recipientId: string, amount: number, currency = 'KES') {
    return walletCoreEngine.sendMoney(recipientId, amount, currency)
  }

  /**
   * 📲 M-PESA TOPUP (UI → Engine)
   */
  async topUpMpesa(phone: string, amount: number) {
    return walletCoreEngine.topUpMpesa(phone, amount)
  }

  /**
   * 📡 SUBSCRIBE TO WALLET EVENTS (UI REACTIVE LAYER)
   */
  subscribe(listener: (state: any) => void) {
    this.listeners.add(listener)

    const unsubscribe = walletEventBus.on(async (event) => {
      const payload = {
        event,
        timestamp: Date.now(),
      }

      for (const l of this.listeners) {
        try {
          l(payload)
        } catch (err) {
          console.error('WalletUIBridge listener error:', err)
        }
      }
    })

    return () => {
      this.listeners.delete(listener)
      unsubscribe()
    }
  }

  /**
   * 🔄 QUICK ACTION HELPERS (UI shortcuts)
   */
  actions = {
    deposit: (phone: string, amount: number) =>
      this.topUpMpesa(phone, amount),

    send: (recipientId: string, amount: number) =>
      this.sendMoney(recipientId, amount),

    transfer: (recipientId: string, amount: number) =>
      this.sendMoney(recipientId, amount),

    scan: async () => {
      walletEventBus.emit({
        type: 'ENGINE_START',
      })
    },
  }

  /**
   * 📊 STATUS
   */
  status() {
    return walletCoreEngine.status()
  }
}

export const walletUIBridge = new WalletUIBridge()
