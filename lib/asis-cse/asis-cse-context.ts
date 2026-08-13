// @ts-nocheck
/**
 * ASIS CSE — Unified Context Object
 * Standard parameter passing across all 22+ engines
 * Immutable updates, full cognitive state snapshot
 */

import { v4 as uuidv4 } from 'uuid';

export interface CognitiveIdentity {
  userId: string;
  sessionId: string;
  deviceId?: string;
  intent: string;
  urgency: number; // 0-1
  trustLevel: number; // 0-1
  authMethod?: string;
  permissions: string[];
}

export interface CognitivePurpose {
  primaryGoal: string;
  subGoals: string[];
  constraints: string[];
  deadline?: number;
  successCriteria: string[];
  priority: number; // 0-1
}

export interface AttentionFocus {
  currentTopic: string;
  relevantEntities: string[];
  excludedTopics: string[];
  depth: 'surface' | 'deep' | 'exhaustive';
  scope: 'personal' | 'community' | 'global' | 'universal';
  attentionSpan: number; // estimated ms
}

export interface ObservationState {
  rawInputs: any[];
  filteredInputs: any[];
  lastObservationTime: number;
  sourceReliability: Record<string, number>;
  sensoryChannels: string[];
}

export interface EvidenceState {
  validatedFacts: any[];
  pendingValidation: any[];
  confidenceThreshold: number;
  contradictions: any[];
  evidenceChain: any[];
}

export interface KnowledgeState {
  activeNodes: string[];
  recentQueries: string[];
  knowledgeGaps: string[];
  certaintyMap: Record<string, number>;
  lastKnowledgeUpdate: number;
}

export interface ReasoningState {
  activeHypotheses: any[];
  inferenceChain: any[];
  assumptions: string[];
  fallaciesDetected: string[];
  reasoningDepth: number;
}

export interface SimulationState {
  scenariosRun: number;
  predictedOutcomes: any[];
  riskAssessments: any[];
  worstCase: any;
  bestCase: any;
  mostProbable: any;
}

export interface DecisionState {
  optionsConsidered: any[];
  selectedOption?: any;
  vetoReasons: string[];
  ethicalFlags: string[];
  decisionConfidence: number;
}

export interface ActionState {
  plannedActions: any[];
  executedActions: any[];
  failedActions: any[];
  pendingPermissions: string[];
  rollbackPlan?: any;
}

export interface FeedbackState {
  expectedOutcomes: any[];
  actualOutcomes: any[];
  gaps: any[];
  performanceScore: number;
  satisfactionScore: number;
}

export interface ReflectionState {
  lessonsLearned: string[];
  strengthsConfirmed: string[];
  weaknessesFound: string[];
  assumptionsChallenged: string[];
  cognitiveBiasesDetected: string[];
}

export interface LearningState {
  modelsUpdated: string[];
  patternsStrengthened: string[];
  newStrategies: string[];
  confidenceAdjustments: Record<string, number>;
  learningRate: number;
}

export interface AdaptationState {
  strategyChanges: string[];
  workflowOptimizations: string[];
  engineRoutingChanges: string[];
  stabilityVerified: boolean;
  driftDetected: boolean;
}

export interface WisdomState {
  longTermConsequences: string[];
  ethicalConsistencyScore: number;
  wellbeingImpact: number;
  civilisationImpact: number;
  optimizationTrapsAvoided: string[];
  wisdomConfidence: number;
}

export interface SecurityState {
  identityVerified: boolean;
  permissionsAudited: boolean;
  threatsDetected: string[];
  trustDecayRate: number;
  emergencyOverrideActive: boolean;
  lastSecurityScan: number;
}

export interface CollectiveState {
  peerNodes: string[];
  consensusScore: number;
  disagreements: string[];
  sharedKnowledgeVersion: number;
  autonomyPreserved: boolean;
}

export interface EvolutionState {
  architecturalWeaknesses: string[];
  capabilityRecommendations: string[];
  humanReviewPending: boolean;
  compatibilityVerified: boolean;
  lastEvolutionCycle: number;
}

export interface CognitiveContext {
  id: string;
  createdAt: number;
  updatedAt: number;
  cycle: number;

  identity: CognitiveIdentity;
  purpose: CognitivePurpose;
  attention: AttentionFocus;

  observation: ObservationState;
  evidence: EvidenceState;
  knowledge: KnowledgeState;
  understanding: any; // Mental model — engine-specific shape
  reasoning: ReasoningState;

  simulation: SimulationState;
  decision: DecisionState;
  planning: ActionState;
  action: ActionState;

  feedback: FeedbackState;
  reflection: ReflectionState;
  learning: LearningState;
  adaptation: AdaptationState;
  wisdom: WisdomState;

  security: SecurityState;
  collective: CollectiveState;
  evolution: EvolutionState;

  metadata: Record<string, any>;
}

export function createCognitiveContext(
  identity: Partial<CognitiveIdentity>,
  purpose: Partial<CognitivePurpose>
): CognitiveContext {
  const now = Date.now();
  return {
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    cycle: 0,

    identity: {
      userId: '',
      sessionId: '',
      intent: '',
      urgency: 0.5,
      trustLevel: 0.5,
      permissions: [],
      ...identity,
    },

    purpose: {
      primaryGoal: '',
      subGoals: [],
      constraints: [],
      successCriteria: [],
      priority: 0.5,
      ...purpose,
    },

    attention: {
      currentTopic: '',
      relevantEntities: [],
      excludedTopics: [],
      depth: 'surface',
      scope: 'personal',
      attentionSpan: 30000,
    },

    observation: {
      rawInputs: [],
      filteredInputs: [],
      lastObservationTime: 0,
      sourceReliability: {},
      sensoryChannels: [],
    },

    evidence: {
      validatedFacts: [],
      pendingValidation: [],
      confidenceThreshold: 0.7,
      contradictions: [],
      evidenceChain: [],
    },

    knowledge: {
      activeNodes: [],
      recentQueries: [],
      knowledgeGaps: [],
      certaintyMap: {},
      lastKnowledgeUpdate: 0,
    },

    understanding: null,

    reasoning: {
      activeHypotheses: [],
      inferenceChain: [],
      assumptions: [],
      fallaciesDetected: [],
      reasoningDepth: 0,
    },

    simulation: {
      scenariosRun: 0,
      predictedOutcomes: [],
      riskAssessments: [],
      worstCase: null,
      bestCase: null,
      mostProbable: null,
    },

    decision: {
      optionsConsidered: [],
      vetoReasons: [],
      ethicalFlags: [],
      decisionConfidence: 0,
    },

    planning: {
      plannedActions: [],
      executedActions: [],
      failedActions: [],
      pendingPermissions: [],
    },

    action: {
      plannedActions: [],
      executedActions: [],
      failedActions: [],
      pendingPermissions: [],
    },

    feedback: {
      expectedOutcomes: [],
      actualOutcomes: [],
      gaps: [],
      performanceScore: 0,
      satisfactionScore: 0,
    },

    reflection: {
      lessonsLearned: [],
      strengthsConfirmed: [],
      weaknessesFound: [],
      assumptionsChallenged: [],
      cognitiveBiasesDetected: [],
    },

    learning: {
      modelsUpdated: [],
      patternsStrengthened: [],
      newStrategies: [],
      confidenceAdjustments: {},
      learningRate: 0.1,
    },

    adaptation: {
      strategyChanges: [],
      workflowOptimizations: [],
      engineRoutingChanges: [],
      stabilityVerified: true,
      driftDetected: false,
    },

    wisdom: {
      longTermConsequences: [],
      ethicalConsistencyScore: 1.0,
      wellbeingImpact: 0,
      civilisationImpact: 0,
      optimizationTrapsAvoided: [],
      wisdomConfidence: 0,
    },

    security: {
      identityVerified: false,
      permissionsAudited: false,
      threatsDetected: [],
      trustDecayRate: 0.0,
      emergencyOverrideActive: false,
      lastSecurityScan: 0,
    },

    collective: {
      peerNodes: [],
      consensusScore: 0,
      disagreements: [],
      sharedKnowledgeVersion: 0,
      autonomyPreserved: true,
    },

    evolution: {
      architecturalWeaknesses: [],
      capabilityRecommendations: [],
      humanReviewPending: false,
      compatibilityVerified: true,
      lastEvolutionCycle: 0,
    },

    metadata: {},
  };
}

export function updateCognitiveContext(
  context: CognitiveContext,
  updates: Partial<CognitiveContext>
): CognitiveContext {
  return {
    ...context,
    ...updates,
    updatedAt: Date.now(),
    cycle: context.cycle + 1,
  };
}

export function updateContextPath<T>(
  context: CognitiveContext,
  path: string,
  value: T
): CognitiveContext {
  const keys = path.split('.');
  const newContext = { ...context, cycle: context.cycle + 1, updatedAt: Date.now() };
  let target: any = newContext;
  for (let i = 0; i < keys.length - 1; i++) {
    target[keys[i]] = { ...target[keys[i]] };
    target = target[keys[i]];
  }
  target[keys[keys.length - 1]] = value;
  return newContext;
}

export function cloneContext(context: CognitiveContext): CognitiveContext {
  return JSON.parse(JSON.stringify(context));
}
