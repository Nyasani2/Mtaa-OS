// ============================================================
// COGNITION INTERFACES — Service contracts for brain system
// ============================================================

import {
  RawInput, PerceptionState, UnifiedContext, ResolvedIntent,
  MemorySlice, DecisionGraph, ToolCandidate, AgentRoute,
  SafetyCheck, ResponsePlan, CognitiveState, CognitiveOutput
} from './types';

export interface IPerceptionLayer {
  process(input: RawInput): Promise<PerceptionState>;
  detectDomain(text: string): Promise<string>;
  extractEntities(text: string): Promise<any[]>;
  detectUrgency(text: string): Promise<string>;
  detectAmbiguity(text: string, entities: any[]): Promise<number>;
}

export interface IContextBuilder {
  build(sessionId: string, userId: string, perception: PerceptionState): Promise<UnifiedContext>;
  trim(context: UnifiedContext, budget: number): UnifiedContext;
  scoreRelevance(memory: MemorySlice, context: UnifiedContext): number;
  filterNoise(context: UnifiedContext): UnifiedContext;
}

export interface IIntentResolution {
  resolve(perception: PerceptionState, context: UnifiedContext): Promise<ResolvedIntent>;
  detectMultiIntent(text: string): Promise<string[]>;
  scoreAmbiguity(intents: any[]): Promise<number>;
  suggestClarifications(ambiguityScore: number, intents: any[]): Promise<string[]>;
}

export interface IMemoryInjection {
  inject(context: UnifiedContext, domain: string, limit?: number): Promise<MemorySlice[]>;
  scoreRelevance(memory: MemorySlice, context: UnifiedContext): number;
  filterByPrivacy(memory: MemorySlice[], userConsent: boolean): MemorySlice[];
  validateConsent(memory: MemorySlice, userId: string): Promise<boolean>;
}

export interface IDecisionGraph {
  create(initialState: CognitiveState): DecisionGraph;
  traverse(graph: DecisionGraph, state: CognitiveState): Promise<DecisionGraph>;
  addNode(graph: DecisionGraph, node: any): void;
  getExplainability(graph: DecisionGraph): string[];
  evaluateRisk(graph: DecisionGraph, state: CognitiveState): string;
}

export interface IToolSelection {
  select(intent: ResolvedIntent, context: UnifiedContext, safetyLevel: string): Promise<ToolCandidate[]>;
  score(tool: any, intent: ResolvedIntent, context: UnifiedContext): number;
  avoidRedundancy(tools: ToolCandidate[]): ToolCandidate[];
}

export interface IAgentRouting {
  route(intent: ResolvedIntent, tools: ToolCandidate[], context: UnifiedContext): Promise<AgentRoute[]>;
  coordinate(routes: AgentRoute[]): Promise<AgentRoute[]>;
  resolveConflicts(routes: AgentRoute[]): AgentRoute[];
  getFallback(route: AgentRoute): string | undefined;
}

export interface ISafetyCheckpoint {
  validate(state: CognitiveState): Promise<SafetyCheck[]>;
  checkConsent(state: CognitiveState): Promise<SafetyCheck>;
  checkSecurity(state: CognitiveState): Promise<SafetyCheck>;
  checkRisk(state: CognitiveState): Promise<SafetyCheck>;
  checkDomainRestrictions(state: CognitiveState): Promise<SafetyCheck>;
}

export interface IResponsePlanner {
  plan(state: CognitiveState): Promise<ResponsePlan>;
  generateResponse(state: CognitiveState): Promise<string>;
  generateExplanation(state: CognitiveState): Promise<string>;
  calculateConfidence(state: CognitiveState): Promise<number>;
}
