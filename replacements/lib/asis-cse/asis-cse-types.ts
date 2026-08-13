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
