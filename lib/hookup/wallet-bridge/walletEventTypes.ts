/**
 * MTAA OS — Wallet Event Type Registry
 * ------------------------------------
 * Single source of truth for event contracts
 */

export const WALLET_EVENTS = {
  WALLET_LOADED: 'WALLET_LOADED',
  BALANCE_UPDATED: 'BALANCE_UPDATED',

  TRANSACTION_CREATED: 'TRANSACTION_CREATED',
  TRANSACTION_CONFIRMED: 'TRANSACTION_CONFIRMED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',

  MPESA_PENDING: 'MPESA_PENDING',
  MPESA_SUCCESS: 'MPESA_SUCCESS',
  MPESA_FAILED: 'MPESA_FAILED',
} as const

export type WalletEventType =
  typeof WALLET_EVENTS[keyof typeof WALLET_EVENTS]

export interface WalletEventPayload {
  WALLET_LOADED: { userId: string }
  BALANCE_UPDATED: { balance: number }

  TRANSACTION_CREATED: { id: string; amount: number }
  TRANSACTION_CONFIRMED: { id: string }
  TRANSACTION_FAILED: { id: string; reason: string }

  MPESA_PENDING: { checkoutRequestId: string }
  MPESA_SUCCESS: { checkoutRequestId: string }
  MPESA_FAILED: { checkoutRequestId: string; reason?: string }
}

export interface WalletEvent<T extends WalletEventType = WalletEventType> {
  type: T
  payload: WalletEventPayload[T]
  timestamp: number
}

