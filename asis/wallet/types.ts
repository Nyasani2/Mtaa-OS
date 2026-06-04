/**
 * ASIS Wallet Layer — Shared Types
 * Required by: fraud-monitor.ts, transfer-orchestrator.ts, transaction-intelligence.ts
 */

export interface FraudAlert {
  id: string
  type: 'velocity' | 'pin' | 'duplicate' | 'onboarding_loop' | 'geo' | 'amount' | 'device'
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId: string
  transferId?: string
  deviceId?: string
  description: string
  evidence: Record<string, any>
  timestamp: Date
  status: 'open' | 'resolved' | 'false_positive'
  resolvedAt?: Date
  resolvedBy?: string
}

export interface Transfer {
  id: string
  senderId: string
  senderWalletId: string
  recipientId?: string
  recipientWalletId?: string
  amount: number
  currency: string
  totalAmount: number
  fee: number
  method: PaymentMethod
  targetCurrency?: string
  description: string
  metadata: Record<string, any>
  status: TransferStatus
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  failedAt?: Date
  failureReason?: string
}

export type TransferStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'

export enum PaymentMethod {
  MTAA_WALLET = 'mtaa_wallet',
  MPESA = 'mpesa',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
  CRYPTO = 'crypto',
  CASH = 'cash',
}

export interface ClaimLink {
  token: string
  amount: number
  currency: string
  senderId: string
  recipientPhone?: string
  status: 'active' | 'claimed' | 'expired' | 'cancelled'
  createdAt: Date
  expiresAt: Date
  claimedAt?: Date
  claimedBy?: string
}

export interface TransferPreview {
  transfer: Transfer
  fees: FeeBreakdown
  fxRate?: FxRate
  warnings: string[]
  confirmationRequired: boolean
  estimatedCompletion: Date
}

export interface FeeBreakdown {
  baseFee: number
  percentageFee: number
  minimumFee: number
  maximumFee: number
  fxSpread: number
  totalFee: number
  totalAmount: number
  breakdown: Record<string, number>
}

export interface FxRate {
  from: string
  to: string
  rate: number
  inverseRate: number
  spread: number
  provider: string
  timestamp: Date
  expiresAt: Date
  estimated: boolean
}

export interface WalletAccount {
  id: string
  userId: string
  balance: number
  currency: string
  status: 'active' | 'frozen' | 'suspended' | 'closed'
  kycLevel: number
  dailyLimit: number
  monthlyLimit: number
  createdAt: Date
  updatedAt: Date
}

export interface BehaviorEvent {
  userId: string
  type: string
  pattern: string
  frequency: number
  confidence: number
  timestamp: Date
}

export interface Currency {
  code: string
  name: string
  symbol: string
  decimals: number
}
