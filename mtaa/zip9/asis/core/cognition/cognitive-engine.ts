// ============================================================
// COGNITIVE ENGINE — Central orchestrator of ASIS intelligence
// Pipeline: INPUT → PERCEPTION → CONTEXT → INTENT → MEMORY →
//           DECISION GRAPH → TOOLS → AGENTS → SAFETY → RESPONSE
// Supports: async steps, interruptibility, fallback paths
// ============================================================

import {
  RawInput, CognitiveState, ReasoningStatus, CognitiveOutput,
  ExecutionPath, PerceptionState, UnifiedContext, ResolvedIntent,
  MemorySlice, DecisionGraph, ToolCandidate, AgentRoute, SafetyCheck, ResponsePlan
} from './types';
import { IPerceptionLayer, IContextBuilder, IIntentResolution, IMemoryInjection, IDecisionGraph, IToolSelection, IAgentRouting, ISafetyCheckpoint, IResponsePlanner } from './interfaces';
import { ReasoningRules } from './rules/reasoning-rules';
import { PrioritizationRules } from './rules/prioritization-rules';

export class CognitiveEngine {
  private perception: IPerceptionLayer;
  private contextBuilder: IContextBuilder;
  private intentResolver: IIntentResolution;
  private memoryInjector: IMemoryInjection;
  private decisionGraph: IDecisionGraph;
  private toolSelector: IToolSelection;
  private agentRouter: IAgentRouting;
  private safetyCheckpoint: ISafetyCheckpoint;
  private responsePlanner: IResponsePlanner;
  private reasoningRules: ReasoningRules;
  private prioritizationRules: PrioritizationRules;
  private interruptFlag: boolean = false;
  private stateListeners: ((state: CognitiveState) => void)[] = [];

  constructor(deps: {
    perception: IPerceptionLayer;
    contextBuilder: IContextBuilder;
    intentResolver: IIntentResolution;
    memoryInjector: IMemoryInjection;
    decisionGraph: IDecisionGraph;
    toolSelector: IToolSelection;
    agentRouter: IAgentRouting;
    safetyCheckpoint: ISafetyCheckpoint;
    responsePlanner: IResponsePlanner;
  }) {
    this.perception = deps.perception;
    this.contextBuilder = deps.contextBuilder;
    this.intentResolver = deps.intentResolver;
    this.memoryInjector = deps.memoryInjector;
    this.decisionGraph = deps.decisionGraph;
    this.toolSelector = deps.toolSelector;
    this.agentRouter = deps.agentRouter;
    this.safetyCheckpoint = deps.safetyCheckpoint;
    this.responsePlanner = deps.responsePlanner;
    this.reasoningRules = new ReasoningRules();
    this.prioritizationRules = new PrioritizationRules();
  }

  async process(input: RawInput): Promise<CognitiveOutput> {
    const startTime = Date.now();
    this.interruptFlag = false;

    // Initialize state
    let state: CognitiveState = {
      input,
      perception: null,
      context: null,
      intent: null,
      memory: [],
      decisionGraph: null,
      selectedTools: [],
      agentRoutes: [],
      safetyChecks: [],
      responsePlan: null,
      status: 'perceiving',
      errors: [],
      startTime,
      lastUpdate: startTime,
    };

    try {
      // === STEP 1: PERCEPTION ===
      state = await this.stepPerception(state);
      if (this.interruptFlag) return this.buildInterruptedOutput(state, startTime);

      // === STEP 2: CONTEXT BUILDING ===
      state = await this.stepContextBuild(state);
      if (this.interruptFlag) return this.buildInterruptedOutput(state, startTime);

      // === STEP 3: INTENT RESOLUTION ===
      state = await this.stepIntentResolution(state);
      if (this.interruptFlag) return this.buildInterruptedOutput(state, startTime);

      // === STEP 4: MEMORY INJECTION ===
      state = await this.stepMemoryInjection(state);
      if (this.interruptFlag) return this.buildInterruptedOutput(state, startTime);

      // === STEP 5: DECISION GRAPH ===
      state = await this.stepDecisionGraph(state);
      if (this.interruptFlag) return this.buildInterruptedOutput(state, startTime);

      // === STEP 6: TOOL SELECTION ===
      state = await this.stepToolSelection(state);
      if (this.interruptFlag) return this.buildInterruptedOutput(state, startTime);

      // === STEP 7: AGENT ROUTING ===
      state = await this.stepAgentRouting(state);
      if (this.interruptFlag) return this.buildInterruptedOutput(state, startTime);

      // === STEP 8: SAFETY CHECKPOINT ===
      state = await this.stepSafetyCheck(state);
      if (this.interruptFlag) return this.buildInterruptedOutput(state, startTime);

      // === STEP 9: RESPONSE PLANNING ===
      state = await this.stepResponsePlan(state);

      return this.buildOutput(state, startTime);

    } catch (error) {
      state.errors.push(error instanceof Error ? error.message : String(error));
      state.status = 'failed';
      return this.buildOutput(state, startTime);
    }
  }

  interrupt(): void { this.interruptFlag = true; }
  onStateChange(listener: (state: CognitiveState) => void): () => void {
    this.stateListeners.push(listener);
    return () => { this.stateListeners = this.stateListeners.filter(l => l !== listener); };
  }

  private async stepPerception(state: CognitiveState): Promise<CognitiveState> {
    state.status = 'perceiving';
    this.notifyState(state);
    const perception = await this.perception.process(state.input);
    return { ...state, perception, status: 'building_context', lastUpdate: Date.now() };
  }

  private async stepContextBuild(state: CognitiveState): Promise<CognitiveState> {
    state.status = 'building_context';
    this.notifyState(state);
    if (!state.perception) throw new Error('Perception required for context building');
    const context = await this.contextBuilder.build(
      state.input.sessionId, state.input.userId, state.perception
    );
    const trimmed = this.contextBuilder.trim(context, 4000); // token budget
    const filtered = this.contextBuilder.filterNoise(trimmed);
    return { ...state, context: filtered, status: 'resolving_intent', lastUpdate: Date.now() };
  }

  private async stepIntentResolution(state: CognitiveState): Promise<CognitiveState> {
    state.status = 'resolving_intent';
    this.notifyState(state);
    if (!state.perception || !state.context) throw new Error('Perception and context required');
    const intent = await this.intentResolver.resolve(state.perception, state.context);
    return { ...state, intent, status: 'injecting_memory', lastUpdate: Date.now() };
  }

  private async stepMemoryInjection(state: CognitiveState): Promise<CognitiveState> {
    state.status = 'injecting_memory';
    this.notifyState(state);
    if (!state.context || !state.intent) throw new Error('Context and intent required');
    const memory = await this.memoryInjector.inject(
      state.context, state.intent.primaryIntent.domain, 5
    );
    const consented = await Promise.all(
      memory.map(m => this.memoryInjector.validateConsent(m, state.input.userId))
    );
    const validMemory = memory.filter((_, i) => consented[i]);
    return { ...state, memory: validMemory, status: 'traversing_graph', lastUpdate: Date.now() };
  }

  private async stepDecisionGraph(state: CognitiveState): Promise<CognitiveState> {
    state.status = 'traversing_graph';
    this.notifyState(state);
    let graph = this.decisionGraph.create(state);
    graph = await this.decisionGraph.traverse(graph, state);
    return { ...state, decisionGraph: graph, status: 'selecting_tools', lastUpdate: Date.now() };
  }

  private async stepToolSelection(state: CognitiveState): Promise<CognitiveState> {
    state.status = 'selecting_tools';
    this.notifyState(state);
    if (!state.intent || !state.context) throw new Error('Intent and context required');
    const safetyLevel = this.prioritizationRules.getSafetyLevel(state.intent);
    let tools = await this.toolSelector.select(state.intent, state.context, safetyLevel);
    tools = this.toolSelector.avoidRedundancy(tools);
    // Apply reasoning rules: minimal tool usage
    tools = this.reasoningRules.applyMinimalToolPrinciple(tools);
    return { ...state, selectedTools: tools, status: 'routing_agents', lastUpdate: Date.now() };
  }

  private async stepAgentRouting(state: CognitiveState): Promise<CognitiveState> {
    state.status = 'routing_agents';
    this.notifyState(state);
    if (!state.intent) throw new Error('Intent required');
    let routes = await this.agentRouter.route(state.intent, state.selectedTools, state.context!);
    routes = this.agentRouter.coordinate(routes);
    routes = this.agentRouter.resolveConflicts(routes);
    return { ...state, agentRoutes: routes, status: 'safety_check', lastUpdate: Date.now() };
  }

  private async stepSafetyCheck(state: CognitiveState): Promise<CognitiveState> {
    state.status = 'safety_check';
    this.notifyState(state);
    const checks = await this.safetyCheckpoint.validate(state);
    const allPassed = checks.every(c => c.passed);
    if (!allPassed) {
      const failed = checks.filter(c => !c.passed);
      state.errors.push(`Safety checks failed: ${failed.map(f => f.checkpoint).join(', ')}`);
      // Find alternative path
      const alternative = failed.find(f => f.alternativePath)?.alternativePath;
      if (alternative) {
        return { ...state, safetyChecks: checks, status: 'planning_response', lastUpdate: Date.now() };
      }
    }
    return { ...state, safetyChecks: checks, status: 'planning_response', lastUpdate: Date.now() };
  }

  private async stepResponsePlan(state: CognitiveState): Promise<CognitiveState> {
    state.status = 'planning_response';
    this.notifyState(state);
    const plan = await this.responsePlanner.plan(state);
    return { ...state, responsePlan: plan, status: 'complete', lastUpdate: Date.now() };
  }

  private buildOutput(state: CognitiveState, startTime: number): CognitiveOutput {
    const plan = state.responsePlan;
    const allSafe = state.safetyChecks.every(c => c.passed);
    const executionPath: ExecutionPath = !allSafe ? 'blocked'
      : state.intent?.confidence === 'certain' ? 'direct'
      : state.intent?.confidence === 'high' ? 'direct'
      : state.intent?.confidence === 'medium' ? 'clarification'
      : 'navigator';

    return {
      response: plan?.finalResponse || 'I am unable to process your request at this time.',
      reasoningPath: state.decisionGraph?.explainability || [],
      confidence: plan?.confidence || 'low',
      confidenceScore: plan?.confidenceScore || 0,
      toolsUsed: plan?.toolsUsed || state.selectedTools.filter(t => t.selected).map(t => t.toolId),
      agentsTriggered: plan?.agentsTriggered || state.agentRoutes.map(r => r.agentId),
      safetyPassed: allSafe,
      executionPath,
      processingTimeMs: Date.now() - startTime,
      status: state.status,
    };
  }

  private buildInterruptedOutput(state: CognitiveState, startTime: number): CognitiveOutput {
    state.status = 'interrupted';
    return {
      response: 'I paused processing your request. You can continue or start over.',
      reasoningPath: state.decisionGraph?.explainability || [],
      confidence: 'unknown',
      confidenceScore: 0,
      toolsUsed: [],
      agentsTriggered: [],
      safetyPassed: false,
      executionPath: 'fallback',
      processingTimeMs: Date.now() - startTime,
      status: 'interrupted',
    };
  }

  private notifyState(state: CognitiveState): void {
    this.stateListeners.forEach(l => l({ ...state }));
  }
}
