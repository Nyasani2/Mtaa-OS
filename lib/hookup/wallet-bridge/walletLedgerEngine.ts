import { supabase } from '@/lib/supabase'
import { walletEventBus } from './walletEventBus'

type LedgerEntry = {
  user_id: string
  amount: number
  type: 'CREDIT' | 'DEBIT'
  source: 'mpesa' | 'card' | 'bank' | 'internal'
  reference: string
  status: 'PENDING' | 'CONFIRMED' | 'FAILED'
}

class WalletLedgerEngine {
  // =========================
  // CREATE LEDGER ENTRY
  // =========================
  async createEntry(entry: LedgerEntry) {
    walletEventBus.emit('TRANSACTION_CREATED', entry)

    const { data, error } = await supabase
      .from('wallet_ledger')
      .insert({
        ...entry,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      walletEventBus.emit('TRANSACTION_FAILED', error)
      throw error
    }

    return data
  }

  // =========================
  // CONFIRM TRANSACTION
  // =========================
  async confirmTransaction(reference: string) {
    const { data, error } = await supabase
      .from('wallet_ledger')
      .update({ status: 'CONFIRMED' })
      .eq('reference', reference)
      .select()
      .single()

    if (error) throw error

    walletEventBus.emit('TRANSACTION_CONFIRMED', data)

    await this.recalculateBalance(data.user_id)

    return data
  }

  // =========================
  // FAIL TRANSACTION
  // =========================
  async failTransaction(reference: string) {
    const { data, error } = await supabase
      .from('wallet_ledger')
      .update({ status: 'FAILED' })
      .eq('reference', reference)
      .select()
      .single()

    if (error) throw error

    walletEventBus.emit('TRANSACTION_FAILED', data)

    return data
  }

  // =========================
  // RECONCILE BALANCE (TRUTH)
  // =========================
  async recalculateBalance(user_id: string) {
    const { data } = await supabase
      .from('wallet_ledger')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'CONFIRMED')

    const balance =
      (data || []).reduce((sum, tx) => {
        return tx.type === 'CREDIT'
          ? sum + tx.amount
          : sum - tx.amount
      }, 0)

    walletEventBus.emit('BALANCE_UPDATED', { balance, user_id })

    return balance
  }
}

export const walletLedgerEngine = new WalletLedgerEngine()
