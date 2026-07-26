/**
 * ASIS CSE — KAMOS Mathematical Engine
 * Formalizes: a ⊗ b = a ⊕ b ⊕ f(a,b,C)·Δ(a,b)
 * Where f is the emergence function and Δ is the interaction differential
 */

import {
  KAMOS_COUPLING,
  CONTEXT_DECAY,
  IDENTITY_PERSISTENCE,
  OBSERVATION_THRESHOLD,
  MAX_EMERGENCE,
  MIN_ENTITY_VALUE,
} from './asis-cse-constants';

import type {
  KAMOSEntity,
  EntityState,
  ContextVector,
  EmergenceFunction,
  IdentityVector,
} from './asis-cse-types';

// ============================================================================
// §1: The Emergence Function f(a, b, C)
// ============================================================================

/**
 * Computes the emergence value between two entity states within a context.
 * f(a,b,C) = coupling · [growth·replication·interaction·observation] · contextRelevance
 * Bounded by MAX_EMERGENCE.
 */
export const computeEmergence: EmergenceFunction = (a, b, context): number => {
  // Raw interaction potential
  const growthTerm = Math.sqrt(a.growth * b.growth);
  const replicationTerm = Math.sqrt(a.replication * b.replication);
  const interactionTerm = Math.sqrt(a.interaction * b.interaction);
  const observationTerm = Math.sqrt(a.observation * b.observation);

  // Combined emergence (geometric mean of all four factors)
  const rawEmergence =
    KAMOS_COUPLING *
    Math.pow(
      growthTerm * replicationTerm * interactionTerm * observationTerm,
      0.25
    );

  // Context modulation — relevance amplifies or dampens emergence
  const contextModulation = 0.5 + 0.5 * context.relevance;

  // Bounded emergence
  const emergence = rawEmergence * contextModulation;
  return Math.min(emergence, MAX_EMERGENCE);
};

/**
 * Computes the interaction differential Δ(a,b).
 * Δ = |a.value - b.value| · (1 + |a.state - b.state|_entropy)
 * Measures how much the interaction changes the system.
 */
export const computeInteractionDifferential = (
  a: EntityState,
  b: EntityState
): number => {
  const valueDiff = Math.abs(a.value - b.value);
  const stateEntropy =
    Math.abs(a.growth - b.growth) +
    Math.abs(a.replication - b.replication) +
    Math.abs(a.interaction - b.interaction) +
    Math.abs(a.observation - b.observation);

  return valueDiff * (1 + stateEntropy / 4);
};

// ============================================================================
// §2: KAMOS Operations
// ============================================================================

/**
 * KAMOS Addition (⊕): Standard additive composition.
 * a ⊕ b = a.value + b.value
 */
export const kamosAdd = (a: EntityState, b: EntityState): number => {
  return a.value + b.value;
};

/**
 * KAMOS Multiplication (⊗): Emergent composition.
 * a ⊗ b = a.value + b.value + f(a,b,C)·Δ(a,b)
 * Non-associative by design — order of interaction matters.
 */
export const kamosMultiply = (
  a: EntityState,
  b: EntityState,
  context: ContextVector
): number => {
  const base = kamosAdd(a, b);
  const f = computeEmergence(a, b, context);
  const delta = computeInteractionDifferential(a, b);
  const result = base + f * delta;

  // Floor at minimum entity value
  return Math.max(result, MIN_ENTITY_VALUE);
};

/**
 * Left-associative KAMOS product.
 * Computes ((a ⊗ b) ⊗ c) ⊗ d ...
 * Order matters — non-associative.
 */
export const kamosProduct = (
  states: EntityState[],
  context: ContextVector
): number => {
  if (states.length === 0) return 0;
  if (states.length === 1) return states[0].value;

  let accumulator = states[0];
  for (let i = 1; i < states.length; i++) {
    const product = kamosMultiply(accumulator, states[i], context);
    accumulator = {
      ...accumulator,
      value: product,
      // State attributes blend toward the interaction
      growth: (accumulator.growth + states[i].growth) / 2,
      replication: (accumulator.replication + states[i].replication) / 2,
      interaction: Math.max(accumulator.interaction, states[i].interaction),
      observation: Math.max(accumulator.observation, states[i].observation),
    };
  }

  return accumulator.value;
};

// ============================================================================
// §3: Context Dynamics
// ============================================================================

/**
 * Decays a context vector by CONTEXT_DECAY.
 * Returns a new context with reduced relevance and historical weight.
 */
export const decayContext = (context: ContextVector): ContextVector => {
  const decayedRelevance = context.relevance * (1 - CONTEXT_DECAY);
  const decayedHistory = context.history.map((snap) => ({
    ...snap,
    weight: snap.weight * (1 - CONTEXT_DECAY),
  }));

  return {
    ...context,
    relevance: Math.max(decayedRelevance, 0.01),
    history: decayedHistory,
  };
};

/**
 * Updates context with a new observation.
 * Increases relevance if observation is novel, decreases if redundant.
 */
export const updateContext = (
  context: ContextVector,
  observation: Record<string, unknown>,
  novelty: number
): ContextVector => {
  const snapshot: ContextSnapshot = {
    timestamp: Date.now(),
    variables: observation,
    weight: novelty,
  };

  const newRelevance = Math.min(
    context.relevance + novelty * (1 - CONTEXT_DECAY),
    1.0
  );

  // Keep history bounded (last 100 snapshots)
  const trimmedHistory = [...context.history, snapshot].slice(-100);

  return {
    ...context,
    environment: { ...context.environment, ...observation },
    history: trimmedHistory,
    relevance: newRelevance,
  };
};

// Missing import fix
interface ContextSnapshot {
  timestamp: number;
  variables: Record<string, unknown>;
  weight: number;
}

// ============================================================================
// §4: Identity Dynamics
// ============================================================================

/**
 * Persists identity through interaction.
 * identity' = persistence · identity + (1 - persistence) · observationImpact
 */
export const persistIdentity = (
  identity: IdentityVector,
  observationImpact: Record<string, number>
): IdentityVector => {
  const newSelfModel: Record<string, number> = {};
  const allKeys = new Set([
    ...Object.keys(identity.selfModel),
    ...Object.keys(observationImpact),
  ]);

  for (const key of allKeys) {
    const oldVal = identity.selfModel[key] || 0;
    const newVal = observationImpact[key] || 0;
    newSelfModel[key] =
      IDENTITY_PERSISTENCE * oldVal + (1 - IDENTITY_PERSISTENCE) * newVal;
  }

  // Coherence = consistency of self-model (inverse variance)
  const values = Object.values(newSelfModel);
  const mean = values.reduce((a, b) => a + b, 0) / (values.length || 1);
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
    (values.length || 1);
  const coherence = 1 / (1 + variance);

  return {
    selfModel: newSelfModel,
    persistence: identity.persistence,
    coherence,
  };
};

// ============================================================================
// §5: Observation & Signal Processing
// ============================================================================

/**
 * Amplifies observation signal if it exceeds threshold.
 * Returns 0 if below threshold (observation not registered).
 */
export const amplifyObservation = (rawSignal: number): number => {
  if (rawSignal < OBSERVATION_THRESHOLD) return 0;
  // Super-linear amplification above threshold
  return Math.pow(rawSignal, 1 + KAMOS_COUPLING);
};

/**
 * Computes signal-to-noise ratio for an observation.
 */
export const computeSNR = (signal: number, noise: number): number => {
  if (noise === 0) return signal > 0 ? Infinity : 0;
  return signal / noise;
};

// ============================================================================
// §6: KAMOS Entity Factory
// ============================================================================

/**
 * Creates a new KAMOS entity with default state.
 */
export const createEntity = (
  id: string,
  initialValue: number = 1.0,
  overrides?: Partial<EntityState>
): KAMOSEntity => {
  const state: EntityState = {
    value: initialValue,
    growth: overrides?.growth ?? 0.5,
    replication: overrides?.replication ?? 0.5,
    interaction: overrides?.interaction ?? 0.5,
    observation: overrides?.observation ?? 0.5,
  };

  const identity: IdentityVector = {
    selfModel: { base: initialValue },
    persistence: IDENTITY_PERSISTENCE,
    coherence: 1.0,
  };

  const context: ContextVector = {
    environment: {},
    history: [],
    relevance: 0.5,
    decay: CONTEXT_DECAY,
  };

  return {
    id,
    identity,
    state,
    context,
    timestamp: Date.now(),
    entropy: 0,
  };
};

/**
 * Evolves an entity through one KAMOS cycle.
 */
export const evolveEntity = (
  entity: KAMOSEntity,
  interactionPartner: EntityState,
  globalContext: ContextVector
): KAMOSEntity => {
  const newValue = kamosMultiply(entity.state, interactionPartner, globalContext);
  const newContext = decayContext(entity.context);

  return {
    ...entity,
    state: {
      ...entity.state,
      value: newValue,
      growth: Math.min(entity.state.growth * 1.01, 1.0), // Slow growth cap
    },
    context: newContext,
    timestamp: Date.now(),
    entropy: entity.entropy + 0.001,
  };
};

// ============================================================================
// §7: Utility Functions
// ============================================================================

/**
 * Normalizes a value to [0, 1] range.
 */
export const normalize = (value: number, min: number, max: number): number => {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
};

/**
 * Computes cosine similarity between two vectors.
 */
export const cosineSimilarity = (
  a: Record<string, number>,
  b: Record<string, number>
): number => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const key of keys) {
    const av = a[key] || 0;
    const bv = b[key] || 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
* Exponential moving average.
*/
export const ema = (current: number, previous: number, alpha: number): number => {
  return alpha * current + (1 - alpha) * previous;
};
