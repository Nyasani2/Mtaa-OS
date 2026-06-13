/**
 * ASIS Layer 4 — Memory & Personalization Types
 * System-wide memory contracts with privacy controls
 */

export enum MemoryLayer {
  SHORT_TERM = 'short_term',    // Session/contextual (TTL: 1 hour)
  LONG_TERM = 'long_term',      // Persistent facts (TTL: indefinite)
  SEMANTIC = 'semantic',        // Vector embeddings (TTL: indefinite)
  PREFERENCE = 'preference',    // User choices (TTL: indefinite)
  SECURITY = 'security',        // Auth/audit (TTL: 90 days)
}

export enum MemoryPriority {
  CRITICAL = 1,   // Always retained
  HIGH = 2,       // Retain unless storage pressure
  NORMAL = 3,     // Standard retention
  LOW = 4,        // Ephemeral, discardable
}

export interface MemoryEntry {
  id: string;
  layer: MemoryLayer;
  key: string;
  value: unknown;
  priority: MemoryPriority;
  contextScope: ContextScope;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  source: MemorySource;
  confidence: number; // 0-1
  tags: string[];
  encrypted: boolean;
  version: number;
}

export interface MemorySource {
  type: 'conversation' | 'behavior' | 'explicit' | 'inferred' | 'system' | 'imported';
  agentId?: string;
  sessionId?: string;
  conversationId?: string;
}

export enum ContextScope {
  GLOBAL = 'global',
  WALLET = 'wallet',
  HEALTH = 'health',
  TRANSPORT = 'transport',
  CIVIC = 'civic',
  SHOP = 'shop',
  MARKETPLACE = 'marketplace',
  EDUCATION = 'education',
  JOBS = 'jobs',
  TRIBES = 'tribes',
  ENGINEERING = 'engineering',
  ADMIN = 'admin',
}

export interface MemoryQuery {
  layer?: MemoryLayer | MemoryLayer[];
  contextScope?: ContextScope | ContextScope[];
  key?: string;
  keyPattern?: string;
  tags?: string[];
  sourceType?: MemorySource['type'];
  minConfidence?: number;
  before?: Date;
  after?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'confidence';
  sortOrder?: 'asc' | 'desc';
}

export interface MemoryStats {
  totalEntries: number;
  byLayer: Record<MemoryLayer, number>;
  byScope: Record<ContextScope, number>;
  storageBytes: number;
  oldestEntry: Date;
  newestEntry: Date;
}

export interface EmbeddingVector {
  id: string;
  text: string;
  vector: number[];
  metadata: Record<string, unknown>;
  contextScope: ContextScope;
  createdAt: Date;
}

export interface SemanticSearchResult {
  entry: MemoryEntry | EmbeddingVector;
  score: number;
  matchedText?: string;
}

export interface BehaviorEvent {
  id: string;
  type: BehaviorEventType;
  timestamp: Date;
  sessionId: string;
  userId: string;
  agentId?: string;
  domain: ContextScope;
  action: string;
  payload: Record<string, unknown>;
  outcome: 'success' | 'failure' | 'cancelled' | 'ignored' | 'pending';
  durationMs?: number;
  metadata: {
    deviceType?: string;
    networkType?: 'wifi' | '4g' | '3g' | '2g' | 'offline';
    location?: string;
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  };
}

export enum BehaviorEventType {
  WALLET_ACTION = 'wallet_action',
  RIDE_REQUEST = 'ride_request',
  SEARCH_QUERY = 'search_query',
  SUGGESTION_ACCEPTED = 'suggestion_accepted',
  SUGGESTION_IGNORED = 'suggestion_ignored',
  PREFERENCE_SET = 'preference_set',
  SCREEN_VIEW = 'screen_view',
  BUTTON_TAP = 'button_tap',
  FORM_SUBMIT = 'form_submit',
  NOTIFICATION_OPEN = 'notification_open',
  CONVERSATION_TURN = 'conversation_turn',
  APP_INSTALL = 'app_install',
  APP_LAUNCH = 'app_launch',
}

export interface UserPreference {
  id: string;
  category: string;
  key: string;
  value: unknown;
  confidence: number;
  source: 'explicit' | 'implicit' | 'inferred';
  updatedAt: Date;
  sampleSize: number;
}

export interface PreferenceCategory {
  name: string;
  description: string;
  scope: ContextScope;
  editable: boolean;
  deletable: boolean;
  entries: UserPreference[];
}
