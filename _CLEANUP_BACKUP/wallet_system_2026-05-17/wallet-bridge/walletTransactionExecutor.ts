/**
 * MTAA OS — Wallet Transaction Executor
 * -------------------------------------
 * Responsible for REAL transaction execution.
 *
 * ONLY this layer talks to:
 * - Supabase
 * - RPCs
 * - Edge functions
 */

import { supabase } from '@/lib/supabase'
import { walletEventBus } from './walletEventBus'

class WalletTransactionExecutor {
  async execute(input: any) {
    switch (input.type) {
      case 'SEND_MONEY':
        return this.sendMoney(input)

      case 'TOPUP_MPESA':
        return this.topupMpesa(input)

      case 'TOPUP_CARD':
        return this.topupCard(input)

      case 'TRANSFER':
        return this.transfer(input)

      case 'CREATE_WALLET':
        return this.createWallet(input)

      default:
        throw new Error('Unknown wallet action')
    }
  }

  /**
   * SEND MONEY
   */
  async sendMoney(input: any) {
    const { error } = await supabase.rpc(
      'transfer_funds',
      {
        sender_id: input.userId,
        recipient_id: input.recipientId,
        amount: input.amount,
        currency_code: input.currency || 'KES',
      }
    )

    if (error) throw error

    walletEventBus.emit('TRANSACTION_CREATED', {
      type: 'SEND_MONEY',
      amount: input.amount,
    })

    return {
      success: true,
      type: 'SEND_MONEY',
    }
  }

  /**
   * MPESA TOPUP
   */
  async topupMpesa(input: any) {
    walletEventBus.emit('MPESA_PENDING', {
      amount: input.amount,
    })

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/mpesa-stk-push`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: input.metadata?.phone,
          amount: input.amount,
          userId: input.userId,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      walletEventBus.emit('MPESA_FAILED', result)
      throw new Error(result?.error || 'M-Pesa failed')
    }

    walletEventBus.emit('MPESA_SUCCESS', result)

    return result
  }

  /**
   * CARD TOPUP
   */
  async topupCard(input: any) {
    return {
      success: true,
      type: 'TOPUP_CARD',
    }
  }

  /**
   * INTERNAL TRANSFER
   */
  async transfer(input: any) {
    return {
      success: true,
      type: 'TRANSFER',
    }
  }

  /**
   * CREATE WALLET
   */
  async createWallet(input: any) {
    const { error } = await supabase
      .from('wallets')
      .insert({
        user_id: input.userId,
        balance: 0,
        currency: input.currency || 'KES',
        status: 'active',
      })

    if (error) throw error

    return {
      success: true,
      type: 'CREATE_WALLET',
    }
  }
}

export const walletTransactionExecutor =
  new WalletTransactionExecutor()
