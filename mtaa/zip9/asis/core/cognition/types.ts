// ============================================================
// COGNITION TYPES — ASIS Brain System (ZIP 9)
// Pure cognition layer — no UI, no agents, no feature logic
// ============================================================

export type InputType = 'text' | 'voice' | 'structured' | 'gesture' | 'system_event';
export type Domain = 'general' | 'wallet' | 'health' | 'transport' | 'cash' | 'civic' | 'education' | 'marketplace' | 'system';
export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low' | 'background';
export type ConfidenceLevel = 'certain' | 'high' | 'medium' | 'low' | 'unknown';
export type ReasoningStatus = 'perceiving' | 'building_context' | 'resolving_intent' | 'injecting_memory' | 'traversing_graph' | 'selecting_tools' | 'routing_agents' | 'safety_check' | 'planning_response' | 'complete' | 'failed' | 'interrupted';
export type ExecutionPath = 'direct' | 'clarification' | 'navigator' | 'delegated' | 'blocked' | 'fallback';

export interface RawInput {
  id: string;
  type: InputType;
  payload: string | Record<string, any>;
  timestamp: string;
  sessionId: string;
  userId: string;
  metadata?: { source?: string; locale?: string; deviceType?: string };
}

export interface PerceptionState {
  inputId: string;
  normalizedText: string;
  entities: ExtractedEntity[];
  detectedDomain: Domain;
  urgency: UrgencyLevel;
  ambiguityScore: number; // 0-1, higher = more ambiguous
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  language: string;
  confidence: ConfidenceLevel;
}

export interface ExtractedEntity {
  type: 'person' | 'location' | 'amount' | 'date' | 'time' | 'service' | 'product' | 'provider' | 'action' | 'domain' | 'intent' | 'unknown';
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export interface UnifiedContext {
  sessionId: string;
  userId: string;
  currentDomain: Domain;
  recentActions: RecentAction[];
  userProfileSignals: ProfileSignal[];
  memorySlices: MemorySlice[];
  environmentState: EnvironmentState;
  tokenBudgetUsed: number;
  tokenBudgetMax: number;
}

export interface RecentAction {
  id: string;
  action: string;
  domain: Domain;
  timestamp: string;
  outcome: 'success' | 'failure' | 'pending';
  toolUsed?: string;
  agentUsed?: string;
}

export interface ProfileSignal {
  type: 'preference' | 'habit' | 'restriction' | 'capability' | 'kyc_level';
  key: string;
  value: any;
  confidence: number;
  lastUpdated: string;
}

export interface MemorySlice {
  id: string;
  type: 'short_term' | 'long_term' | 'preference' | 'semantic';
  content: string;
  relevanceScore: number; // 0-1
  privacyLevel: 'public' | 'sensitive' | 'restricted';
  timestamp: string;
  consentValid: boolean;
}

export interface EnvironmentState {
  networkStatus: 'online' | 'offline' | 'degraded';
  deviceCapability: 'high' | 'medium' | 'low';
  timeOfDay: string;
  locationContext?: string;
}

export interface ResolvedIntent {
  id: string;
  primaryIntent: Intent;
  secondaryIntents: Intent[];
  confidence: ConfidenceLevel;
  ambiguityScore: number;
  suggestedClarifications: string[];
  requiresConfirmation: boolean;
}

export interface Intent {
  name: string;
  domain: Domain;
  action: string;
  parameters: Record<string, any>;
  confidence: number;
}

export interface DecisionNode {
  id: string;
  type: 'condition' | 'action' | 'fallback' | 'risk_eval' | 'merge';
  label: string;
  condition?: (state: CognitiveState) => boolean;
  action?: (state: CognitiveState) => Promise<CognitiveState>;
  riskLevel?: 'safe' | 'caution' | 'danger';
  weight: number;
  children: string[]; // node IDs
  parent?: string;
  executed: boolean;
  result?: any;
}

export interface DecisionGraph {
  id: string;
  rootNodeId: string;
  nodes: Map<string, DecisionNode>;
  currentNodeId: string;
  path: string[];
  explainability: string[];
}

export interface ToolCandidate {
  toolId: string;
  name: string;
  domain: Domain;
  intentMatch: number; // 0-1
  safetyLevel: 'safe' | 'caution' | 'danger';
  minKycLevel: number;
  historicalSuccessRate: number;
  estimatedLatencyMs: number;
  score: number;
  selected: boolean;
}

export interface AgentRoute {
  agentId: string;
  name: string;
  domain: Domain;
  priority: number;
  executionOrder: 'parallel' | 'sequential';
  dependencies: string[]; // agent IDs this depends on
  fallbackAgentId?: string;
  input: Record<string, any>;
  expectedOutput: string;
}

export interface SafetyCheck {
  checkpoint: string;
  passed: boolean;
  riskLevel: 'safe' | 'caution' | 'danger';
  violations: string[];
  requiredConsents: string[];
  alternativePath?: string;
  explanation: string;
}

export interface CognitiveState {
  input: RawInput;
  perception: PerceptionState | null;
  context: UnifiedContext | null;
  intent: ResolvedIntent | null;
  memory: MemorySlice[];
  decisionGraph: DecisionGraph | null;
  selectedTools: ToolCandidate[];
  agentRoutes: AgentRoute[];
  safetyChecks: SafetyCheck[];
  responsePlan: ResponsePlan | null;
  status: ReasoningStatus;
  errors: string[];
  startTime: number;
  lastUpdate: number;
}

export interface ResponsePlan {
  finalResponse: string;
  explanation: string;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  toolsUsed: string[];
  agentsTriggered: string[];
  suggestedActions: string[];
  fallbackSuggestion?: string;
  requiresUserInput: boolean;
  safetyLevel: 'safe' | 'caution' | 'danger';
}

export interface CognitiveOutput {
  response: string;
  reasoningPath: string[];
  confidence: ConfidenceLevel;
  confidenceScore: number;
  toolsUsed: string[];
  agentsTriggered: string[];
  safetyPassed: boolean;
  executionPath: ExecutionPath;
  processingTimeMs: number;
  status: ReasoningStatus;
}
