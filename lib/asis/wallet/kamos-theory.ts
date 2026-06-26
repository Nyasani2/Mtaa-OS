// ============================================================================
// KAMOS THEORY — Foundational Mathematics of MTAA
// ============================================================================
// Kamos Axiom: 1 × 1 = 1 + f(growth, replication, interaction, observation)
//
// In Kamos arithmetic, every entity is not static — it carries a proliferative
// potential. The function f() represents the emergent properties that arise
// when systems interact, grow, replicate, and are observed.
//
// Core Principles:
// 1. PROLIFERATION: Every value tends to replicate under the right conditions
// 2. ADAPTATION: Systems modify their behaviour based on context
// 3. OBSERVATION: The act of measurement changes the system
// 4. INTERACTION: No entity exists in isolation — all are networked
// ============================================================================

export interface KamosEntity {
  id: string;
  baseValue: number;        // The "1" — intrinsic value
  growthFactor: number;     // f(growth) — tendency to expand
  replicationRate: number;  // f(replication) — duplication potential
  interactionStrength: number; // f(interaction) — network connectivity
  observationState: number; // f(observation) — measured/known state
  contextVector: number[];  // Multi-dimensional context space
  entropy: number;          // System disorder — decreases with intelligence
}

export interface KamosField {
  entities: Map<string, KamosEntity>;
  fieldStrength: number;    // Collective interaction energy
  resonance: number;        // Harmonic alignment of entities
  coherence: number;        // Predictability of the field
}

/**
 * Kamos Multiplication
 * Not a × b = ab. Instead:
 * a ⊙ b = (a × b) + f(growth, replication, interaction, observation)
 * Where f() is context-dependent and emergent.
 */
export function kamosMultiply(a: KamosEntity, b: KamosEntity, context: KamosField): KamosEntity {
  const baseProduct = a.baseValue * b.baseValue;

  // f(growth) — entities grow when in fertile context
  const growthTerm = (a.growthFactor + b.growthFactor) * context.fieldStrength * 0.5;

  // f(replication) — information/behaviour duplicates across network
  const replicationTerm = Math.sqrt(a.replicationRate * b.replicationRate) * context.resonance;

  // f(interaction) — network effects amplify value
  const interactionTerm = a.interactionStrength * b.interactionStrength * context.coherence;

  // f(observation) — measurement collapses uncertainty, adds precision
  const observationTerm = (a.observationState + b.observationState) * (1 - (a.entropy + b.entropy) / 2);

  const emergentValue = baseProduct + growthTerm + replicationTerm + interactionTerm + observationTerm;

  return {
    id: `kamos_${a.id}_${b.id}`,
    baseValue: emergentValue,
    growthFactor: Math.min(1, (a.growthFactor + b.growthFactor) / 2 + context.fieldStrength * 0.1),
    replicationRate: Math.min(1, Math.sqrt(a.replicationRate * b.replicationRate) + context.resonance * 0.1),
    interactionStrength: Math.min(1, (a.interactionStrength + b.interactionStrength) / 2 + context.coherence * 0.1),
    observationState: Math.min(1, (a.observationState + b.observationState) / 2 + 0.05),
    contextVector: mergeContextVectors(a.contextVector, b.contextVector),
    entropy: Math.max(0, (a.entropy + b.entropy) / 2 - context.coherence * 0.1),
  };
}

/**
 * Kamos Evolution
 * Entities don't stay static — they evolve through time and interaction.
 * dE/dt = α·growth - β·entropy + γ·interaction - δ·isolation
 */
export function kamosEvolve(entity: KamosEntity, deltaTime: number, field: KamosField): KamosEntity {
  const alpha = 0.01;
  const beta = 0.005;
  const gamma = 0.02;
  const delta = 0.01;

  const neighborCount = field.entities.size;
  const isolationFactor = neighborCount > 0 ? 1 / neighborCount : 1;

  return {
    ...entity,
    baseValue: entity.baseValue +
      (alpha * entity.growthFactor * entity.baseValue -
       beta * entity.entropy * entity.baseValue +
       gamma * entity.interactionStrength * field.fieldStrength * entity.baseValue -
       delta * isolationFactor * entity.baseValue) * deltaTime,
    growthFactor: Math.min(1, entity.growthFactor + alpha * deltaTime),
    entropy: Math.max(0, entity.entropy - beta * deltaTime * field.coherence),
    observationState: Math.min(1, entity.observationState + 0.001 * deltaTime),
  };
}

/**
 * Kamos Resonance
 * When entities share context vectors, they resonate — amplifying signals.
 */
export function kamosResonance(a: KamosEntity, b: KamosEntity): number {
  if (a.contextVector.length !== b.contextVector.length) return 0;

  const dotProduct = a.contextVector.reduce((sum, val, i) => sum + val * b.contextVector[i], 0);
  const magnitudeA = Math.sqrt(a.contextVector.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.contextVector.reduce((sum, val) => sum + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Kamos Field Coherence
 * Measures how predictable/ordered the field is.
 * High coherence = high trust, low fraud
 */
export function kamosFieldCoherence(field: KamosField): number {
  if (field.entities.size === 0) return 0;

  const entities = Array.from(field.entities.values());
  const avgEntropy = entities.reduce((sum, e) => sum + e.entropy, 0) / entities.length;
  const avgObservation = entities.reduce((sum, e) => sum + e.observationState, 0) / entities.length;

  return (1 - avgEntropy) * avgObservation;
}

function mergeContextVectors(a: number[], b: number[]): number[] {
  const maxLen = Math.max(a.length, b.length);
  const result: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    result.push((av + bv) / 2 + Math.abs(av - bv) * 0.1);
  }
  return result;
}

/**
 * Kamos Trust Emergence
 * Trust is not assigned — it EMERGES from the field.
 * T = ∫(coherence × observation × interaction) dt
 */
export function kamosTrustEmergence(entity: KamosEntity, field: KamosField, historyLength: number): number {
  const coherence = kamosFieldCoherence(field);
  const baseTrust = entity.observationState * entity.interactionStrength * coherence;
  const historyBonus = Math.log1p(historyLength) * 0.1;
  return Math.min(1, baseTrust + historyBonus);
}

/**
 * Kamos Anomaly Detection
 * Anomalies are entities whose context vectors deviate from field resonance.
 */
export function kamosDetectAnomaly(entity: KamosEntity, field: KamosField): {
  isAnomaly: boolean;
  anomalyScore: number;
  deviationVector: number[];
} {
  if (field.entities.size === 0) {
    return { isAnomaly: false, anomalyScore: 0, deviationVector: [] };
  }

  const entities = Array.from(field.entities.values()).filter(e => e.id !== entity.id);
  if (entities.length === 0) {
    return { isAnomaly: false, anomalyScore: 0, deviationVector: [] };
  }

  const centroid: number[] = [];
  const vecLen = entity.contextVector.length;
  for (let i = 0; i < vecLen; i++) {
    centroid[i] = entities.reduce((sum, e) => sum + (e.contextVector[i] || 0), 0) / entities.length;
  }

  const deviationVector: number[] = [];
  for (let i = 0; i < vecLen; i++) {
    deviationVector.push(entity.contextVector[i] - centroid[i]);
  }

  const deviationMagnitude = Math.sqrt(deviationVector.reduce((sum, v) => sum + v * v, 0));
  const avgFieldMagnitude = entities.reduce((sum, e) => {
    const mag = Math.sqrt(e.contextVector.reduce((s, v) => s + v * v, 0));
    return sum + mag;
  }, 0) / entities.length;

  const anomalyScore = deviationMagnitude / (avgFieldMagnitude + 0.001);
  const isAnomaly = anomalyScore > 2.5;

  return { isAnomaly, anomalyScore, deviationVector };
}

/**
 * Kamos Prediction
 * Predict future state based on field evolution.
 */
export function kamosPredict(entity: KamosEntity, field: KamosField, steps: number): KamosEntity {
  let predicted = { ...entity };
  for (let i = 0; i < steps; i++) {
    predicted = kamosEvolve(predicted, 1, field);
    field = {
      ...field,
      fieldStrength: field.fieldStrength * 0.999 + predicted.interactionStrength * 0.001,
    };
  }
  return predicted;
}

export { kamosMultiply as kamosProduct };
