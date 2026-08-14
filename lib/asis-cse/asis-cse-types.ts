// @ts-nocheck
// ASIS-CSE Core Types
export interface CognitiveState {
  id: string;
  timestamp: number;
  context: ContextVector;
  intent: IntentData;
  memory: MemoryState;
}

export interface ContextVector {
  dimensions: Record<string, number>;
  timestamp: number;
  confidence: number;
}

export interface EntityState {
  id: string;
  type: string;
  attributes: Record<string, any>;
  relationships: string[];
  confidence: number;
}

export interface IntentData {
  category: IntentCategory;
  confidence: number;
  entities: string[];
  urgency: number;
  requiresTools: string[];
  suggestedActions: string[];
}

export type IntentCategory = 'query' | 'action' | 'creation' | 'analysis' | 'social' | 'commerce' | 'navigation' | 'system';

export interface MemoryState {
  shortTerm: MemoryEntry[];
  longTerm: MemoryEntry[];
  working: MemoryEntry[];
}

export interface MemoryEntry {
  id: string;
  type: string;
  content: any;
  confidence: number;
  timestamp: number;
  accessCount: number;
}

export interface MemoryQuery {
  id: string;
  query: string;
  results: MemoryEntry[];
  timestamp: number;
}

export interface ActionLog {
  id: string;
  action: string;
  target: string;
  result: any;
  confidence: number;
  timestamp: number;
}

export interface CollectiveMemory {
  id: string;
  community: string;
  entries: MemoryEntry[];
  consensus: number;
  lastUpdate: number;
}

export interface ConsensusReport {
  id: string;
  topic: string;
  agreement: number;
  participants: string[];
  timestamp: number;
}

export interface EvolutionProposal {
  id: string;
  type: string;
  description: string;
  impact: number;
  confidence: number;
  timestamp: number;
}

export interface EvidenceSet {
  id: string;
  sources: string[];
  confidence: number;
  timestamp: number;
}

export interface KnowledgeNode {
  id: string;
  label: string;
  type: string;
  confidence: { overall: number; sources: number };
  metadata: Record<string, any>;
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  confidence: number;
}

export interface PerformanceMetrics {
  id: string;
  accuracy: number;
  latency: number;
  throughput: number;
  timestamp: number;
}

export interface CognitiveAPIClient {
  id: string;
  endpoint: string;
  capabilities: string[];
  health: boolean;
}

export interface CognitiveEngine {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'inactive' | 'error';
}

export interface BaseCognitiveTool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  capabilities: ToolCapability[];
}

export interface ToolCapability {
  id: string;
  name: string;
  description: string;
}

export interface ToolParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ToolPermission {
  tool: string;
  action: string;
  granted: boolean;
}

export interface ToolHealthReport {
  toolName: string;
  available: boolean;
  healthy: boolean;
  score: number;
  lastError: string | undefined;
  capabilities: string[];
  executionCount: number;
  errorCount: number;
}

export interface ReasoningChain {
  id: string;
  steps: string[];
  conclusion: string;
  confidence: number;
  sources?: string[];
}

export interface ASISMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface KAMOSValue {
  value: number;
  confidence: number;
  timestamp: number;
}

export interface KamosState {
  userKnowledgeGraph: any;
  collectivePatterns: any;
  contextVector: ContextVector;
  newObservation: {
    query: string;
    parsedIntent: {
      category: IntentCategory;
      confidence: number;
      entities: string[];
      urgency: number;
      requiresTools: string[];
      suggestedActions: string[];
    };
    toolResults: any[];
    timestamp: number;
  };
}



// ─── ASIS UI Types (Canonical) ─────────────────────────────────

export interface ASISHealth {
  score: number;
  status: string;
}

export interface ASISMessage {
  id: string;
  role: 'user' | 'asis' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  metadata?: {
    engineName?: string;
    confidence?: number;
    explanation?: string;
    sources?: string[];
    toolUsed?: string;
    executionTimeMs?: number;
    cycleNumber?: number;
    [key: string]: any;
  };
}

export interface ASISConversation {
  id: string;
  title: string;
  messages: ASISMessage[];
  createdAt: number;
  updatedAt: number;
  contextId?: string;
}

export interface ASISState {
  isInitialized: boolean;
  isProcessing: boolean;
  systemStatus: string;
  activeEngines: string[];
  toolHealth: string;
  health: ASISHealth;
  currentConversation: ASISConversation | null;
  conversations: ASISConversation[];
}

export interface ASISActions {
  sendMessage: (content: string) => Promise<void>;
  clearConversation: () => void;
  newConversation: () => void;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  getDiagnostics: () => string;
  getMetrics: () => string;
  getClockReport: () => string;
  getToolHealth: () => string;
  shutdown: () => void;
}

export interface ASISProviderValue extends ASISState, ASISActions {}
// === MERGED FROM asis-cse-types-additions.ts ===
export interface EngineContext { id: string; sessionId: string; userId?: string; intent?: string; entities: Record<string, any>; history: EngineResult[]; metadata?: Record<string, any>; timestamp: number; }

export interface EngineResult { id: string; engineId: string; contextId: string; output: any; confidence: number; processingTime: number; timestamp: number; metadata?: Record<string, any>; }

export interface KnowledgeGraph { id: string; nodes: KnowledgeNode[]; edges: KnowledgeEdge[]; metadata?: Record<string, any>; }

export interface MentalModel { id: string; name: string; entities: string[]; relationships: string[]; dynamics: string[]; confidence: number; metadata?: Record<string, any>; }

export interface CausalLink { id: string; cause: string; effect: string; strength: number; confidence: number; metadata?: Record<string, any>; }

export interface Pattern { id: string; type: string; frequency: number; confidence: number; examples: string[]; metadata?: Record<string, any>; }

export interface AdaptationPolicy { id: string; name: string; rules: AdaptationRule[]; priority: number; active: boolean; metadata?: Record<string, any>; }

export interface AdaptationRule { condition: string; action: string; weight: number; }

export interface Decision { id: string; contextId: string; options: DecisionOption[]; selectedOption?: string; confidence: number; reasoning: string; timestamp: number; }

export interface DecisionOption { id: string; label: string; value: any; score: number; risks: string[]; benefits: string[]; }

export interface WisdomReport { id: string; contextId: string; insights: string[]; recommendations: string[]; confidence: number; adaptationPolicies: AdaptationPolicy[]; timestamp: number; }

export interface ResearchResult { id: string; query: string; sources: ResearchSource[]; findings: string[]; confidence: number; timestamp: number; }

export interface ResearchSource { id: string; name: string; url?: string; reliability: number; relevance: number; metadata?: Record<string, any>; }

export interface ResponseEngineInput { query: string; context?: EngineContext; options?: Record<string, any>; }

export interface ReasoningStep { id: string; premise: string; inference: string; evidence: string[]; confidence: number; }

export interface FeedbackReport { id: string; engineId: string; rating: number; comments?: string; issues: string[]; suggestions: string[]; timestamp: number; }

export interface ReflectionReport { id: string; engineId: string; lessons: Lesson[]; improvements: string[]; confidence: number; timestamp: number; }

export interface Lesson { id: string; type: 'success' | 'failure' | 'reinforcement'; description: string; confidence: number; applicableContexts: string[]; }

export interface Hypothesis { id: string; statement: string; evidence: string[]; confidence: number; testable: boolean; }

export interface Conclusion { id: string; statement: string; evidence: string[]; confidence: number; reasoning: string; }

export interface ConfidenceScore { value: number; factors: string[]; timestamp: number; }

export interface ExecutionPlan { id: string; contextId: string; tasks: Task[]; milestones: Milestone[]; estimatedDuration: number; confidence: number; timestamp: number; }

export interface Task { id: string; label: string; description?: string; status: 'pending' | 'in_progress' | 'completed' | 'failed'; dependencies: string[]; requiredResources: string[]; estimatedDuration: number; assignedTo?: string; metadata?: Record<string, any>; }

export interface Milestone { id: string; label: string; tasks: string[]; criteria: string[]; completed: boolean; completedAt?: string; }

export interface Scenario { id: string; label: string; probability: number; impact: number; children: Scenario[]; metadata?: Record<string, any>; }

export interface ScenarioTree { root: Scenario; depth: number; branchingFactor: number; }

export interface RiskReport { id: string; contextId: string; risks: Risk[]; mitigations: string[]; overallRisk: number; timestamp: number; }

export interface Risk { id: string; label: string; probability: number; impact: number; severity: number; }

export interface Fact { id: string; statement: string; source?: string; confidence: number; verified: boolean; timestamp: number; }

export interface SynthesizedResponse { id: string; text: string; data?: Record<string, any>; sources: string[]; confidence: number; timestamp: number; }

export interface EngineInput { query: string; context?: Record<string, any>; options?: Record<string, any>; }