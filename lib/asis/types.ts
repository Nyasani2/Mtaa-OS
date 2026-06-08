// ASIS v1 - Core Types
// African Super Intelligence System - MTAA Cognitive Layer

export interface AsisContext {
  userId: string;
  userName: string;
  language: string;
  region: string;
  timezone: string;
  currentApp: string;
  sessionId: string;
  timestamp: string;
}

export interface AsisUserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  kycStatus: 'verified' | 'pending' | 'unverified';
  skills: string[];
  education: EducationRecord[];
  workHistory: WorkRecord[];
  businesses: BusinessRecord[];
  communities: string[];
  interests: string[];
  preferredLanguage: string;
  createdAt: string;
}

export interface EducationRecord {
  institution: string;
  qualification: string;
  field: string;
  year: number;
}

export interface WorkRecord {
  employer: string;
  role: string;
  startDate: string;
  endDate?: string;
  skills: string[];
}

export interface BusinessRecord {
  name: string;
  type: string;
  registration: string;
  status: 'active' | 'inactive';
}

export interface AsisWalletContext {
  balance: number;
  currency: string;
  walletId: string;
  recentTransactions: TransactionSummary[];
  fraudScore: number;
  fxRates: Record<string, number>;
  paymentMethods: PaymentMethod[];
  monthlySpend: number;
  monthlyIncome: number;
  savingsGoal?: number;
}

export interface TransactionSummary {
  id: string;
  type: 'send' | 'receive' | 'pay' | 'withdraw' | 'deposit' | 'fx';
  amount: number;
  currency: string;
  counterparty: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  category?: string;
  riskFlag?: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'mobile_money' | 'bank' | 'card' | 'crypto';
  provider: string;
  last4?: string;
  isDefault: boolean;
  status: 'active' | 'inactive';
}

export interface AsisRequest {
  message: string;
  context: AsisContext;
  domain: string;
  history: AsisMessage[];
  attachments?: AsisAttachment[];
}

export interface AsisResponse {
  message: string;
  actions?: AsisAction[];
  insights?: AsisInsight[];
  confidence: number;
  domain: string;
  processingTime: number;
  model: string;
}

export interface AsisMessage {
  role: 'user' | 'asis' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AsisAction {
  type: 'navigate' | 'trigger' | 'suggest' | 'warn' | 'explain';
  target: string;
  payload?: Record<string, any>;
  description: string;
  requiresConfirmation: boolean;
}

export interface AsisInsight {
  type: 'pattern' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data?: Record<string, any>;
}

export interface AsisAttachment {
  type: 'image' | 'document' | 'audio' | 'location';
  url: string;
  mimeType: string;
  size: number;
}

export interface AsisSession {
  id: string;
  userId: string;
  app: string;
  messages: AsisMessage[];
  createdAt: string;
  updatedAt: string;
  contextSnapshot: AsisContext;
}

export interface AsisMemory {
  userId: string;
  shortTerm: AsisMessage[];      // Last 20 messages
  longTerm: MemoryEntry[];       // Key facts, preferences, patterns
  vectorStoreId?: string;        // Supabase vector store reference
}

export interface MemoryEntry {
  id: string;
  type: 'preference' | 'fact' | 'pattern' | 'goal' | 'relationship';
  content: string;
  confidence: number;
  source: string;
  createdAt: string;
  lastAccessed: string;
  accessCount: number;
}

export interface AsisConfig {
  provider: 'kimi' | 'openai' | 'claude' | 'local';
  model: string;
  maxTokens: number;
  temperature: number;
  rateLimitPerMinute: number;
  contextWindow: number;
  streaming: boolean;
  safetyEnabled: boolean;
  memoryEnabled: boolean;
}

export interface AsisSafetyCheck {
  passed: boolean;
  violations: SafetyViolation[];
  sanitizedMessage?: string;
}

export interface SafetyViolation {
  type: 'kernel_access' | 'auth_bypass' | 'data_exposure' | 'instruction_injection' | 'harmful_content';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  blocked: boolean;
}

export type AsisDomain = 
  | 'wallet'
  | 'transport'
  | 'health'
  | 'jobs'
  | 'tribes'
  | 'civic'
  | 'streets'
  | 'marketplace'
  | 'education'
  | 'appstore'
  | 'general';

export interface AsisProviderConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  maxRetries: number;
  timeout: number;
}
