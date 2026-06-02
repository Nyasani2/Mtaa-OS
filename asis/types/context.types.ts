/**
 * ASIS Layer 4 — Context Enrichment Types
 * Conversation history injection and context building
 */

export interface ConversationTurn {
  id: string;
  sessionId: string;
  timestamp: Date;
  role: 'user' | 'asis' | 'system' | 'agent';
  agentId?: string;
  content: string;
  intent?: string;
  entities: ExtractedEntity[];
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed';
  contextScope: ContextScope;
  metadata: {
    language?: string;
    confidence?: number;
    processingTimeMs?: number;
  };
}

export interface ExtractedEntity {
  type: string;
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  normalizedValue?: unknown;
}

export interface ConversationSession {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date;
  turns: ConversationTurn[];
  summary?: string;
  topics: string[];
  activeScopes: ContextScope[];
  totalTurns: number;
}

export interface ContextSlice {
  scope: ContextScope;
  relevance: number; // 0-1
  data: Record<string, unknown>;
  memory: MemoryEntry[];
  expiresAt: Date;
}

export interface EnrichedContext {
  userId: string;
  sessionId: string;
  timestamp: Date;
  global: ContextSlice;
  slices: ContextSlice[];
  conversation: ConversationTurn[];
  preferences: UserPreference[];
  behaviorPatterns: BehaviorPattern[];
  availableAgents: string[];
  suggestedActions: SuggestedAction[];
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  lastObserved: Date;
  confidence: number;
  examples: string[];
}

export interface SuggestedAction {
  action: string;
  agent: string;
  confidence: number;
  reason: string;
  params?: Record<string, unknown>;
}

export interface ContextBuilderConfig {
  maxConversationHistory: number;
  maxMemoryEntries: number;
  maxBehaviorPatterns: number;
  relevanceThreshold: number;
  scopeTimeoutMs: number;
  enableSemanticSearch: boolean;
  enableBehaviorInference: boolean;
}
