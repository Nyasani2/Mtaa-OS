/**
 * ASIS v7 — Self-Contained Intelligence Engine
 * Types and Interfaces
 * No API dependency. Internet is the data center.
 * Kamos Theory: 1×1 = 1 + f(growth, replication, interaction, observation)
 */

// ─── Core Message Types ──────────────────────────────────────────

export type MessageRole = 'user' | 'asis' | 'system' | 'tool';

export interface ASISv7Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  intent?: IntentResult;
  toolOutputs?: ToolOutput[];
  sources?: Source[];
  images?: string[];
  relatedQuestions?: string[];
  metadata?: Record<string, any>;
}

export interface Source {
  title: string;
  url: string;
  source: string;
  snippet?: string;
  relevance: number;
}

// ─── Intent Classification ───────────────────────────────────────

export interface IntentResult {
  category: IntentCategory;
  confidence: number; // 0-1
  entities: Entity[];
  urgency: number; // 0-1
  requiresTools: ToolType[];
  suggestedActions: string[];
}

export type IntentCategory =
  | 'weather'
  | 'news'
  | 'math'
  | 'code_help'
  | 'code_execution'
  | 'database_query'
  | 'device_search'
  | 'device_photos'
  | 'device_documents'
  | 'onboarding'
  | 'app_navigation'
  | 'wallet_query'
  | 'wallet_action'
  | 'health_query'
  | 'education_query'
  | 'social_query'
  | 'transport_query'
  | 'civic_query'
  | 'general_knowledge'
  | 'translation'
  | 'writing_help'
  | 'image_analysis'
  | 'calculator'
  | 'time_date'
  | 'location'
  | 'definition'
  | 'how_to'
  | 'comparison'
  | 'summarization'
  | 'creative_writing'
  | 'greeting'
  | 'farewell'
  | 'gratitude'
  | 'complaint'
  | 'small_talk'
  | 'system_command'
  | 'unknown';

export interface Entity {
  type: EntityType;
  value: string;
  position: [number, number]; // start, end indices
  confidence: number;
}

export type EntityType =
  | 'location'
  | 'date'
  | 'time'
  | 'number'
  | 'app_name'
  | 'table_name'
  | 'person'
  | 'currency'
  | 'phone_number'
  | 'email'
  | 'url'
  | 'file_type'
  | 'language'
  | 'color'
  | 'unit'
  | 'operation';

// ─── Tool System ────────────────────────────────────────────────

export type ToolType =
  | 'search'
  | 'code_execute'
  | 'database_query'
  | 'device_photos'
  | 'device_documents'
  | 'device_contacts'
  | 'shell_command'
  | 'calculator'
  | 'news_rss'
  | 'weather_parse'
  | 'translation'
  | 'knowledge_base';

export interface ToolOutput {
  tool: ToolType;
  success: boolean;
  data: any;
  error?: string;
  executionTime: number;
}

export interface ToolConfig {
  id: ToolType;
  name: string;
  description: string;
  requiresPermission?: string;
  maxExecutionTime: number; // ms
  enabled: boolean;
}

// ─── Kamos Theory ───────────────────────────────────────────────

export interface KamosState {
  // GROWTH: What we've learned from this user
  userKnowledgeGraph: KnowledgeGraph;
  // REPLICATION: Patterns shared across all users (anonymized)
  collectivePatterns: CollectivePattern[];
  // INTERACTION: Current context
  contextVector: ContextVector;
  // OBSERVATION: What we just learned
  newObservation: Observation;
}

export interface KnowledgeGraph {
  userId: string;
  facts: KnowledgeFact[];
  preferences: UserPreference[];
  interactionHistory: InteractionRecord[];
  lastUpdated: number;
}

export interface KnowledgeFact {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  source: 'explicit' | 'inferred' | 'observed';
  timestamp: number;
}

export interface UserPreference {
  category: string;
  key: string;
  value: any;
  weight: number; // 0-1, how strongly held
}

export interface InteractionRecord {
  query: string;
  intent: IntentCategory;
  satisfaction: number; // 0-1, inferred from follow-up behavior
  timestamp: number;
}

export interface CollectivePattern {
  patternId: string;
  intent: IntentCategory;
  queryPattern: string; // regex or template
  responseTemplate: string;
  successRate: number;
  usageCount: number;
  anonymized: boolean;
}

export interface ContextVector {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  location?: { lat: number; lng: number; name?: string };
  activeApp?: string;
  recentApps: string[];
  recentQueries: string[];
  deviceState: DeviceState;
  networkState: NetworkState;
}

export interface DeviceState {
  batteryLevel: number;
  isCharging: boolean;
  storageUsed: number;
  storageTotal: number;
  osVersion: string;
  appVersion: string;
}

export interface NetworkState {
  type: string;
  isConnected: boolean;
  isInternetReachable: boolean;
}

export interface Observation {
  query: string;
  parsedIntent: IntentResult;
  toolResults: ToolOutput[];
  userFeedback?: number; // -1 to 1
  timestamp: number;
}

// ─── Search Engine ──────────────────────────────────────────────

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  relevance: number;
  timestamp?: number;
  type: 'web' | 'news' | 'wiki' | 'local' | 'community';
}

export interface SearchQuery {
  query: string;
  intent: IntentCategory;
  entities: Entity[];
  filters?: SearchFilters;
}

export interface SearchFilters {
  timeRange?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  sourceType?: 'news' | 'wiki' | 'academic' | 'all';
  language?: string;
  location?: string;
}

// ─── Code Execution ─────────────────────────────────────────────

export interface CodeExecutionRequest {
  code: string;
  language: 'javascript' | 'python';
  timeout: number;
  context?: Record<string, any>;
}

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  returnValue?: any;
  executionTime: number;
  logs: string[];
}

// ─── Database ───────────────────────────────────────────────────

export interface NLQueryResult {
  sql: string;
  explanation: string;
  table: string;
  columns: string[];
  conditions: QueryCondition[];
  orderBy?: string;
  limit?: number;
}

export interface QueryCondition {
  column: string;
  operator: string;
  value: any;
}

// ─── Device Access ──────────────────────────────────────────────

export interface PhotoQuery {
  person?: string;
  dateRange?: { start: number; end: number };
  location?: string;
  album?: string;
}

export interface DocumentQuery {
  text: string;
  fileTypes?: string[];
  dateRange?: { start: number; end: number };
}

// ─── Response ───────────────────────────────────────────────────

export interface ASISv7SynthesizedResponse {
  text: string;
  facts: string[];
  details: string[];
  followUpSuggestions: string[];
  confidence: number;
  sources: Source[];
  requiresAction?: boolean;
  action?: {
    type: string;
    payload: any;
  };
}

export interface ASISPersonality {
  name: string;
  greetingStyle: 'formal' | 'casual' | 'friendly' | 'professional';
  verbosity: 'concise' | 'balanced' | 'detailed';
  humor: number; // 0-1
  empathy: number; // 0-1
  technicalDepth: number; // 0-1
  culturalAwareness: string[]; // e.g., ['african', 'global']
}

// ─── Session ────────────────────────────────────────────────────

export interface ASISSession {
  id: string;
  userId: string;
  messages: ASISv7Message[];
  context: ContextVector;
  kamosState: KamosState;
  createdAt: number;
  updatedAt: number;
}
