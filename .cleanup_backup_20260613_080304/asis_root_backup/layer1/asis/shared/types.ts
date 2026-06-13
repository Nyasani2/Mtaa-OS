/**
 * ASIS Shared Types
 * Core type definitions used across all ASIS modules
 */

// ============================================
// USER & IDENTITY
// ============================================

export interface UserContext {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  kycLevel: number;
  countryCode: string;
  language: string;
  timezone: string;
  permissions: PermissionSet;
  preferences: UserPreferences;
  lastActive: number;
  isBanned: boolean;
  isSuspended: boolean;
}

export interface PermissionSet {
  read: boolean;
  write: boolean;
  admin: boolean;
  financial?: boolean;
  health?: boolean;
  civic?: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  soundEnabled: boolean;
  hapticFeedback: boolean;
  language: string;
  currency: string;
  privacyLevel: 'minimal' | 'standard' | 'maximum';
}

// ============================================
// SYSTEM & PLATFORM
// ============================================

export interface SystemContext {
  platform: string;
  version: string;
  environment: string;
  capabilities: string[];
  activeModules: string[];
  currentRoute: string | null;
  networkStatus: 'online' | 'offline' | 'slow';
  batteryLevel: number | null;
  timestamp: number;
}

// ============================================
// CONVERSATION
// ============================================

export interface ConversationMessage {
  id: string;
  role: 'user' | 'asis' | 'system';
  content: string;
  timestamp: number;
  metadata?: any;
}

export interface ConversationContext {
  id: string;
  messages: ConversationMessage[];
  startedAt: number;
  lastActivity: number;
  metadata: {
    source: string;
    intent: string | null;
    entities: string[];
  };
}

// ============================================
// AGENT SYSTEM
// ============================================

export interface AgentRequest {
  input: string;
  context: any;
  executionId: string;
  decision: OrchestratorDecision;
  timestamp: number;
}

export interface AgentResponse {
  content: string;
  type: 'text' | 'action' | 'confirmation_required' | 'error' | 'stream' | 'card';
  metadata?: any;
  actions?: AgentAction[];
}

export interface AgentAction {
  id: string;
  label: string;
  type: 'navigate' | 'confirm' | 'cancel' | 'open' | 'share' | 'copy';
  payload: any;
  requiresAuth?: boolean;
}

export interface OrchestratorDecision {
  targetAgent: string;
  confidence: number;
  intent: string;
  entities: string[];
  requiresConfirmation: boolean;
  fallbackAgents: string[];
}

// ============================================
// COUNTRY & FINTECH
// ============================================

export interface CountryProfile {
  code: string;
  name: string;
  currency: CurrencyProfile;
  taxRules: TaxRules;
  withdrawalMethods: string[];
  kycRules: KYCRules;
  complianceRules: ComplianceRules;
  locale: LocaleProfile;
  emergencyNumbers: Record<string, string>;
}

export interface CurrencyProfile {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface TaxRules {
  vatRate: number;
  withholdingTaxEnabled: boolean;
  digitalServicesTaxEnabled: boolean;
}

export interface KYCRules {
  tier1Limit: number;
  tier2Limit: number;
  tier3Limit: number;
  idRequired: boolean;
  addressVerificationRequired: boolean;
  biometricRequired: boolean;
}

export interface ComplianceRules {
  cbkRegulated: boolean;
  dataLocalizationRequired: boolean;
  transactionReportingThreshold: number;
}

export interface LocaleProfile {
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
}

// ============================================
// SECURITY & AUDIT
// ============================================

export interface AuditLogEntry {
  id: string;
  event: string;
  details: any;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================
// MEMORY SYSTEM
// ============================================

export interface MemoryEntry {
  id: string;
  type: 'fact' | 'preference' | 'behavior' | 'semantic';
  key: string;
  value: any;
  confidence: number;
  timestamp: number;
  ttl?: number;
  encrypted?: boolean;
}

export interface EmbeddingVector {
  id: string;
  vector: number[];
  text: string;
  metadata: any;
  timestamp: number;
}

// ============================================
// WALLET & FINANCE
// ============================================

export interface WalletContext {
  userId: string;
  balance: number;
  currency: string;
  pendingTransactions: number;
  lastTransaction: number;
  limits: WalletLimits;
}

export interface WalletLimits {
  daily: number;
  weekly: number;
  monthly: number;
  perTransaction: number;
}

export interface TransactionIntent {
  type: 'send' | 'receive' | 'pay' | 'withdraw' | 'deposit';
  amount: number;
  currency: string;
  recipient?: string;
  description?: string;
  metadata?: any;
}

// ============================================
// TRANSPORT
// ============================================

export interface TransportIntent {
  type: 'taxi' | 'truck' | 'delivery';
  pickup: LocationPoint;
  destination: LocationPoint;
  scheduledTime?: number;
  passengers?: number;
  cargoType?: string;
}

export interface LocationPoint {
  lat: number;
  lng: number;
  address?: string;
  label?: string;
}

// ============================================
// HEALTH
// ============================================

export interface HealthIntent {
  type: 'appointment' | 'record_access' | 'symptom_check' | 'emergency';
  providerId?: string;
  recordType?: string;
  symptoms?: string[];
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================
// RECOMMENDATION
// ============================================

export interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  reason: string;
  action: AgentAction;
  expiresAt?: number;
}
