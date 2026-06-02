/**
 * ASIS Layer 5 — Wallet Intelligence Interfaces
 * Provider abstractions for future integrations
 */

import {
  Currency,
  PaymentMethod,
  Transfer,
  TransferPreview,
  FXRate,
  FeeEstimate,
  CashPoint,
  ClaimLink,
  WalletAccount,
  TransferPolicy,
} from './types';

/**
 * Payment Route Provider — abstraction for all payment methods
 * NO real integrations yet. Architecture only.
 */
export interface IPaymentRouteProvider {
  name: string;
  method: PaymentMethod;
  supportedCurrencies: Currency[];
  supportedCountries: string[];

  /** Validate if this provider can handle a transfer */
  canRoute(transfer: Omit<Transfer, 'id' | 'status'>): Promise<boolean>;

  /** Get fee estimate for this route */
  estimateFees(transfer: Omit<Transfer, 'id' | 'status'>): Promise<FeeEstimate>;

  /** Get estimated completion time */
  estimateCompletion(transfer: Omit<Transfer, 'id' | 'status'>): Promise<Date>;

  /** Execute transfer (scaffold — returns mock result) */
  execute(transfer: Transfer): Promise<{ success: boolean; reference?: string; error?: string }>;

  /** Health check */
  health(): Promise<{ available: boolean; latency: number }>;
}

/**
 * FX Provider — abstraction for exchange rate sources
 * NO live APIs yet. Rate estimation only.
 */
export interface IFXProvider {
  name: string;
  supportedPairs: { from: Currency; to: Currency }[];

  /** Get current rate (estimated for MVP) */
  getRate(from: Currency, to: Currency): Promise<FXRate>;

  /** Get rate history for trend analysis */
  getRateHistory(from: Currency, to: Currency, days: number): Promise<FXRate[]>;

  /** Health check */
  health(): Promise<{ available: boolean; latency: number }>;
}

/**
 * Cash Point Provider — abstraction for cash withdrawal locations
 */
export interface ICashPointProvider {
  name: string;

  /** Find cash points near location */
  findNearby(lat: number, lng: number, radiusKm: number, currency?: Currency): Promise<CashPoint[]>;

  /** Get cash point by ID */
  getById(id: string): Promise<CashPoint | null>;

  /** Check liquidity availability */
  checkLiquidity(cashPointId: string, currency: Currency, amount: number): Promise<boolean>;

  /** Reserve liquidity (scaffold) */
  reserve(cashPointId: string, currency: Currency, amount: number, ttlMinutes: number): Promise<boolean>;

  /** Health check */
  health(): Promise<{ available: boolean; latency: number }>;
}

/**
 * Claim Provider — abstraction for claim link backends
 */
export interface IClaimProvider {
  /** Generate secure claim token */
  generateToken(transferId: string, metadata?: Record<string, unknown>): Promise<string>;

  /** Validate claim token */
  validateToken(token: string): Promise<{ valid: boolean; claim?: ClaimLink; error?: string }>;

  /** Mark claim as claimed */
  markClaimed(token: string, userId: string): Promise<{ success: boolean; transfer?: Transfer }>;

  /** Revoke claim */
  revokeToken(token: string): Promise<boolean>;

  /** Health check */
  health(): Promise<{ available: boolean; latency: number }>;
}

/**
 * Fraud Detection Provider — abstraction for fraud systems
 */
export interface IFraudProvider {
  /** Analyze transfer for fraud risk */
  analyzeTransfer(transfer: Transfer): Promise<{ risk: number; alerts: string[]; blocked: boolean }>;

  /** Analyze device behavior */
  analyzeDevice(userId: string, deviceId: string, action: string): Promise<{ risk: number; alerts: string[] }>;

  /** Report confirmed fraud */
  reportFraud(alert: { userId: string; type: string; evidence: Record<string, unknown> }): Promise<void>;

  /** Health check */
  health(): Promise<{ available: boolean; latency: number }>;
}

/**
 * Onboarding Provider — abstraction for user onboarding flows
 */
export interface IOnboardingProvider {
  /** Get personalized onboarding steps */
  getSteps(userId: string, context?: Record<string, unknown>): Promise<OnboardingStep[]>;

  /** Complete a step */
  completeStep(userId: string, stepId: string): Promise<void>;

  /** Skip a step */
  skipStep(userId: string, stepId: string): Promise<void>;

  /** Get onboarding progress */
  getProgress(userId: string): Promise<{ completed: number; total: number; percentage: number }>;
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

/**
 * Wallet Intelligence Provider — AI-assisted financial guidance
 */
export interface IWalletIntelligence {
  /** Explain a wallet action in natural language */
  explainAction(action: string, params: Record<string, unknown>): Promise<string>;

  /** Suggest optimal payment method */
  suggestMethod(transfer: Omit<Transfer, 'id' | 'status'>): Promise<{ method: PaymentMethod; reason: string }>;

  /** Detect unusual patterns and warn user */
  detectAnomaly(userId: string, action: string): Promise<{ anomaly: boolean; warning?: string; suggestion?: string }>;

  /** Guide user through complex flow */
  guideFlow(flow: string, step: number, context: Record<string, unknown>): Promise<{ message: string; nextStep: number; done: boolean }>;
}
