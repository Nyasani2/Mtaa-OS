/**
 * ASIS Layer 5 — Wallet Intelligence + Claim System Types
 * African-first fintech types with safety controls
 */

export enum Currency {
  KES = 'KES',
  UGX = 'UGX',
  TZS = 'TZS',
  RWF = 'RWF',
  NGN = 'NGN',
  GHS = 'GHS',
  ZAR = 'ZAR',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
}

export enum PaymentMethod {
  MTAA_WALLET = 'mtaa_wallet',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY = 'mobile_money',
  CASH_POINT = 'cash_point',
  CROSS_BORDER = 'cross_border',
}

export enum TransferStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  CLAIMED = 'claimed',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
}

export enum ClaimStatus {
  ACTIVE = 'active',
  CLAIMED = 'claimed',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  REFUNDED = 'refunded',
}

export interface WalletAccount {
  id: string;
  userId: string;
  currency: Currency;
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  status: 'active' | 'frozen' | 'suspended' | 'closed';
  kycLevel: number;
  dailyLimit: number;
  monthlyLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transfer {
  id: string;
  senderId: string;
  senderWalletId: string;
  recipientId?: string;
  recipientWalletId?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  amount: number;
  currency: Currency;
  convertedAmount?: number;
  targetCurrency?: Currency;
  exchangeRate?: number;
  fee: number;
  totalAmount: number;
  status: TransferStatus;
  method: PaymentMethod;
  claimToken?: string;
  claimExpiry?: Date;
  description?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ClaimLink {
  token: string;
  transferId: string;
  senderId: string;
  senderName: string;
  amount: number;
  currency: Currency;
  status: ClaimStatus;
  recipientPhone?: string;
  recipientEmail?: string;
  createdAt: Date;
  expiresAt: Date;
  claimedAt?: Date;
  claimedBy?: string;
  claimCount: number;
  maxClaims: number;
}

export interface QRPayload {
  type: 'claim' | 'onboard' | 'pay' | 'referral';
  token?: string;
  senderId?: string;
  amount?: number;
  currency?: Currency;
  referralCode?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

export interface CashPoint {
  id: string;
  name: string;
  type: 'shop' | 'kiosk' | 'mobile_agent' | 'supermarket' | 'roaming_agent' | 'bank_agent';
  operatorName: string;
  phone: string;
  currencies: Currency[];
  liquidity: Record<Currency, number>;
  status: 'online' | 'offline' | 'low_liquidity' | 'closed';
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    country: string;
  };
  operatingHours: {
    open: string;
    close: string;
    days: string[];
  };
  rating: number;
  reviewCount: number;
  fees: Record<string, number>;
  minAmount: number;
  maxAmount: number;
  lastSeen: Date;
  verified: boolean;
}

export interface FXRate {
  from: Currency;
  to: Currency;
  rate: number;
  inverseRate: number;
  spread: number;
  provider: string;
  timestamp: Date;
  expiresAt: Date;
  estimated: boolean;
}

export interface FeeEstimate {
  baseFee: number;
  percentageFee: number;
  minimumFee: number;
  maximumFee: number;
  fxSpread: number;
  totalFee: number;
  totalAmount: number;
  breakdown: Record<string, number>;
}

export interface FraudAlert {
  id: string;
  type: 'velocity' | 'device' | 'pin' | 'duplicate' | 'onboarding_loop' | 'geo' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  transferId?: string;
  deviceId?: string;
  description: string;
  evidence: Record<string, unknown>;
  timestamp: Date;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  resolvedAt?: Date;
}

export interface TransferPolicy {
  minAmount: number;
  maxAmount: number;
  dailyLimit: number;
  monthlyLimit: number;
  requireConfirmation: boolean;
  requirePin: boolean;
  requireBiometric: boolean;
  requireKyc: number;
  allowedMethods: PaymentMethod[];
  allowedCurrencies: Currency[];
  coolingOffMinutes: number;
}

export interface TransferPreview {
  transfer: Omit<Transfer, 'id' | 'status' | 'createdAt' | 'updatedAt'>;
  fees: FeeEstimate;
  fxRate?: FXRate;
  warnings: string[];
  confirmationRequired: boolean;
  estimatedCompletion: Date;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  completed: boolean;
  skippable: boolean;
  context?: Record<string, unknown>;
}

export interface WalletContext {
  userId: string;
  walletId: string;
  kycLevel: number;
  balance: number;
  currency: Currency;
  recentTransfers: Transfer[];
  pendingClaims: ClaimLink[];
  cashPointsNearby: CashPoint[];
  fxRates: FXRate[];
}
