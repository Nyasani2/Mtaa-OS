/**
 * MTAA OS — Wallet Core Engine (REALTIME EDITION)
 * -----------------------------------------------
 * Event-driven wallet system:
 * - Supabase Realtime subscriptions
 * - No polling
 * - Instant UI updates
 */

import { supabase } from '@/lib/supabase'
import { walletEventBus } from './walletEventBus'

type WalletUserId = string

class WalletCoreEngine {
  private running = false
  private userId: WalletUserId | null = null
  private channels: any[] = []

  getEventBus() {
    return walletEventBus
  }

  /**
   * BOOT WALLET SYSTEM
   */
  async start(userId: WalletUserId) {
    if (this.running && this.userId === userId) return

    if (this.running) {
      this.stop()
    }

    this.running = true
    this.userId = userId

    walletEventBus.emit('WALLET_LOADED', { userId })

    // initial sync (safe bootstrap)
    await this.sync()

    // start realtime listeners
    this.subscribeRealtime()
  }

  /**
   * REALTIME SUBSCRIPTIONS (NO POLLING)
   */
  subscribeRealtime() {
    if (!this.userId) return

    // CLEAN EXISTING CHANNELS FIRST
    this.channels.forEach((c) =>
      supabase.removeChannel(c)
    )
    this.channels = []

    const channel = supabase
      .channel('wallet-realtime-engine')

      // WALLET EVENTS STREAM (MAIN SOURCE OF TRUTH)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_events',
        },
        (payload) => {
          const event = payload.new as any

          walletEventBus.emit(
            event.type,
            event.payload
          )
        }
      )

      // BALANCE UPDATES STREAM
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          walletEventBus.emit(
            'BALANCE_UPDATED',
            {
              balance: payload.new.balance,
            }
          )
        }
      )

      .subscribe()

    this.channels.push(channel)
  }

  /**
   * BOOTSTRAP SYNC (ONLY ON START)
   */
  async sync() {
    if (!this.userId) return

    const { data: wallets } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', this.userId)

    const balance = (wallets || []).reduce(
      (sum: number, w: any) =>
        sum + (w.balance || 0),
      0
    )

    walletEventBus.emit('BALANCE_UPDATED', {
      balance,
    })
  }

  /**
   * STOP ENGINE
   */
  stop() {
    this.running = false
    this.userId = null

    this.channels.forEach((c) =>
      supabase.removeChannel(c)
    )

    this.channels = []
  }
}

export const walletCoreEngine =
  new WalletCoreEngine()
