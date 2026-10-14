export interface KAMOSValue { value: number; confidence: number; timestamp: number; }
export interface ASISHealth { status: string; lastCheck: number; }

export interface CognitiveEngine {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'inactive' | 'error';
  capabilities: string[];
}

export interface EngineContext {
  id: string;
  sessionId: string;
  userId?: string;
  intent?: string;
  entities: Record<string, any>;
  history: EngineResult[];
  inputs?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface EngineResult {
  id?: string;
  engineId: string;
  contextId?: string;
  output?: any;
  outputs?: any[];
  confidence: number | { overall: number; logical?: number; evidence?: number };
  processingTime: number;
  timestamp: number;
  metadata?: Record<string, any>;
  explanation?: string;
  traceId?: string;
}

export interface KnowledgeNode {
  id: string;
  label: string;
  type: string;
  confidence: { overall: number; sources: number };
  metadata?: Record<string, any>;
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  confidence: number | { overall: number; logical?: number; evidence?: number };
}

export interface KnowledgeGraph {
  id: string;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  metadata?: Record<string, any>;
}

export interface MentalModel {
  id: string;
  name: string;
  domain?: string;
  description?: string;
  entities: string[];
  relationships: string[];
  dynamics: string[];
  confidence: number | { overall: number; logical?: number; evidence?: number };
  createdAt?: number;
  updatedAt?: number;
  validationHistory?: any[];
}

export interface CausalLink {
  id: string;
  cause: string;
  effect: string;
  strength: number;
  confidence: number | { overall: number; logical?: number; evidence?: number };
  mechanism?: string;
  conditions?: string[];
  validated?: boolean;
  discoveredAt?: number;
}

export interface Pattern {
  id: string;
  name: string;
  domain?: string;
  description?: string;
  type: string;
  frequency: number;
  entities: string[];
  confidence: number | { overall: number; logical?: number; evidence?: number };
  examples?: string[];
  firstObserved?: number;
  lastObserved?: number;
  metadata?: Record<string, any>;
}

export interface Decision {
  id: string;
  contextId: string;
  options: any[];
  selectedOption?: string;
  selectedStrategy?: any;
  explanation?: string;
  traceId?: string;
  confidence: number | { overall: number; logical?: number; evidence?: number };
}

export interface WisdomReport {
  id: string;
  contextId: string;
  decisionId?: string;
  insights: string[];
  recommendations: string[];
  recommendation?: any;
  longTermAssessment?: any;
  balancedObjectives?: any;
  ethicalClearance?: any;
  wellbeingAssessment?: any;
  trapPrevention?: any;
  strategicGuidance?: any;
  civilisationImpact?: { level: string; details: string };
  confidence: number | { overall: number; logical?: number; evidence?: number };
  adaptationPolicies: any[];
  timestamp: number;
}

export interface ASISMessage {
  id: string;
  role: 'user' | 'asis' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
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
