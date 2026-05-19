/**
 * MTAA OS — Wallet Core Engine
 * ----------------------------
 * Background system service that:
 * - boots wallet session
 * - syncs Supabase state
 * - emits OS events
 * - keeps wallet "alive"
 */

import { supabase } from '@/lib/supabase'
import { walletEventBus } from './walletEventBus'

class WalletCoreEngine {
  private running = false
  private userId: string | null = null
  private interval: any = null

  async start(userId: string) {
    if (this.running) return

    this.running = true
    this.userId = userId

    walletEventBus.emit('WALLET_LOADED', { userId })

    await this.sync()

    // lightweight heartbeat sync (OS-style)
    this.interval = setInterval(() => {
      this.sync().catch(console.error)
    }, 15000)
  }

  async sync() {
    if (!this.userId) return

    const { data: wallets } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', this.userId)

    const { data: tx } = await supabase
      .from('app_transactions')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(20)

    const balance =
      (wallets || []).reduce((sum, w) => sum + (w.balance || 0), 0)

    walletEventBus.emit('BALANCE_UPDATED', { balance })
    walletEventBus.emit('TRANSACTION_CREATED', { list: tx || [] })
  }

  stop() {
    this.running = false
    this.userId = null

    if (this.interval) clearInterval(this.interval)
  }
}

export const walletCoreEngine = new WalletCoreEngine()
