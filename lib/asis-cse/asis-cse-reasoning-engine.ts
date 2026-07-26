/**
 * ASIS CSE — Reasoning Engine (Engine 11)
 * Specification: 11_REASONING_ENGINE.md
 * 
 * Transforms understanding into logical conclusions.
 * Systematic exploration of possible conclusions while preserving logical consistency.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveEngine,
  EngineContext,
  EngineResult,
  MentalModel,
  CausalLink,
  KnowledgeGraph,
  Hypothesis,
  Conclusion,
  ConfidenceScore,
} from './asis-cse-types';
import { COUPLING, REASONING_CONFIDENCE_THRESHOLD } from './asis-cse-constants';
import { kamosMultiply, emergenceFunction } from './asis-cse-kamos';

interface ReasoningEngineState {
  hypotheses: Map<string, Hypothesis>;
  conclusions: Map<string, Conclusion>;
  reasoningTraces: Map<string, any[]>;
}

export class ReasoningEngine implements CognitiveEngine {
  readonly id = 'reasoning-engine';
  readonly version = '1.0.0';
  readonly capabilities = ['deductive-reasoning', 'inductive-reasoning', 'abductive-reasoning', 'analogical-reasoning', 'counterfactual-reasoning', 'ethical-reasoning'];

  private state: ReasoningEngineState;

  constructor() {
    this.state = {
      hypotheses: new Map(),
      conclusions: new Map(),
      reasoningTraces: new Map(),
    };
  }

  async process(context: EngineContext): Promise<EngineResult> {
    const startTime = Date.now();
    const understanding = context.inputs?.understanding as any | undefined;

    if (!understanding) {
      return this.buildResult([], 0, startTime, 'No understanding model provided for reasoning');
    }

    const mentalModels = understanding.mentalModels as MentalModel[] || [];
    const causalNetwork = understanding.causalNetwork as CausalLink[] || [];
    const patterns = understanding.patterns || [];

    // Generate hypotheses from understanding
    const hypotheses = await this.generateHypotheses(mentalModels, causalNetwork, patterns, context);

    // Evaluate hypotheses through multiple reasoning types
    const deductiveConclusions = await this.deductiveReasoning(hypotheses, mentalModels, context);
    const inductiveConclusions = await this.inductiveReasoning(hypotheses, patterns, context);
    const abductiveConclusions = await this.abductiveReasoning(hypotheses, causalNetwork, context);
    const analogicalConclusions = await this.analogicalReasoning(hypotheses, mentalModels, context);

    const allConclusions = [
      ...deductiveConclusions,
      ...inductiveConclusions,
      ...abductiveConclusions,
      ...analogicalConclusions,
    ];

    // Filter by confidence threshold
    const validConclusions = allConclusions.filter(c => c.confidence.overall >= REASONING_CONFIDENCE_THRESHOLD);

    // Rank conclusions
    const rankedConclusions = this.rankConclusions(validConclusions);

    // Build reasoning trace
    const trace = this.buildReasoningTrace(hypotheses, rankedConclusions, context);

    const reasoningOutput = {
      conclusions: rankedConclusions,
      hypotheses: hypotheses.map(h => ({ id: h.id, statement: h.statement, confidence: h.confidence })),
      rejectedConclusions: allConclusions.filter(c => c.confidence.overall < REASONING_CONFIDENCE_THRESHOLD).length,
      reasoningTypesUsed: ['deductive', 'inductive', 'abductive', 'analogical'],
      trace,
    };

    const avgConfidence = rankedConclusions.length > 0
      ? rankedConclusions.reduce((sum, c) => sum + c.confidence.overall, 0) / rankedConclusions.length
      : 0;

    return this.buildResult(
      [reasoningOutput],
      avgConfidence,
      startTime,
      `Generated ${hypotheses.length} hypotheses, evaluated through 4 reasoning types, produced ${rankedConclusions.length} valid conclusions (${allConclusions.length - rankedConclusions.length} rejected)`
    );
  }

  private async generateHypotheses(
    models: MentalModel[],
    causalLinks: CausalLink[],
    patterns: any[],
    context: EngineContext
  ): Promise<Hypothesis[]> {
    const hypotheses: Hypothesis[] = [];

    // Generate from mental models
    for (const model of models) {
      for (const dynamic of model.dynamics) {
        const hypothesis: Hypothesis = {
          id: uuidv4(),
          statement: `If ${model.name} exhibits ${dynamic} dynamics, then ${this.inferConsequence(dynamic)}`,
          type: 'model-based',
          confidence: model.confidence,
          assumptions: [model.description],
          evidence: model.entities,
          contradictions: [],
          generatedAt: Date.now(),
        };
        hypotheses.push(hypothesis);
        this.state.hypotheses.set(hypothesis.id, hypothesis);
      }
    }

    // Generate from causal links
    for (const link of causalLinks) {
      const hypothesis: Hypothesis = {
        id: uuidv4(),
        statement: `${link.cause} ${link.mechanism} ${link.effect} with strength ${link.strength.toFixed(2)}`,
        type: 'causal',
        confidence: link.confidence,
        assumptions: link.conditions,
        evidence: [link.cause, link.effect],
        contradictions: [],
        generatedAt: Date.now(),
      };
      hypotheses.push(hypothesis);
      this.state.hypotheses.set(hypothesis.id, hypothesis);
    }

    // Generate from patterns
    for (const pattern of patterns) {
      const hypothesis: Hypothesis = {
        id: uuidv4(),
        statement: `Pattern '${pattern.name}' in ${pattern.domain} domain will recur with confidence ${pattern.confidence.toFixed(2)}`,
        type: 'pattern-based',
        confidence: pattern.confidence,
        assumptions: [`Pattern observed ${pattern.frequency} times`],
        evidence: pattern.entities,
        contradictions: [],
        generatedAt: Date.now(),
      };
      hypotheses.push(hypothesis);
      this.state.hypotheses.set(hypothesis.id, hypothesis);
    }

    return hypotheses;
  }

  private inferConsequence(dynamic: string): string {
    const consequences: Record<string, string> = {
      'causal': 'specific outcomes can be predicted from initial conditions',
      'operational': 'system behaviour follows defined procedures',
      'spatial-temporal': 'events correlate with location and time',
      'relational': 'entity interactions follow network effects',
      'highly-interconnected': 'small changes may produce large effects',
    };
    return consequences[dynamic] || 'system behaviour is governed by emergent properties';
  }

  private async deductiveReasoning(hypotheses: Hypothesis[], models: MentalModel[], context: EngineContext): Promise<Conclusion[]> {
    const conclusions: Conclusion[] = [];

    for (const hypothesis of hypotheses) {
      if (hypothesis.type === 'model-based' || hypothesis.type === 'causal') {
        // Deductive: if premises are true and model is valid, conclusion follows necessarily
        const modelConfidence = models.find(m => m.entities.some(e => hypothesis.evidence.includes(e)))?.confidence || 0.5;
        const logicalConfidence = hypothesis.confidence * modelConfidence * COUPLING;

        if (logicalConfidence > 0.3) {
          conclusions.push({
            id: uuidv4(),
            statement: `Deduced: ${hypothesis.statement}`,
            type: 'deductive',
            confidence: {
              overall: logicalConfidence,
              logical: logicalConfidence,
              evidence: hypothesis.confidence,
              knowledge: modelConfidence,
            },
            supportingEvidence: hypothesis.evidence,
            assumptions: hypothesis.assumptions,
            alternativesConsidered: [],
            uncertainty: 1 - logicalConfidence,
            derivedFrom: [hypothesis.id],
            timestamp: Date.now(),
          });
        }
      }
    }

    return conclusions;
  }

  private async inductiveReasoning(hypotheses: Hypothesis[], patterns: any[], context: EngineContext): Promise<Conclusion[]> {
    const conclusions: Conclusion[] = [];

    // Group hypotheses by type to find general rules
    const typeGroups = new Map<string, Hypothesis[]>();
    for (const h of hypotheses) {
      if (!typeGroups.has(h.type)) typeGroups.set(h.type, []);
      typeGroups.get(h.type)!.push(h);
    }

    for (const [type, group] of typeGroups) {
      if (group.length >= 2) {
        const avgConfidence = group.reduce((sum, h) => sum + h.confidence, 0) / group.length;
        const inductiveStrength = Math.min(0.9, avgConfidence * (1 - 1 / (group.length + 1)) * COUPLING);

        conclusions.push({
          id: uuidv4(),
          statement: `Induced: ${type} hypotheses generalise to a reliable pattern across ${group.length} instances`,
          type: 'inductive',
          confidence: {
            overall: inductiveStrength,
            logical: inductiveStrength * 0.8,
            evidence: avgConfidence,
            knowledge: 0.6,
          },
          supportingEvidence: group.flatMap(h => h.evidence),
          assumptions: [`${group.length} consistent observations`],
          alternativesConsidered: ['no-pattern', 'random-correlation'],
          uncertainty: 1 - inductiveStrength,
          derivedFrom: group.map(h => h.id),
          timestamp: Date.now(),
        });
      }
    }

    return conclusions;
  }

  private async abductiveReasoning(hypotheses: Hypothesis[], causalLinks: CausalLink[], context: EngineContext): Promise<Conclusion[]> {
    const conclusions: Conclusion[] = [];

    for (const hypothesis of hypotheses) {
      if (hypothesis.type === 'causal') {
        // Find best explanation: which cause most likely explains the observed effect?
        const relatedCauses = causalLinks.filter(cl => hypothesis.evidence.includes(cl.effect));
        if (relatedCauses.length > 0) {
          const bestCause = relatedCauses.reduce((best, current) => 
            current.confidence > best.confidence ? current : best
          );

          const abductiveConfidence = bestCause.confidence * hypothesis.confidence * COUPLING;

          conclusions.push({
            id: uuidv4(),
            statement: `Best explanation: ${bestCause.cause} via ${bestCause.mechanism} explains observed ${bestCause.effect}`,
            type: 'abductive',
            confidence: {
              overall: abductiveConfidence,
              logical: abductiveConfidence * 0.7,
              evidence: bestCause.confidence,
              knowledge: hypothesis.confidence,
            },
            supportingEvidence: [bestCause.cause, bestCause.effect],
            assumptions: ['inference-to-best-explanation'],
            alternativesConsidered: relatedCauses.filter(c => c.id !== bestCause.id).map(c => c.cause),
            uncertainty: 1 - abductiveConfidence,
            derivedFrom: [hypothesis.id, bestCause.id],
            timestamp: Date.now(),
          });
        }
      }
    }

    return conclusions;
  }

  private async analogicalReasoning(hypotheses: Hypothesis[], models: MentalModel[], context: EngineContext): Promise<Conclusion[]> {
    const conclusions: Conclusion[] = [];

    for (let i = 0; i < models.length; i++) {
      for (let j = i + 1; j < models.length; j++) {
        const commonDynamics = models[i].dynamics.filter(d => models[j].dynamics.includes(d));
        if (commonDynamics.length >= 2) {
          const analogyConfidence = (models[i].confidence + models[j].confidence) / 2 * COUPLING;

          conclusions.push({
            id: uuidv4(),
            statement: `Analogical: ${models[i].name} and ${models[j].name} share ${commonDynamics.join(', ')}; conclusions from one transfer to the other`,
            type: 'analogical',
            confidence: {
              overall: analogyConfidence,
              logical: analogyConfidence * 0.6,
              evidence: Math.max(models[i].confidence, models[j].confidence),
              knowledge: (models[i].confidence + models[j].confidence) / 2,
            },
            supportingEvidence: [...models[i].entities, ...models[j].entities],
            assumptions: ['structural-similarity-implies-functional-similarity'],
            alternativesConsidered: ['models-are-unrelated'],
            uncertainty: 1 - analogyConfidence,
            derivedFrom: [models[i].id, models[j].id],
            timestamp: Date.now(),
          });
        }
      }
    }

    return conclusions;
  }

  private rankConclusions(conclusions: Conclusion[]): Conclusion[] {
    return conclusions.sort((a, b) => {
      const scoreA = a.confidence.overall * (1 - a.uncertainty);
      const scoreB = b.confidence.overall * (1 - b.uncertainty);
      return scoreB - scoreA;
    });
  }

  private buildReasoningTrace(hypotheses: Hypothesis[], conclusions: Conclusion[], context: EngineContext): any[] {
    return [
      { step: 1, action: 'hypothesis-generation', count: hypotheses.length },
      { step: 2, action: 'deductive-evaluation', count: conclusions.filter(c => c.type === 'deductive').length },
      { step: 3, action: 'inductive-evaluation', count: conclusions.filter(c => c.type === 'inductive').length },
      { step: 4, action: 'abductive-evaluation', count: conclusions.filter(c => c.type === 'abductive').length },
      { step: 5, action: 'analogical-evaluation', count: conclusions.filter(c => c.type === 'analogical').length },
      { step: 6, action: 'confidence-ranking', topConfidence: conclusions[0]?.confidence.overall || 0 },
    ];
  }

  private buildResult(outputs: any[], confidence: number, startTime: number, explanation: string): EngineResult {
    return {
      engineId: this.id,
      outputs,
      confidence: { overall: confidence, logical: confidence, evidence: confidence },
      processingTime: Date.now() - startTime,
      explanation,
      traceId: uuidv4(),
      timestamp: Date.now(),
    };
  }

  getHypotheses(): Hypothesis[] {
    return [...this.state.hypotheses.values()];
  }

  getConclusions(): Conclusion[] {
    return [...this.state.conclusions.values()];
  }
}
