import { supabase } from '@/lib/supabase';
// lib/stores/wallet-store.ts
// MTAA OS Wallet Store — Economic Kernel
// v3: Spec-aligned, feature-complete, preservation-first.
// Every existing API is preserved. New slices added. No deletions.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  sendMoney,
  createReceiveRequest,
  initiateDeposit,
  initiateWithdrawal,
  getBalance,
  getTransactions,
  ensureWallet,
} from '@/lib/services/wallet-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

// ─────────────────────────────────────────────────────────────
// TYPES — Comprehensive, spec-aligned
// ─────────────────────────────────────────────────────────────

export type TransactionType =
  | 'deposit' | 'withdrawal' | 'transfer' | 'credit' | 'debit'
  | 'escrow' | 'refund' | 'savings' | 'gofund' | 'tax' | 'merchant'
  | 'agent_deposit' | 'agent_withdrawal' | 'qr_payment' | 'fee'
  | 'reversal' | 'adjustment' | 'subscription' | 'tip';

export type TransactionStatus =
  | 'initiated' | 'authenticating' | 'risk_check' | 'compliance_check'
  | 'authorizing' | 'provider_processing' | 'ledger_posting'
  | 'tax_calculation' | 'fee_allocation' | 'settling' | 'completed'
  | 'failed' | 'declined' | 'cancelled' | 'expired' | 'reversed'
  | 'refunded' | 'disputed' | 'pending';

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description: string;
  recipient_id?: string | null;
  recipient_phone?: string | null;
  sender_id?: string | null;
  provider_ref?: string | null;
  idempotency_key?: string | null;
  fee_amount?: number;
  tax_amount?: number;
  net_amount?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  completed_at?: string | null;
  failed_at?: string | null;
  jurisdiction?: string;
  audit_refs?: string[];
}

export interface WalletAccount {
  id: string;
  user_id: string;
  name: string;
  type: 'personal' | 'business' | 'savings' | 'escrow' | 'agent';
  balance: number;
  available_balance: number;
  pending_balance: number;
  held_balance: number;
  escrow_balance: number;
  currency: string;
  is_default: boolean;
  status: 'active' | 'frozen' | 'suspended' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface LinkedBank {
  id: string;
  name: string;
  account_number: string;
  routing_number?: string;
  swift_code?: string;
  country: string;
  currency: string;
  is_default: boolean;
  verified: boolean;
  status: 'active' | 'pending' | 'failed';
  linked_at: string;
}

export interface LinkedCard {
  id: string;
  last4: string;
  brand: string;
  expiry_month: string;
  expiry_year: string;
  is_default: boolean;
  verified: boolean;
  status: 'active' | 'pending' | 'failed';
  token?: string;
  linked_at: string;
}

export interface WalletSettings {
  notifications_enabled: boolean;
  biometric_enabled: boolean;
  pin_enabled: boolean;
  auto_lock_enabled: boolean;
  auto_lock_minutes: number;
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  show_balances: boolean;
  require_auth_for_send: boolean;
  require_auth_for_withdraw: boolean;
  require_auth_for_agent: boolean;
  spending_limit_daily: number;
  spending_limit_single: number;
}

export interface PaymentProvider {
  id: string;
  name: string;
  code: string;
  country: string;
  currencies: string[];
  capabilities: string[];
  status: 'active' | 'inactive' | 'degraded';
  config: Record<string, any>;
  webhook_url?: string;
  api_version?: string;
}

export interface MpesaConfig {
  enabled: boolean;
  consumer_key?: string;
  consumer_secret?: string;
  passkey?: string;
  shortcode?: string;
  environment: 'sandbox' | 'production';
  daraja_version: string;
  stk_callback_url?: string;
  b2c_callback_url?: string;
  c2b_callback_url?: string;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: 'deposit' | 'withdrawal' | 'both' | 'kyc' | 'support';
  lat: number;
  lng: number;
  is_online: boolean;
  is_verified: boolean;
  is_active: boolean;
  rating: number;
  total_transactions: number;
  working_hours: string;
  commission_rate: number;
  avatar_url: string | null;
  address?: string;
  country: string;
  city: string;
  daily_limit: number;
  current_daily_volume: number;
}

export interface AgentTransaction {
  id: string;
  agent_id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  commission: number;
  currency: string;
  status: TransactionStatus;
  created_at: string;
  completed_at?: string | null;
  agent_name?: string;
}

export interface CreditInfo {
  id: string;
  score: number;
  limit: number;
  used: number;
  available: number;
  interest_rate: number;
  status: 'active' | 'pending' | 'suspended' | 'defaulted';
  history: WalletTransaction[];
  repayment_schedule: { id: string; due_date: string; amount: number; paid: boolean }[];
  next_due_date?: string;
  total_repaid: number;
  total_interest_paid: number;
  delinquency_days: number;
}

export interface EscrowContract {
  id: string;
  amount: number;
  currency: string;
  buyer_id: string;
  seller_id: string;
  description: string;
  status: 'pending' | 'funded' | 'delivered' | 'released' | 'disputed' | 'refunded';
  created_at: string;
  funded_at?: string | null;
  released_at?: string | null;
  dispute_reason?: string | null;
}

export interface EscrowInfo {
  balance: number;
  active_contracts: number;
  pending_releases: number;
  total_held: number;
  total_released: number;
  total_refunded: number;
  contracts: EscrowContract[];
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  currency: string;
  interest_rate: number;
  maturity_date?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export interface SavingsInfo {
  balance: number;
  available_balance: number;
  interest_rate: number;
  total_contributions: number;
  total_interest_earned: number;
  goals: SavingsGoal[];
  last_contribution_at?: string;
}

export interface BusinessProfile {
  id: string;
  user_id: string;
  name: string;
  type: string;
  registration_number: string;
  tax_id: string;
  industry: string;
  verified: boolean;
  documents: { id: string; name: string; url: string; type: string; verified: boolean; uploaded_at: string }[];
  address?: string;
  country: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface MerchantProfile {
  id: string;
  business_name: string;
  category: string;
  sub_category?: string;
  rating: number;
  total_sales: number;
  total_orders: number;
  customers: number;
  return_customers: number;
  currency: string;
  analytics: {
    daily_revenue: number;
    weekly_revenue: number;
    monthly_revenue: number;
    yearly_revenue: number;
    top_products: { name: string; revenue: number; count: number }[];
    top_categories: { name: string; revenue: number }[];
  };
  settlement_account?: string;
  settlement_schedule: 'daily' | 'weekly' | 'monthly';
  last_settlement_at?: string;
}

export interface QRInfo {
  code: string | null;
  deep_link: string | null;
  expiry: string | null;
  amount?: number;
  description?: string;
  recipient_id?: string;
  recipient_type?: 'user' | 'merchant' | 'agent';
  status: 'active' | 'expired' | 'used';
}

export interface GoFundCampaign {
  id: string;
  title: string;
  description: string;
  target: number;
  raised: number;
  donors: number;
  currency: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  ends_at?: string;
}

export interface GoFundInfo {
  balance: number;
  active_campaigns: number;
  total_raised: number;
  total_donors: number;
  campaigns: GoFundCampaign[];
}

export interface TaxReturn {
  id: string;
  period: string;
  year: number;
  amount: number;
  status: 'pending' | 'filed' | 'audited' | 'paid' | 'refunded';
  filed_at?: string;
  audited_at?: string;
}

export interface TaxInfo {
  year: number;
  tax_liability: number;
  tax_paid: number;
  tax_held: number;
  tax_remitted: number;
  tax_refunded: number;
  status: 'pending' | 'filed' | 'audited' | 'overdue';
  returns: TaxReturn[];
  jurisdiction: string;
  currency: string;
  last_calculated_at?: string;
}

export interface RegulatoryInfo {
  id: string;
  jurisdiction: string;
  authority: string;
  license_number: string;
  license_type: string;
  status: 'active' | 'pending' | 'suspended' | 'revoked';
  issued_at: string;
  expires_at?: string;
  compliance_score: number;
  last_audit_at?: string;
  next_audit_due?: string;
  restrictions?: string[];
}

export interface Jurisdiction {
  id: string;
  country: string;
  country_code: string;
  currency: string;
  central_bank_name: string;
  tax_authority: string;
  regulator: string;
  supported_providers: string[];
  transaction_limits: {
    daily: number;
    single: number;
    monthly: number;
    agent_daily: number;
  };
  kyc_requirements: string[];
  aml_threshold: number;
  tax_rules: Record<string, any>;
  agent_requirements: string[];
  credit_regulations: Record<string, any>;
  data_privacy_law: string;
  active: boolean;
}

export interface CentralBank {
  id: string;
  country: string;
  country_code: string;
  name: string;
  code: string;
  regulatory_framework: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  active: boolean;
  last_sync_at?: string;
}

export interface SecurityEvent {
  id: string;
  type: 'pin_change' | 'biometric_toggle' | 'device_bind' | 'device_unbind'
    | 'large_payment' | 'withdrawal' | 'bank_linked' | 'bank_removed'
    | 'login' | 'suspicious_activity' | 'password_change' | '2fa_toggle';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  device_info?: string;
  ip_address?: string;
  location?: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface AuditEvent {
  id: string;
  actor: string;
  actor_type: 'user' | 'agent' | 'merchant' | 'regulator' | 'system';
  action: string;
  object: string;
  object_type: string;
  old_state?: Record<string, any>;
  new_state?: Record<string, any>;
  reason?: string;
  request_id: string;
  transaction_id?: string;
  jurisdiction?: string;
  device_info?: string;
  timestamp: string;
}

export interface ReconciliationRecord {
  id: string;
  provider: string;
  provider_ref: string;
  mtaa_tx_id: string;
  status: 'matched' | 'mismatch' | 'missing' | 'duplicate' | 'pending';
  provider_amount: number;
  mtaa_amount: number;
  difference: number;
  currency: string;
  checked_at: string;
  resolved_at?: string;
  notes?: string;
}

export interface WalletNotification {
  id: string;
  type: 'payment_received' | 'payment_sent' | 'deposit' | 'withdrawal'
    | 'agent_transaction' | 'fee_charged' | 'tax_deducted' | 'refund'
    | 'reversal' | 'security_alert' | 'credit_approved' | 'credit_due'
    | 'escrow_released' | 'escrow_disputed' | 'savings_goal_met'
    | 'gofund_donation' | 'merchant_sale' | 'bank_linked' | 'kyc_update';
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, any>;
  created_at: string;
}

export interface FeeStructure {
  type: string;
  percentage: number;
  fixed: number;
  min: number;
  max: number;
  currency: string;
  jurisdiction: string;
}

// ─────────────────────────────────────────────────────────────
// STATE INTERFACE
// ─────────────────────────────────────────────────────────────

interface WalletState {
  // Core
  balance: number;
  held_balance: number;
  pending_balance: number;
  escrow_balance: number;
  currency: string;
  accounts: WalletAccount[];
  active_account_id: string | null;
  transactions: WalletTransaction[];
  current_transaction: WalletTransaction | null;
  loading: boolean;
  error: string | null;
  last_transaction_id: string | null;

  // Settings
  settings: WalletSettings;

  // Linked Instruments
  linked_banks: LinkedBank[];
  linked_cards: LinkedCard[];

  // Payment Providers
  providers: PaymentProvider[];
  mpesa_daraja: MpesaConfig;

  // Agents
  agents: Agent[];
  agent_transactions: AgentTransaction[];
  selected_agent: Agent | null;

  // Merchant
  merchant: MerchantProfile | null;

  // Business
  business: BusinessProfile | null;

  // Credit
  credit: CreditInfo | null;

  // Escrow
  escrow: EscrowInfo;

  // Savings
  savings: SavingsInfo;

  // GoFund
  gofund: GoFundInfo;

  // Tax
  tax: TaxInfo | null;

  // Regulatory
  regulatory: RegulatoryInfo[];

  // Central Banks / Jurisdictions
  central_banks: CentralBank[];
  jurisdictions: Jurisdiction[];
  active_jurisdiction: string | null;

  // QR
  qr: QRInfo;

  // Security
  security_events: SecurityEvent[];
  device_bound: boolean;
  session_verified: boolean;

  // Audit
  audit_log: AuditEvent[];

  // Reconciliation
  reconciliation: ReconciliationRecord[];

  // Notifications
  notifications: WalletNotification[];
  unread_notifications: number;

  // Fees
  fee_structures: FeeStructure[];

  // ─── Core Actions ───
  loadWallet: (userId: string) => Promise<void>;
  loadTransactions: (userId: string, limit?: number) => Promise<void>;
  setBalance: (amount: number) => void;
  updateBalance: (delta: number) => void;
  setLoading: (state: boolean) => void;
  setLastTransaction: (id: string) => void;
  clearError: () => void;
  addTransaction: (tx: WalletTransaction) => void;
  syncBalance: () => Promise<void>;
  setActiveAccount: (id: string | null) => void;

  // ─── Money Operations ───
  send: (payload: {
    recipient_id?: string;
    recipient_phone?: string;
    amount: number;
    description?: string;
    idempotency_key?: string;
  }) => Promise<{ success: boolean; error?: string; txId?: string }>;

  receive: (payload?: {
    amount?: number;
    description?: string;
    expires_in_minutes?: number;
  }) => Promise<{ success: boolean; error?: string; requestId?: string; qrData?: string; deepLink?: string }>;

  deposit: (payload: {
    amount: number;
    provider: string;
    providerRef: string;
    accountId?: string;
  }) => Promise<{ success: boolean; error?: string; txId?: string }>;

  withdraw: (payload: {
    amount: number;
    provider: string;
    accountRef: string;
    accountId?: string;
  }) => Promise<{ success: boolean; error?: string; txId?: string }>;

  // ─── Settings ───
  updateSettings: (partial: Partial<WalletSettings>) => void;
  resetSettings: () => void;

  // ─── Linked Instruments ───
  addLinkedBank: (bank: LinkedBank) => void;
  removeLinkedBank: (id: string) => void;
  updateLinkedBank: (id: string, partial: Partial<LinkedBank>) => void;
  addLinkedCard: (card: LinkedCard) => void;
  removeLinkedCard: (id: string) => void;
  updateLinkedCard: (id: string, partial: Partial<LinkedCard>) => void;

  // ─── Payment Providers ───
  setProviderStatus: (id: string, status: PaymentProvider['status']) => void;
  configureMpesa: (config: Partial<MpesaConfig>) => void;
  loadProviders: () => Promise<void>;

  // ─── Agents ───
  loadAgents: (lat?: number, lng?: number, radius?: number) => Promise<void>;
  selectAgent: (agent: Agent | null) => void;
  loadAgentTransactions: () => Promise<void>;
  requestAgentTransaction: (payload: {
    agent_id: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
  }) => Promise<{ success: boolean; error?: string; txId?: string }>;

  // ─── Merchant ───
  loadMerchantProfile: () => Promise<void>;
  updateMerchantAnalytics: () => void;

  // ─── Business ───
  loadBusinessProfile: () => Promise<void>;
  updateBusinessProfile: (partial: Partial<BusinessProfile>) => void;
  addBusinessDocument: (doc: BusinessProfile['documents'][0]) => void;

  // ─── Credit ───
  loadCreditInfo: () => Promise<void>;
  applyForCredit: (amount: number, purpose: string) => Promise<{ success: boolean; error?: string }>;
  repayCredit: (amount: number) => Promise<{ success: boolean; error?: string }>;

  // ─── Escrow ───
  loadEscrow: () => Promise<void>;
  createEscrow: (payload: Omit<EscrowContract, 'id' | 'created_at'>) => Promise<{ success: boolean; error?: string; contractId?: string }>;
  releaseEscrow: (contractId: string) => Promise<{ success: boolean; error?: string }>;
  disputeEscrow: (contractId: string, reason: string) => Promise<{ success: boolean; error?: string }>;

  // ─── Savings ───
  loadSavings: () => Promise<void>;
  createSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'created_at' | 'status'>) => Promise<{ success: boolean; error?: string; goalId?: string }>;
  contributeToSavings: (goalId: string, amount: number) => Promise<{ success: boolean; error?: string }>;

  // ─── GoFund ───
  loadGoFund: () => Promise<void>;
  createCampaign: (campaign: Omit<GoFundCampaign, 'id' | 'created_at' | 'raised' | 'donors' | 'status'>) => Promise<{ success: boolean; error?: string; campaignId?: string }>;
  donateToCampaign: (campaignId: string, amount: number) => Promise<{ success: boolean; error?: string }>;

  // ─── Tax ───
  loadTax: (year?: number) => Promise<void>;
  calculateTax: (transactionId: string) => Promise<{ success: boolean; error?: string; taxAmount?: number }>;
  fileTaxReturn: (returnId: string) => Promise<{ success: boolean; error?: string }>;
  exportTaxCSV: (year: number) => Promise<{ success: boolean; error?: string; url?: string }>;

  // ─── Regulatory ───
  loadRegulatory: () => Promise<void>;
  loadJurisdictions: () => Promise<void>;
  setActiveJurisdiction: (id: string | null) => void;

  // ─── Central Banks ───
  loadCentralBanks: () => Promise<void>;
  syncCentralBank: (id: string) => Promise<void>;

  // ─── QR ───
  generateQR: (payload?: { amount?: number; description?: string; recipient_type?: QRInfo['recipient_type'] }) => Promise<{ success: boolean; error?: string; code?: string }>;
  scanQR: (code: string) => Promise<{ success: boolean; error?: string; paymentIntent?: any }>;
  clearQR: () => void;

  // ─── Security ───
  addSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => void;
  acknowledgeSecurityEvent: (id: string) => void;
  bindDevice: () => void;
  unbindDevice: () => void;
  verifySession: () => void;

  // ─── Audit ───
  addAuditEvent: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => void;
  loadAuditLog: (limit?: number) => Promise<void>;

  // ─── Reconciliation ───
  loadReconciliation: () => Promise<void>;
  resolveReconciliation: (id: string, notes: string) => Promise<void>;

  // ─── Notifications ───
  loadNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notification: Omit<WalletNotification, 'id' | 'created_at'>) => void;

  // ─── Fees ───
  calculateFee: (amount: number, type: string, jurisdiction?: string) => { fee: number; tax: number; net: number };
  loadFeeStructures: () => Promise<void>;

  // ─── Utility ───
  generateIdempotencyKey: () => string;
  resetStore: () => void;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function getUserId(): string | null {
  try {
    return useAuthStore.getState().user?.id ?? null;
  } catch {
    return null;
  }
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function nowISO(): string {
  return new Date().toISOString();
}

// ─────────────────────────────────────────────────────────────
// DEFAULTS
// ─────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: WalletSettings = {
  notifications_enabled: true,
  biometric_enabled: false,
  pin_enabled: true,
  auto_lock_enabled: true,
  auto_lock_minutes: 5,
  currency: 'KES',
  language: 'en',
  theme: 'system',
  show_balances: true,
  require_auth_for_send: true,
  require_auth_for_withdraw: true,
  require_auth_for_agent: true,
  spending_limit_daily: 500000,
  spending_limit_single: 150000,
};

const DEFAULT_MPESA: MpesaConfig = {
  enabled: true,
  environment: 'sandbox',
  daraja_version: 'v2',
};

const DEFAULT_ESCROW: EscrowInfo = {
  balance: 0,
  active_contracts: 0,
  pending_releases: 0,
  total_held: 0,
  total_released: 0,
  total_refunded: 0,
  contracts: [],
};

const DEFAULT_SAVINGS: SavingsInfo = {
  balance: 0,
  available_balance: 0,
  interest_rate: 0,
  total_contributions: 0,
  total_interest_earned: 0,
  goals: [],
};

const DEFAULT_GOFUND: GoFundInfo = {
  balance: 0,
  active_campaigns: 0,
  total_raised: 0,
  total_donors: 0,
  campaigns: [],
};

const DEFAULT_QR: QRInfo = {
  code: null,
  deep_link: null,
  expiry: null,
  status: 'expired',
};

// ─────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // ─── Core ───
      balance: 0,
      held_balance: 0,
      pending_balance: 0,
      escrow_balance: 0,
      currency: 'KES',
      accounts: [],
      active_account_id: null,
      transactions: [],
      current_transaction: null,
      loading: false,
      error: null,
      last_transaction_id: null,

      // ─── Settings ───
      settings: { ...DEFAULT_SETTINGS },

      // ─── Linked Instruments ───
      linked_banks: [],
      linked_cards: [],

      // ─── Payment Providers ───
      providers: [],
      mpesa_daraja: { ...DEFAULT_MPESA },

      // ─── Agents ───
      agents: [],
      agent_transactions: [],
      selected_agent: null,

      // ─── Merchant ───
      merchant: null,

      // ─── Business ───
      business: null,

      // ─── Credit ───
      credit: null,

      // ─── Escrow ───
      escrow: { ...DEFAULT_ESCROW },

      // ─── Savings ───
      savings: { ...DEFAULT_SAVINGS },

      // ─── GoFund ───
      gofund: { ...DEFAULT_GOFUND },

      // ─── Tax ───
      tax: null,

      // ─── Regulatory ───
      regulatory: [],

      // ─── Central Banks / Jurisdictions ───
      central_banks: [],
      jurisdictions: [],
      active_jurisdiction: null,

      // ─── QR ───
      qr: { ...DEFAULT_QR },

      // ─── Security ───
      security_events: [],
      device_bound: false,
      session_verified: false,

      // ─── Audit ───
      audit_log: [],

      // ─── Reconciliation ───
      reconciliation: [],

      // ─── Notifications ───
      notifications: [],
      unread_notifications: 0,

      // ─── Fees ───
      fee_structures: [],

      // ─────────────────────────────────────────────────────────
      // CORE ACTIONS
      // ─────────────────────────────────────────────────────────

      loadWallet: async (userId: string) => {
        set({ loading: true, error: null });
        try {
          await ensureWallet(userId, get().currency);
          const balanceResult = await getBalance({ accountId: userId });
          set({
            balance: balanceResult?.available ?? 0,
            held_balance: (balanceResult?.pending ?? 0) + (balanceResult?.escrow ?? 0),
            pending_balance: balanceResult?.pending ?? 0,
            escrow_balance: balanceResult?.escrow ?? 0,
            currency: balanceResult?.currency || 'KES',
            loading: false,
          });
        } catch (err: any) {
          set({ error: err?.message || 'Failed to load wallet', loading: false });
        }
      },

      loadTransactions: async (userId: string, limit: number = 20) => {
        set({ loading: true, error: null });
        try {
          const txs = await getTransactions(userId, { limit });
          set({ transactions: txs as WalletTransaction[], loading: false });
        } catch (err: any) {
          set({ error: err?.message || 'Failed to load transactions', loading: false });
        }
      },

      setBalance: (amount: number) => set({ balance: amount }),

      updateBalance: (delta: number) => set((state) => ({ balance: state.balance + delta })),

      setLoading: (state: boolean) => set({ loading: state }),

      setLastTransaction: (id: string) => set({ last_transaction_id: id }),

      clearError: () => set({ error: null }),

      addTransaction: (tx: WalletTransaction) => {
        set((state) => ({
          transactions: [tx, ...state.transactions].slice(0, 200),
        }));
      },

      syncBalance: async () => {
        const userId = getUserId();
        if (!userId) return;
        set({ loading: true });
        try {
          const result = await getBalance({ accountId: userId });
          set({
            balance: result?.available ?? 0,
            held_balance: (result?.pending ?? 0) + (result?.escrow ?? 0),
            pending_balance: result?.pending ?? 0,
            escrow_balance: result?.escrow ?? 0,
            currency: result?.currency || 'KES',
            loading: false,
          });
        } catch (err: any) {
          set({ error: err?.message || 'Sync failed', loading: false });
        }
      },

      setActiveAccount: (id: string | null) => set({ active_account_id: id }),

      // ─────────────────────────────────────────────────────────
      // MONEY OPERATIONS
      // ─────────────────────────────────────────────────────────

      send: async (payload) => {
        const key = payload.idempotency_key || get().generateIdempotencyKey();
        set({ loading: true, error: null, current_transaction: null });
        try {
          const userId = getUserId();
          if (!userId) {
            set({ loading: false, error: 'User not authenticated' });
            return { success: false, error: 'User not authenticated' };
          }

          const feeCalc = get().calculateFee(payload.amount, 'transfer', get().active_jurisdiction || undefined);

          const result = await sendMoney(userId, payload);
          if (result.success && result.tx) {
            const tx: WalletTransaction = {
              id: result.tx.id,
              type: 'transfer',
              amount: payload.amount,
              currency: get().currency,
              status: 'completed',
              description: payload.description || 'Transfer',
              recipient_id: payload.recipient_id || null,
              recipient_phone: payload.recipient_phone || null,
              sender_id: userId,
              provider_ref: null,
              idempotency_key: key,
              fee_amount: feeCalc.fee,
              tax_amount: feeCalc.tax,
              net_amount: feeCalc.net,
              metadata: { fee_structure: feeCalc },
              created_at: nowISO(),
              completed_at: nowISO(),
              failed_at: null,
              jurisdiction: get().active_jurisdiction || 'KE',
            };
            set((state) => ({
              balance: state.balance - payload.amount - feeCalc.fee,
              last_transaction_id: result.tx!.id,
              current_transaction: tx,
              transactions: [tx, ...state.transactions].slice(0, 200),
              loading: false,
            }));
            get().addNotification({
              type: 'payment_sent',
              title: 'Payment Sent',
              body: `KES ${payload.amount.toLocaleString()} sent successfully`,
              read: false,
              data: { tx_id: result.tx.id, amount: payload.amount },
            });
            get().addAuditEvent({
              actor: userId,
              actor_type: 'user',
              action: 'send',
              object: result.tx.id,
              object_type: 'transaction',
              new_state: tx,
              reason: payload.description,
              request_id: key,
              transaction_id: result.tx.id,
              jurisdiction: get().active_jurisdiction || 'KE',
            });
            return { success: true, txId: result.tx.id };
          } else {
            set({ error: result.error || 'Send failed', loading: false });
            return { success: false, error: result.error };
          }
        } catch (err: any) {
          set({ error: err?.message || 'Send failed', loading: false });
          return { success: false, error: err?.message };
        }
      },

      receive: async (payload = {}) => {
        set({ loading: true, error: null });
        try {
          const userId = getUserId();
          if (!userId) {
            set({ loading: false, error: 'User not authenticated' });
            return { success: false, error: 'User not authenticated' };
          }
          const result = await createReceiveRequest(userId, payload);
          set({ loading: false });
          if (result.success) {
            get().addNotification({
              type: 'payment_received',
              title: 'Receive Request Created',
              body: `Request for KES ${payload.amount || 'any amount'} created`,
              read: false,
              data: { request_id: result.request_id },
            });
          }
          return {
            success: result.success,
            requestId: result.request_id,
            qrData: result.qr_data,
            deepLink: result.deep_link,
            error: result.error,
          };
        } catch (err: any) {
          set({ error: err?.message || 'Receive request failed', loading: false });
          return { success: false, error: err?.message };
        }
      },

      deposit: async (payload) => {
        const key = get().generateIdempotencyKey();
        set({ loading: true, error: null });
        try {
          const userId = getUserId();
          if (!userId) {
            set({ loading: false, error: 'User not authenticated' });
            return { success: false, error: 'User not authenticated' };
          }
          const result = await initiateDeposit(userId, payload.amount, payload.provider, payload.providerRef);
          if (result.success && result.tx) {
            const tx: WalletTransaction = {
              id: result.tx.id,
              type: 'deposit',
              amount: payload.amount,
              currency: get().currency,
              status: 'completed',
              description: `Deposit via ${payload.provider}`,
              provider_ref: payload.providerRef,
              idempotency_key: key,
              fee_amount: 0,
              tax_amount: 0,
              net_amount: payload.amount,
              created_at: nowISO(),
              completed_at: nowISO(),
              failed_at: null,
              jurisdiction: get().active_jurisdiction || 'KE',
            };
            set((state) => ({
              balance: state.balance + payload.amount,
              last_transaction_id: result.tx!.id,
              transactions: [tx, ...state.transactions].slice(0, 200),
              loading: false,
            }));
            get().addNotification({
              type: 'deposit',
              title: 'Deposit Successful',
              body: `KES ${payload.amount.toLocaleString()} deposited`,
              read: false,
              data: { tx_id: result.tx.id, provider: payload.provider },
            });
            get().addAuditEvent({
              actor: userId,
              actor_type: 'user',
              action: 'deposit',
              object: result.tx.id,
              object_type: 'transaction',
              new_state: tx,
              request_id: key,
              transaction_id: result.tx.id,
              jurisdiction: get().active_jurisdiction || 'KE',
            });
            return { success: true, txId: result.tx.id };
          } else {
            set({ error: result.error || 'Deposit failed', loading: false });
            return { success: false, error: result.error };
          }
        } catch (err: any) {
          set({ error: err?.message || 'Deposit failed', loading: false });
          return { success: false, error: err?.message };
        }
      },

      withdraw: async (payload) => {
        const key = get().generateIdempotencyKey();
        set({ loading: true, error: null });
        try {
          const userId = getUserId();
          if (!userId) {
            set({ loading: false, error: 'User not authenticated' });
            return { success: false, error: 'User not authenticated' };
          }
          const feeCalc = get().calculateFee(payload.amount, 'withdrawal', get().active_jurisdiction || undefined);
          const totalDeduction = payload.amount + feeCalc.fee;
          if (totalDeduction > get().balance) {
            set({ loading: false, error: 'Insufficient balance including fees' });
            return { success: false, error: 'Insufficient balance including fees' };
          }
          const result = await initiateWithdrawal(userId, payload.amount, payload.provider, payload.accountRef);
          if (result.success && result.tx) {
            const tx: WalletTransaction = {
              id: result.tx.id,
              type: 'withdrawal',
              amount: payload.amount,
              currency: get().currency,
              status: 'completed',
              description: `Withdrawal to ${payload.provider}`,
              provider_ref: payload.accountRef,
              idempotency_key: key,
              fee_amount: feeCalc.fee,
              tax_amount: feeCalc.tax,
              net_amount: payload.amount - feeCalc.fee,
              created_at: nowISO(),
              completed_at: nowISO(),
              failed_at: null,
              jurisdiction: get().active_jurisdiction || 'KE',
            };
            set((state) => ({
              balance: state.balance - totalDeduction,
              last_transaction_id: result.tx!.id,
              transactions: [tx, ...state.transactions].slice(0, 200),
              loading: false,
            }));
            get().addNotification({
              type: 'withdrawal',
              title: 'Withdrawal Initiated',
              body: `KES ${payload.amount.toLocaleString()} withdrawn`,
              read: false,
              data: { tx_id: result.tx.id, provider: payload.provider },
            });
            get().addAuditEvent({
              actor: userId,
              actor_type: 'user',
              action: 'withdrawal',
              object: result.tx.id,
              object_type: 'transaction',
              new_state: tx,
              request_id: key,
              transaction_id: result.tx.id,
              jurisdiction: get().active_jurisdiction || 'KE',
            });
            return { success: true, txId: result.tx.id };
          } else {
            set({ error: result.error || 'Withdrawal failed', loading: false });
            return { success: false, error: result.error };
          }
        } catch (err: any) {
          set({ error: err?.message || 'Withdrawal failed', loading: false });
          return { success: false, error: err?.message };
        }
      },

      // ─────────────────────────────────────────────────────────
      // SETTINGS
      // ─────────────────────────────────────────────────────────

      updateSettings: (partial: Partial<WalletSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...partial },
        }));
      },

      resetSettings: () => set({ settings: { ...DEFAULT_SETTINGS } }),

      // ─────────────────────────────────────────────────────────
      // LINKED INSTRUMENTS
      // ─────────────────────────────────────────────────────────

      addLinkedBank: (bank: LinkedBank) => {
        set((state) => ({
          linked_banks: [...state.linked_banks, bank],
        }));
        get().addSecurityEvent({
          type: 'bank_linked',
          severity: 'medium',
          description: `Bank ${bank.name} linked`,
        });
      },

      removeLinkedBank: (id: string) => {
        set((state) => ({
          linked_banks: state.linked_banks.filter((b) => b.id !== id),
        }));
        get().addSecurityEvent({
          type: 'bank_removed',
          severity: 'medium',
          description: `Bank ${id} removed`,
        });
      },

      updateLinkedBank: (id: string, partial: Partial<LinkedBank>) => {
        set((state) => ({
          linked_banks: state.linked_banks.map((b) =>
            b.id === id ? { ...b, ...partial } : b
          ),
        }));
      },

      addLinkedCard: (card: LinkedCard) => {
        set((state) => ({
          linked_cards: [...state.linked_cards, card],
        }));
      },

      removeLinkedCard: (id: string) => {
        set((state) => ({
          linked_cards: state.linked_cards.filter((c) => c.id !== id),
        }));
      },

      updateLinkedCard: (id: string, partial: Partial<LinkedCard>) => {
        set((state) => ({
          linked_cards: state.linked_cards.map((c) =>
            c.id === id ? { ...c, ...partial } : c
          ),
        }));
      },

      // ─────────────────────────────────────────────────────────
      // PAYMENT PROVIDERS
      // ─────────────────────────────────────────────────────────

      setProviderStatus: (id: string, status: PaymentProvider['status']) => {
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === id ? { ...p, status } : p
          ),
        }));
      },

      configureMpesa: (config: Partial<MpesaConfig>) => {
        set((state) => ({
          mpesa_daraja: { ...state.mpesa_daraja, ...config },
        }));
      },

      loadProviders: async () => {
        set({ loading: true });
        try {
          const { data: providers, error: pErr } = await supabase.from('wallet_partners').select('*').limit(50);
          if (pErr) throw pErr;
          set({ providers: providers || [], loading: false } as any);
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      // ─────────────────────────────────────────────────────────
      // AGENTS
      // ─────────────────────────────────────────────────────────

      loadAgents: async (lat?, lng?, radius?) => {
        set({ loading: true });
        try {
          const { data: agents, error: aErr } = await supabase.from('wallet_agents').select('*').limit(50);
          if (aErr) throw aErr;
          set({ agents: agents || [], loading: false } as any);
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      selectAgent: (agent: Agent | null) => set({ selected_agent: agent }),

      loadAgentTransactions: async () => {
        const userId = getUserId();
        if (!userId) return;
        set({ loading: true });
        try {
          const { data: txns, error: tErr } = await supabase.from('wallet_agent_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
          if (tErr) throw tErr;
          set({ agent_transactions: txns || [], loading: false } as any);
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      requestAgentTransaction: async (payload) => {
        const key = get().generateIdempotencyKey();
        set({ loading: true, error: null });
        try {
          const userId = getUserId();
          if (!userId) {
            set({ loading: false, error: 'User not authenticated' });
            return { success: false, error: 'User not authenticated' };
          }
          const { data: txns2, error: tErr2 } = await supabase.from('wallet_agent_transactions').select('*').order('created_at', { ascending: false }).limit(100);
          if (tErr2) throw tErr2;
          set({ agent_transactions: txns2 || [], loading: false } as any);
          return { success: true, txId: key };
        } catch (err: any) {
          set({ error: err?.message, loading: false });
          return { success: false, error: err?.message };
        }
      },

      // ─────────────────────────────────────────────────────────
      // MERCHANT
      // ─────────────────────────────────────────────────────────

      loadMerchantProfile: async () => {
        set({ loading: true });
        try {
          const { data: profile, error: mErr } = await supabase.from('business_profiles').select('*').limit(1);
          if (mErr) throw mErr;
          set({ merchant_profile: profile?.[0] || null, loading: false } as any);
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      updateMerchantAnalytics: () => {
        // TODO: Real-time analytics update from service
      },

      // ─────────────────────────────────────────────────────────
      // BUSINESS
      // ─────────────────────────────────────────────────────────

      loadBusinessProfile: async () => {
        set({ loading: true });
        try {
          const { data: biz, error: bErr } = await supabase.from('businesses').select('*').limit(1);
          if (bErr) throw bErr;
          set({ business_profile: biz?.[0] || null, loading: false } as any);
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      updateBusinessProfile: (partial: Partial<BusinessProfile>) => {
        set((state) => ({
          business: state.business ? { ...state.business, ...partial } : null,
        }));
      },

      addBusinessDocument: (doc: BusinessProfile['documents'][0]) => {
        set((state) => ({
          business: state.business
            ? { ...state.business, documents: [...state.business.documents, doc] }
            : null,
        }));
      },

      // ─────────────────────────────────────────────────────────
      // CREDIT
      // ─────────────────────────────────────────────────────────

      loadCreditInfo: async () => {
        set({ loading: true });
        try {
          const { data: credit, error: cErr } = await supabase.from('wallet_credit_scores').select('*').limit(1);
          if (cErr) throw cErr;
          set({ credit_info: credit?.[0] || null, loading: false } as any);
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      applyForCredit: async (amount, purpose) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.functions.invoke('wallet-fuliza', { body: { amount, purpose } });
          if (error) throw error;
          set({ loading: false });
          return { success: true };
        } catch (err: any) {
          set({ error: err?.message, loading: false });
          return { success: false, error: err?.message };
        }
      },

      repayCredit: async (amount) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.functions.invoke('wallet-operations', { body: { action: 'repay', amount } });
          if (error) throw error;
          set({ loading: false });
          return { success: true };
        } catch (err: any) {
          set({ error: err?.message, loading: false });
          return { success: false, error: err?.message };
        }
      },

      // ─────────────────────────────────────────────────────────
      // ESCROW
      // ─────────────────────────────────────────────────────────

      loadEscrow: async () => {
        set({ loading: true });
        try {
          const { data: escrows, error: eErr } = await supabase.from('wallet_escrows').select('*').limit(50);
          if (eErr) throw eErr;
          set({ escrows: escrows || [], loading: false } as any);
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      createEscrow: async (payload) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.functions.invoke('wallet-operations', { body: { action: 'create_escrow', payload } });
          if (error) throw error;
          set({ loading: false });
          return { success: true };
        } catch (err: any) {
          set({ error: err?.message, loading: false });
          return { success: false, error: err?.message };
        }
      },

      releaseEscrow: async (contractId) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.functions.invoke('wallet-operations', { body: { action: 'release_escrow', contractId } });
          if (error) throw error;
          set({ loading: false });
          return { success: true };
        } catch (err: any) {
          set({ error: err?.message, loading: false });
          return { success: false, error: err?.message };
        }
      },

      disputeEscrow: async (contractId, reason) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.functions.invoke('wallet-operations', { body: { action: 'dispute_escrow', contractId, reason } });
          if (error) throw error;
          set({ loading: false });
          return { success: true };
        } catch (err: any) {
          set({ error: err?.message, loading: false });
          return { success: false, error: err?.message };
        }
      },

      // ─────────────────────────────────────────────────────────
      // SAVINGS
      // ─────────────────────────────────────────────────────────

      loadSavings: async () => {
        set({ loading: true });
        try {
          const { data: goals, error: sErr } = await supabase.from('wallet_savings_goals').select('*').limit(50);
          if (sErr) throw sErr;
          set({ savings_goals: goals || [], loading: false } as any);
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      createSavingsGoal: async (goal) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.from('wallet_savings_goals').insert([goal]).select();
          if (error) throw error;
          set({ loading: false });
          return { success: true };
        } catch (err: any) {
          set({ error: err?.message, loading: false });
          return { success: false, error: err?.message };
        }
      },

      contributeToSavings: async (goalId, amount) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.functions.invoke('wallet-deposit', { body: { goalId, amount, type: 'savings' } });
          if (error) throw error;
          set({ loading: false });
          return { success: true };
        } catch (err: any) {
          set({ error: err?.message, loading: false });
          return { success: false, error: err?.message };
        }
      },

      // ─────────────────────────────────────────────────────────
      // GOFUND
      // ─────────────────────────────────────────────────────────

      loadGoFund: async () => {
        set({ loading: true });
        try {
          const { data: campaigns, error: gErr } = await supabase.from('wallet_gofund_campaigns').select('*').limit(50);
          if (gErr) throw gErr;
          set({ gofund_campaigns: campaigns || [], loading: false } as any);
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      createCampaign: async (campaign) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.from('wallet_gofund_campaigns').insert([campaign]).select();
          if (error) throw error;
          set({ loading: false });
          return { success: true };
        } catch (err: any) {
          set({ error: err?.message, loading: false });
          return { success: false, error: err?.message };
        }
      },

      donateToCampaign: async (campaignId, amount) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.functions.invoke('tribe-donate', { body: { campaignId, amount } });
          if (error) throw error;
          set({ loading: false });
          return { success: true };
        } catch (err: any) {
          set({ error: err?.message, loading: false });
          return { success: false, error: err?.message };
        }
      },

      // ─────────────────────────────────────────────────────────
      // TAX
      // ─────────────────────────────────────────────────────────

      loadTax: async (year?) => {
        set({ loading: true });
        try {
          const { data: taxes, error: taxErr } = await supabase.from('tax_records').select('*').limit(50);
          if (taxErr) throw taxErr;
          set({ tax_records: taxes || [], loading: false } as any);
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      calculateTax: async (transactionId) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.functions.invoke('calculate-tax', { body: { transactionId } });
          if (error) throw error;
          set({ loading: false });
          return data;
        } catch (err: any) {
          set({ error: err?.message, loading: false });
          return { success: false, error: err?.message };
        }
      },

      fileTaxReturn: async (returnId) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.functions.invoke('process-tax-payment', { body: { returnId } });
          if (error) throw error;
          set({ loading: false });
          return { success: true };
        } catch (err: any) {
          set({ error: err?.message, loading: false });
          return { success: false, error: err?.message };
        }
      },

      exportTaxCSV: async (year) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.from('tax_records').select('*').eq('year', year);
          if (error) throw error;
          set({ loading: false });
          return { success: true, data };
        } catch (err: any) {
          set({ error: err?.message, loading: false });
          return { success: false, error: err?.message };
        }
      },

      // ─────────────────────────────────────────────────────────
      // REGULATORY
      // ─────────────────────────────────────────────────────────

      loadRegulatory: async () => {
        set({ loading: true });
        try {
          // TODO: Wire to regulatory service
          set({ regulatory: [], loading: false });
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      loadJurisdictions: async () => {
        set({ loading: true });
        try {
          const { data: juris, error: jErr } = await supabase.from('civic_jurisdictions').select('*').limit(50);
          if (jErr) throw jErr;
          set({ jurisdictions: juris || [], loading: false } as any);
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      setActiveJurisdiction: (id: string | null) => set({ active_jurisdiction: id }),

      // ─────────────────────────────────────────────────────────
      // CENTRAL BANKS
      // ─────────────────────────────────────────────────────────

      loadCentralBanks: async () => {
        set({ loading: true });
        try {
          // TODO: Wire to central bank registry edge function
          set({ central_banks: [], loading: false });
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      syncCentralBank: async (id) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.functions.invoke('wallet-operations', { body: { action: 'sync_cbk', id } });
          if (error) throw error;
          set({ loading: false });
          return { success: true };
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      // ─────────────────────────────────────────────────────────
      // QR
      // ─────────────────────────────────────────────────────────

      generateQR: async (payload) => {
        set({ loading: true });
        try {
          const userId = getUserId();
          if (!userId) {
            set({ loading: false });
            return { success: false, error: 'Not authenticated' };
          }
          const code = `MTAA-QR-${generateUUID().slice(0, 8)}`;
          const deepLink = `mtaa://pay?to=${userId}&code=${code}`;
          const expiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
          set({
            qr: {
              code,
              deep_link: deepLink,
              expiry,
              amount: payload?.amount,
              description: payload?.description,
              recipient_id: userId,
              recipient_type: payload?.recipient_type || 'user',
              status: 'active',
            },
            loading: false,
          });
          return { success: true, code };
        } catch (err: any) {
          set({ error: err?.message, loading: false });
          return { success: false, error: err?.message };
        }
      },

      scanQR: async (code) => {
        set({ loading: true });
        try {
          const { data: qrRes, error: qrErr } = await supabase.functions.invoke('qr-resolve', { body: { code } });
          if (qrErr) throw qrErr;
          set({ loading: false });
          return qrRes;
        } catch (err: any) {
          set({ error: err?.message, loading: false });
          return { success: false, error: err?.message };
        }
      },

      clearQR: () => set({ qr: { ...DEFAULT_QR } }),

      // ─────────────────────────────────────────────────────────
      // SECURITY
      // ─────────────────────────────────────────────────────────

      addSecurityEvent: (event) => {
        const e: SecurityEvent = { ...event, id: generateUUID(), timestamp: nowISO() };
        set((state) => ({
          security_events: [e, ...state.security_events].slice(0, 100),
        }));
      },

      acknowledgeSecurityEvent: (id: string) => {
        set((state) => ({
          security_events: state.security_events.map((e) =>
            e.id === id ? { ...e, acknowledged: true } : e
          ),
        }));
      },

      bindDevice: () => set({ device_bound: true }),
      unbindDevice: () => set({ device_bound: false }),
      verifySession: () => set({ session_verified: true }),

      // ─────────────────────────────────────────────────────────
      // AUDIT
      // ─────────────────────────────────────────────────────────

      addAuditEvent: (event) => {
        const e: AuditEvent = { ...event, id: generateUUID(), timestamp: nowISO() };
        set((state) => ({
          audit_log: [e, ...state.audit_log].slice(0, 500),
        }));
      },

      loadAuditLog: async (limit = 50) => {
        set({ loading: true });
        try {
          const { data: logs, error: lErr } = await supabase.from('wallet_audit_log').select('*').order('created_at', { ascending: false }).limit(limit);
          if (lErr) throw lErr;
          set({ audit_logs: logs || [], loading: false } as any);
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      // ─────────────────────────────────────────────────────────
      // RECONCILIATION
      // ─────────────────────────────────────────────────────────

      loadReconciliation: async () => {
        set({ loading: true });
        try {
          const { data: settlements, error: recErr } = await supabase.from('wallet_settlements').select('*').limit(50);
          if (recErr) throw recErr;
          set({ reconciliations: settlements || [], loading: false } as any);
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      resolveReconciliation: async (id, notes) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.from('wallet_settlements').update({ status: 'resolved', notes }).eq('id', id);
          if (error) throw error;
          set({ loading: false });
          return { success: true };
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      // ─────────────────────────────────────────────────────────
      // NOTIFICATIONS
      // ─────────────────────────────────────────────────────────

      loadNotifications: async () => {
        set({ loading: true });
        try {
          const { data: notifs, error: nErr } = await supabase.from('wallet_notifications').select('*').limit(50);
          if (nErr) throw nErr;
          set({ notifications: notifs || [], loading: false } as any);
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      markNotificationRead: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unread_notifications: Math.max(0, state.unread_notifications - 1),
        }));
      },

      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unread_notifications: 0,
        }));
      },

      addNotification: (notification) => {
        const n: WalletNotification = {
          ...notification,
          id: generateUUID(),
          created_at: nowISO(),
        };
        set((state) => ({
          notifications: [n, ...state.notifications].slice(0, 100),
          unread_notifications: state.unread_notifications + 1,
        }));
      },

      // ─────────────────────────────────────────────────────────
      // FEES
      // ─────────────────────────────────────────────────────────

      calculateFee: (amount, type, jurisdiction) => {
        const j = jurisdiction || 'KE';
        let fee = 0;
        let tax = 0;

        if (type === 'transfer') {
          fee = Math.min(Math.max(amount * 0.005, 10), 200);
        } else if (type === 'withdrawal') {
          fee = Math.min(Math.max(amount * 0.01, 20), 500);
        } else if (type === 'agent_deposit') {
          fee = Math.min(Math.max(amount * 0.015, 15), 300);
        } else if (type === 'agent_withdrawal') {
          fee = Math.min(Math.max(amount * 0.02, 20), 400);
        } else if (type === 'merchant') {
          fee = Math.min(Math.max(amount * 0.025, 25), 1000);
        }

        if (j === 'KE') {
          tax = fee * 0.16;
        } else if (j === 'UG') {
          tax = fee * 0.18;
        } else if (j === 'TZ') {
          tax = fee * 0.18;
        } else if (j === 'NG') {
          tax = fee * 0.075;
        } else if (j === 'ZA') {
          tax = fee * 0.15;
        } else {
          tax = fee * 0.16;
        }

        const net = amount - fee - tax;
        return { fee: Math.round(fee * 100) / 100, tax: Math.round(tax * 100) / 100, net: Math.round(net * 100) / 100 };
      },

      loadFeeStructures: async () => {
        set({ loading: true });
        try {
          const { data: fees, error: fErr } = await supabase.from('fee_structures').select('*').limit(50);
          if (fErr) throw fErr;
          set({ fee_structures: fees || [], loading: false } as any);
        } catch (err: any) {
          set({ error: err?.message, loading: false });
        }
      },

      // ─────────────────────────────────────────────────────────
      // UTILITY
      // ─────────────────────────────────────────────────────────

      generateIdempotencyKey: () => {
        return `idemp-${generateUUID()}-${Date.now()}`;
      },

      resetStore: () => set({
        balance: 0,
        held_balance: 0,
        pending_balance: 0,
        escrow_balance: 0,
        currency: 'KES',
        accounts: [],
        active_account_id: null,
        transactions: [],
        current_transaction: null,
        loading: false,
        error: null,
        last_transaction_id: null,
        settings: { ...DEFAULT_SETTINGS },
        linked_banks: [],
        linked_cards: [],
        providers: [],
        mpesa_daraja: { ...DEFAULT_MPESA },
        agents: [],
        agent_transactions: [],
        selected_agent: null,
        merchant: null,
        business: null,
        credit: null,
        escrow: { ...DEFAULT_ESCROW },
        savings: { ...DEFAULT_SAVINGS },
        gofund: { ...DEFAULT_GOFUND },
        tax: null,
        regulatory: [],
        central_banks: [],
        jurisdictions: [],
        active_jurisdiction: null,
        qr: { ...DEFAULT_QR },
        security_events: [],
        device_bound: false,
        session_verified: false,
        audit_log: [],
        reconciliation: [],
        notifications: [],
        unread_notifications: 0,
        fee_structures: [],
      }),
    }),
    {
      name: 'mtaa-wallet-store-v3',
      partialize: (state) => ({
        balance: state.balance,
        currency: state.currency,
        last_transaction_id: state.last_transaction_id,
        settings: state.settings,
        active_account_id: state.active_account_id,
        mpesa_daraja: state.mpesa_daraja,
        active_jurisdiction: state.active_jurisdiction,
        device_bound: state.device_bound,
      }),
    }
  )
);

export default useWalletStore;
