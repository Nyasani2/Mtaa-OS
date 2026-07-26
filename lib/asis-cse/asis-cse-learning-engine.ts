/**
 * ASIS CSE — Learning Engine (Engine 18)
 * Specification: 18_LEARNING_ENGINE.md
 * 
 * Converts reflection into lasting cognitive improvement.
 * Learning improves future cognition — it does not memorise outputs.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveEngine,
  EngineContext,
  EngineResult,
  ReflectionReport,
  Lesson,
  LearningUpdate,
  KAMOSValue,
} from './asis-cse-types';
import { COUPLING, LEARNING_CONFIDENCE_THRESHOLD, MEMORY_PROMOTION_THRESHOLD } from './asis-cse-constants';
import { kamosMultiply, emergenceFunction } from './asis-cse-kamos';

interface LearningEngineState {
  learningHistory: LearningUpdate[];
  patternLibrary: Map<string, any>;
  strategyLibrary: Map<string, any>;
  modelImprovements: Map<string, number>;
}

export class LearningEngine implements CognitiveEngine {
  readonly id = 'learning-engine';
  readonly version = '1.0.0';
  readonly capabilities = ['model-update', 'pattern-strengthening', 'knowledge-consolidation', 'confidence-calibration', 'reasoning-optimisation', 'strategy-preservation'];

  private state: LearningEngineState;

  constructor() {
    this.state = {
      learningHistory: [],
      patternLibrary: new Map(),
      strategyLibrary: new Map(),
      modelImprovements: new Map(),
    };
  }

  async process(context: EngineContext): Promise<EngineResult> {
    const startTime = Date.now();
    const reflection = context.inputs?.reflection as any | undefined;

    if (!reflection || !reflection.report) {
      return this.buildResult([], 0, startTime, 'No reflection report provided for learning');
    }

    const reflectionReport = reflection.report as ReflectionReport;
    const feedback = context.inputs?.feedback || {};
    const realityUpdates = context.inputs?.realityUpdates || [];
    const knowledgeChanges = context.inputs?.knowledgeChanges || [];
    const collectiveIntelligence = context.inputs?.collectiveIntelligence || {};

    // Update internal models based on reflection
    const modelUpdates = await this.updateModels(reflectionReport, realityUpdates, context);

    // Strengthen useful patterns
    const strengthenedPatterns = this.strengthenPatterns(reflectionReport.lessons, context);

    // Remove obsolete knowledge
    const removedKnowledge = this.removeObsoleteKnowledge(knowledgeChanges, reflectionReport);

    // Improve confidence estimates
    const confidenceUpdates = this.improveConfidenceEstimates(reflectionReport, feedback);

    // Optimise reasoning pathways
    const reasoningOptimisations = this.optimiseReasoning(reflectionReport);

    // Preserve successful strategies
    const preservedStrategies = this.preserveStrategies(reflectionReport, context);

    const learningUpdate: LearningUpdate = {
      id: uuidv4(),
      reflectionId: reflectionReport.id,
      modelUpdates,
      strengthenedPatterns,
      removedKnowledge,
      confidenceUpdates,
      reasoningOptimisations,
      preservedStrategies,
      knowledgeConsolidated: this.consolidateKnowledge(reflectionReport),
      timestamp: Date.now(),
    };

    this.state.learningHistory.push(learningUpdate);

    const learningOutput = {
      update: learningUpdate,
      summary: {
        modelsUpdated: modelUpdates.length,
        patternsStrengthened: strengthenedPatterns.length,
        knowledgeRemoved: removedKnowledge.length,
        confidenceRecalibrated: confidenceUpdates.length,
        reasoningOptimised: reasoningOptimisations.length,
        strategiesPreserved: preservedStrategies.length,
        overallImprovement: this.calculateOverallImprovement(learningUpdate),
      },
    };

    return this.buildResult(
      [learningOutput],
      reflectionReport.decisionQuality.score,
      startTime,
      `Learning from reflection ${reflectionReport.id}: ${modelUpdates.length} models updated, ${strengthenedPatterns.length} patterns strengthened, ${preservedStrategies.length} strategies preserved.`
    );
  }

  private async updateModels(reflection: ReflectionReport, realityUpdates: any[], context: EngineContext): Promise<any[]> {
    const updates = [];

    for (const weakness of reflection.weaknesses) {
      const modelId = `model-${weakness.dimension}`;
      const currentImprovement = this.state.modelImprovements.get(modelId) || 0;
      const newImprovement = currentImprovement + weakness.confidence * COUPLING;
      this.state.modelImprovements.set(modelId, newImprovement);

      updates.push({
        modelId,
        dimension: weakness.dimension,
        improvement: newImprovement - currentImprovement,
        mechanism: `Corrected ${weakness.rootCause}`,
        confidence: weakness.confidence,
        validated: false,
        validationRequired: true,
      });
    }

    for (const lesson of reflection.lessons) {
      if (lesson.type === 'assumption-update') {
        updates.push({
          modelId: `model-assumptions`,
          dimension: 'assumptions',
          improvement: lesson.confidence * 0.5,
          mechanism: lesson.description,
          confidence: lesson.confidence,
          validated: false,
          validationRequired: true,
        });
      }
    }

    return updates;
  }

  private strengthenPatterns(lessons: Lesson[], context: EngineContext): any[] {
    const strengthened = [];

    for (const lesson of lessons) {
      if (lesson.confidence >= LEARNING_CONFIDENCE_THRESHOLD) {
        const patternId = `pattern-${lesson.type}-${lesson.source}`;
        const existing = this.state.patternLibrary.get(patternId);

        const strength = existing ? existing.strength + lesson.confidence * COUPLING : lesson.confidence;

        this.state.patternLibrary.set(patternId, {
          id: patternId,
          type: lesson.type,
          description: lesson.description,
          strength: Math.min(1, strength),
          applications: existing ? existing.applications + 1 : 1,
          lastApplied: Date.now(),
          confidence: lesson.confidence,
        });

        strengthened.push({
          patternId,
          newStrength: Math.min(1, strength),
          previousStrength: existing?.strength || 0,
          confidence: lesson.confidence,
        });
      }
    }

    return strengthened;
  }

  private removeObsoleteKnowledge(knowledgeChanges: any[], reflection: ReflectionReport): any[] {
    const removed = [];

    for (const change of knowledgeChanges) {
      if (change.type === 'obsolete' || change.confidence < 0.2) {
        removed.push({
          knowledgeId: change.id,
          reason: change.type === 'obsolete' ? 'explicitly-marked-obsolete' : 'confidence-below-threshold',
          previousConfidence: change.previousConfidence || change.confidence,
          removalConfidence: 0.9,
        });
      }
    }

    // Also remove knowledge invalidated by reflection
    for (const lesson of reflection.lessons) {
      if (lesson.type === 'assumption-update' && lesson.confidence > 0.8) {
        removed.push({
          knowledgeId: `assumption-${lesson.id}`,
          reason: 'invalidated-by-reflection',
          previousConfidence: lesson.confidence,
          removalConfidence: lesson.confidence,
        });
      }
    }

    return removed;
  }

  private improveConfidenceEstimates(reflection: ReflectionReport, feedback: any): any[] {
    const updates = [];

    if (reflection.decisionQuality.confidenceCalibration > 0.3) {
      updates.push({
        target: 'decision-confidence',
        adjustment: -reflection.decisionQuality.confidenceCalibration * 0.5,
        reason: 'Overconfidence detected in decision phase',
        newBaseline: Math.max(0.3, 0.7 - reflection.decisionQuality.confidenceCalibration * 0.5),
      });
    }

    if (reflection.cognitiveEfficiency.score > 0.8) {
      updates.push({
        target: 'reasoning-confidence',
        adjustment: 0.05,
        reason: 'High cognitive efficiency supports increased confidence',
        newBaseline: Math.min(0.95, 0.7 + 0.05),
      });
    }

    return updates;
  }

  private optimiseReasoning(reflection: ReflectionReport): any[] {
    const optimisations = [];

    for (const recommendation of reflection.recommendations) {
      if (recommendation.target === 'reasoning' || recommendation.target === 'decision') {
        optimisations.push({
          pathway: recommendation.target,
          optimisation: recommendation.action,
          expectedImprovement: recommendation.expectedImpact,
          priority: recommendation.priority,
        });
      }
    }

    // Add pathway shortcuts for validated patterns
    for (const lesson of reflection.lessons) {
      if (lesson.type === 'reinforcement' && lesson.confidence > 0.8) {
        optimisations.push({
          pathway: lesson.applicability[0] || 'general',
          optimisation: 'fast-path-for-validated-pattern',
          expectedImprovement: lesson.confidence * COUPLING,
          priority: 'low',
        });
      }
    }

    return optimisations;
  }

  private preserveStrategies(reflection: ReflectionReport, context: EngineContext): any[] {
    const preserved = [];

    for (const strength of reflection.strengths) {
      if (strength.confidence >= MEMORY_PROMOTION_THRESHOLD) {
        const strategyId = `strategy-${strength.dimension}-${Date.now()}`;

        this.state.strategyLibrary.set(strategyId, {
          id: strategyId,
          name: strength.description,
          dimension: strength.dimension,
          confidence: strength.confidence,
          successCount: 1,
          firstSuccess: Date.now(),
          lastSuccess: Date.now(),
          contextSignature: context.sessionId,
        });

        preserved.push({
          strategyId,
          dimension: strength.dimension,
          confidence: strength.confidence,
          promotedTo: 'procedural-memory',
        });
      }
    }

    return preserved;
  }

  private consolidateKnowledge(reflection: ReflectionReport): any {
    const validatedLessons = reflection.lessons.filter(l => l.confidence > 0.7);
    return {
      consolidatedPatterns: validatedLessons.length,
      consolidationDepth: reflection.cognitiveEfficiency.score,
      availableForGeneralisation: validatedLessons.filter(l => l.type === 'reinforcement').length,
    };
  }

  private calculateOverallImprovement(update: LearningUpdate): number {
    const factors = [
      update.modelUpdates.length * 0.1,
      update.strengthenedPatterns.length * 0.15,
      update.preservedStrategies.length * 0.2,
      update.confidenceUpdates.length * 0.1,
      update.reasoningOptimisations.length * 0.1,
    ];
    return Math.min(1, factors.reduce((sum, f) => sum + f, 0));
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

  getLearningHistory(): LearningUpdate[] {
    return this.state.learningHistory;
  }

  getPatternLibrary(): any[] {
    return [...this.state.patternLibrary.values()];
  }

  getStrategyLibrary(): any[] {
    return [...this.state.strategyLibrary.values()];
  }
}
