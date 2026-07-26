/**
 * ASIS CSE — Cognitive Systems Engine
 * Core Type Definitions
 * Built on KAMOS Theory: 1⊗1 = 1 ⊕ f(growth, replication, interaction, observation)
 */

// ============================================================================
// KAMOS Mathematical Foundation
// ============================================================================

export interface KAMOSEntity {
  id: string;
  identity: IdentityVector;
  state: EntityState;
  context: ContextVector;
  timestamp: number;
  entropy: number;
}

export interface IdentityVector {
  selfModel: Record<string, number>;      // Who am I?
  persistence: number;                     // IDENTITY_PERSISTENCE (0.95)
  coherence: number;                       // Internal consistency
}

export interface EntityState {
  value: number;                           // Current KAMOS value
  growth: number;                          // Growth coefficient
  replication: number;                     // Replication coefficient
  interaction: number;                     // Interaction coefficient
  observation: number;                     // Observation coefficient
}

export interface ContextVector {
  environment: Record<string, unknown>;
  history: ContextSnapshot[];
  relevance: number;                       // Context relevance score
  decay: number;                           // CONTEXT_DECAY (0.1)
}

export interface ContextSnapshot {
  timestamp: number;
  variables: Record<string, unknown>;
  weight: number;
}

export type EmergenceFunction = (
  a: EntityState,
  b: EntityState,
  context: ContextVector
) => number;

export interface KAMOSField {
  entities: Map<string, KAMOSEntity>;
  coupling: number;                        // COUPLING = 0.618
  emergence: EmergenceFunction;
  timestamp: number;
}

// ============================================================================
// Memory Architecture (7 Tiers)
// ============================================================================

export type MemoryTier =
  | 'sensory'
  | 'working'
  | 'episodic'
  | 'semantic'
  | 'procedural'
  | 'strategic'
  | 'collective';

export interface MemoryEnvelope {
  id: string;
  tier: MemoryTier;
  payload: unknown;
  metadata: MemoryMetadata;
  createdAt: number;
  expiresAt: number | null;
  accessCount: number;
  lastAccessed: number;
}

export interface MemoryMetadata {
  source: string;                          // Engine ID that created this
  confidence: number;                      // 0.0 – 1.0
  salience: number;                        // Attention weight
  tags: string[];
  relations: string[];                     // Related memory IDs
}

export interface MemoryQuery {
  tier?: MemoryTier | MemoryTier[];
  tags?: string[];
  source?: string;
  minConfidence?: number;
  minSalience?: number;
  after?: number;
  before?: number;
  limit?: number;
}

export interface MemoryRetrieval {
  envelope: MemoryEnvelope;
  relevance: number;
  decayedSalience: number;
}

// ============================================================================
// Cognitive Engines
// ============================================================================

export type EngineId =
  | 'identity'
  | 'reality'
  | 'purpose'
  | 'attention'
  | 'observation'
  | 'evidence'
  | 'knowledge'
  | 'understanding'
  | 'reasoning'
  | 'simulation'
  | 'decision'
  | 'planning'
  | 'action'
  | 'feedback'
  | 'reflection'
  | 'learning'
  | 'adaptation'
  | 'wisdom'
  | 'collective'
  | 'evolution'
  | 'executive'
  | 'security';

export interface EngineConfig {
  id: EngineId;
  enabled: boolean;
  priority: number;                        // Lower = higher priority
  timeoutMs: number;
  maxMemoryFootprint: number;
  dependencies: EngineId[];
}

export interface EngineState {
  id: EngineId;
  status: 'idle' | 'running' | 'paused' | 'error';
  lastRun: number;
  runCount: number;
  errorCount: number;
  averageLatencyMs: number;
}

export interface CognitiveInput {
  id: string;
  source: string;                          // App ID or engine ID
  type: string;
  payload: unknown;
  context: ContextVector;
  timestamp: number;
  priority: number;
}

export interface CognitiveOutput {
  id: string;
  engineId: EngineId;
  inputId: string;
  type: string;
  payload: unknown;
  confidence: number;
  latencyMs: number;
  timestamp: number;
}

export interface EngineProcess {
  input: CognitiveInput;
  output: CognitiveOutput;
  memoryWrites: MemoryEnvelope[];
  memoryReads: MemoryRetrieval[];
}

// ============================================================================
// Cognitive Cycle
// ============================================================================

export type CyclePhase =
  | 'reality'
  | 'identity'
  | 'purpose'
  | 'attention'
  | 'observation'
  | 'evidence'
  | 'knowledge'
  | 'understanding'
  | 'reasoning'
  | 'simulation'
  | 'decision'
  | 'planning'
  | 'action'
  | 'feedback'
  | 'reflection'
  | 'learning'
  | 'adaptation'
  | 'wisdom'
  | 'collective'
  | 'evolution';

export interface CycleState {
  phase: CyclePhase;
  iteration: number;
  startTime: number;
  inputs: CognitiveInput[];
  outputs: Map<EngineId, CognitiveOutput>;
  workingMemory: MemoryEnvelope[];
  isComplete: boolean;
}

// ============================================================================
// Cognitive API
// ============================================================================

export interface APIRequest {
  id: string;
  appId: string;
  intent: string;
  payload: unknown;
  authToken: string;
  timestamp: number;
}

export interface APIResponse {
  id: string;
  requestId: string;
  status: 'success' | 'error' | 'deferred';
  payload: unknown;
  confidence: number;
  engineTrace: EngineId[];
  latencyMs: number;
  timestamp: number;
}

export interface APIEndpoint {
  path: string;
  method: 'query' | 'command' | 'subscribe' | 'broadcast';
  handler: (req: APIRequest) => Promise<APIResponse> | APIResponse;
  authRequired: boolean;
  rateLimit: number;
}

// ============================================================================
// Plugin Framework
// ============================================================================

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  permissions: PluginPermission[];
  hooks: PluginHook[];
  engines: EngineId[];
}

export type PluginPermission =
  | 'memory:read'
  | 'memory:write'
  | 'api:query'
  | 'api:command'
  | 'engine:observe'
  | 'engine:extend'
  | 'user:profile';

export interface PluginHook {
  event: string;
  handler: (ctx: HookContext) => Promise<unknown> | unknown;
  priority: number;
}

export interface HookContext {
  event: string;
  payload: unknown;
  memory: MemoryAPI;
  api: CognitiveAPIClient;
  source: string;
}

export interface MemoryAPI {
  query: (q: MemoryQuery) => Promise<MemoryRetrieval[]>;
  store: (envelope: Omit<MemoryEnvelope, 'id' | 'createdAt'>) => Promise<MemoryEnvelope>;
  forget: (id: string) => Promise<boolean>;
}

export interface CognitiveAPIClient {
  query: (intent: string, payload: unknown) => Promise<APIResponse>;
  command: (intent: string, payload: unknown) => Promise<APIResponse>;
  subscribe: (intent: string, callback: (res: APIResponse) => void) => () => void;
}

// ============================================================================
// Security & Trust
// ============================================================================

export interface TrustScore {
  entityId: string;
  score: number;                           // 0.0 – 1.0
  confidence: number;
  factors: TrustFactor[];
  lastUpdated: number;
}

export interface TrustFactor {
  name: string;
  weight: number;
  value: number;
  evidence: string[];
}

export interface AuditLog {
  id: string;
  timestamp: number;
  actor: string;
  action: string;
  resource: string;
  result: 'allow' | 'deny' | 'error';
  metadata: Record<string, unknown>;
}

// ============================================================================
// MTAA OS Integration
// ============================================================================

export interface ASISContext {
  userId: string;
  sessionId: string;
  deviceId: string;
  appId: string;
  permissions: string[];
  trustScore: number;
}

export interface ASISConfig {
  kernel: {
    cycleIntervalMs: number;
    maxConcurrentEngines: number;
    memoryCleanupIntervalMs: number;
  };
  memory: {
    sensoryTTLMs: number;
    workingMaxItems: number;
    episodicMaxItems: number;
    semanticMaxItems: number;
    proceduralMaxItems: number;
    strategicMaxItems: number;
    collectiveSyncIntervalMs: number;
  };
  api: {
    port: number;
    maxRequestSize: number;
    defaultTimeoutMs: number;
  };
  plugins: {
    enabled: boolean;
    sandboxed: boolean;
    maxPluginMemoryMb: number;
  };
}
