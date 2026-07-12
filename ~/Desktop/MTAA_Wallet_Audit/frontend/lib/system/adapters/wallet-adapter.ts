/**
 * MTAA System Bus — Wallet Adapter
 * Bridges walletEventBus → systemEventBus
 */

import { walletEventBus } from '@/lib/hookup/wallet-bridge/walletEventBus'
import { WALLET_EVENTS } from '@/lib/hookup/wallet-bridge/walletEventTypes'
import { systemEventBus, MTAAEventType } from '../event-bus'

const WALLET_EVENT_MAP: Record<string, MTAAEventType> = {
  [WALLET_EVENTS.WALLET_LOADED]: 'wallet:boot:completed',
  [WALLET_EVENTS.BALANCE_UPDATED]: 'wallet:balance:updated',
  [WALLET_EVENTS.TRANSACTION_CREATED]: 'wallet:transaction:created',
  [WALLET_EVENTS.TRANSACTION_CONFIRMED]: 'wallet:transaction:completed',
  [WALLET_EVENTS.TRANSACTION_FAILED]: 'wallet:transaction:failed',
  [WALLET_EVENTS.MPESA_PENDING]: 'wallet:deposit:pending',
  [WALLET_EVENTS.MPESA_SUCCESS]: 'wallet:deposit:completed',
  [WALLET_EVENTS.MPESA_FAILED]: 'wallet:deposit:failed',
}

class WalletAdapter {
  private active = false
  private walletUnsub?: () => void
  private systemUnsub?: () => void

  activate(): void {
    if (this.active) return
    this.active = true

    // Forward wallet events → system bus
    this.walletUnsub = walletEventBus.on((event) => {
      const systemEvent = WALLET_EVENT_MAP[event.type]
      if (systemEvent) {
        systemEventBus.emit(systemEvent, event.payload, {
          source: 'wallet-adapter',
          userId: event.payload?.userId || event.payload?.user_id,
          priority: event.type.includes('FAILED') ? 'high' : 'normal',
        })
      }
    })

    // Forward system bus wallet events → wallet event bus
    this.systemUnsub = systemEventBus.on('wallet:**', (event) => {
      if (event.source === 'wallet-adapter') return
      const reverseMap = Object.fromEntries(
        Object.entries(WALLET_EVENT_MAP).map(([k, v]) => [v, k])
      )
      const walletEvent = reverseMap[event.type]
      if (walletEvent) walletEventBus.emit(walletEvent as any, event.payload, event.source)
    })

    console.log('[Wallet Adapter] Activated — bridged to System Bus')
  }

  deactivate(): void {
    this.walletUnsub?.()
    this.systemUnsub?.()
    this.active = false
    console.log('[Wallet Adapter] Deactivated')
  }

  get isActive(): boolean { return this.active }
}

export const walletAdapter = new WalletAdapter()
