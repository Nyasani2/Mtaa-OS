/**
 * ASIS CSE — Adaptation Engine (Engine 19)
 * Specification: 19_ADAPTATION_ENGINE.md
 * 
 * Modifies ASIS itself.
 * Learning changes knowledge. Adaptation changes behaviour.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveEngine,
  EngineContext,
  EngineResult,
  LearningUpdate,
  AdaptationPolicy,
  KAMOSValue,
} from './asis-cse-types';
import { COUPLING, ADAPTATION_CONFIDENCE_THRESHOLD } from './asis-cse-constants';
import { kamosMultiply, emergenceFunction } from './asis-cse-kamos';

interface AdaptationEngineState {
  policies: Map<string, AdaptationPolicy>;
  adaptationHistory: any[];
  behaviouralChanges: Map<string, any>;
  strategicOptimisations: any[];
}

export class AdaptationEngine implements CognitiveEngine {
  readonly id = 'adaptation-engine';
  readonly version = '1.0.0';
  readonly capabilities = ['strategy-adjustment', 'workflow-optimisation', 'engine-routing-improvement', 'confidence-threshold-update', 'priority-refinement', 'resource-allocation-optimisation'];

  private state: AdaptationEngineState;

  constructor() {
    this.state = {
      policies: new Map(),
      adaptationHistory: [],
      behaviouralChanges: new Map(),
      strategicOptimisations: [],
    };
  }

  async process(context: EngineContext): Promise<EngineResult> {
    const startTime = Date.now();
    const learning = context.inputs?.learning as any | undefined;

    if (!learning || !learning.update) {
      return this.buildResult([], 0, startTime, 'No learning update provided for adaptation');
    }

    const learningUpdate = learning.update as LearningUpdate;
    const reflection = context.inputs?.reflection || {};
    const performanceMetrics = context.inputs?.performanceMetrics || {};
    const realityTrends = context.inputs?.realityTrends || [];
    const collectiveIntelligence = context.inputs?.collectiveIntelligence || {};

    // Adjust cognitive strategies
    const strategyAdjustments = this.adjustStrategies(learningUpdate, context);

    // Optimise workflows
    const workflowOptimisations = this.optimiseWorkflows(learningUpdate, reflection);

    // Improve engine routing
    const routingImprovements = this.improveEngineRouting(learningUpdate);

    // Update confidence thresholds
    const thresholdUpdates = this.updateConfidenceThresholds(learningUpdate, performanceMetrics);

    // Refine priorities
    const priorityRefinements = this.refinePriorities(learningUpdate, realityTrends);

    // Optimise resource allocation
    const resourceOptimisations = this.optimiseResourceAllocation(learningUpdate, performanceMetrics);

    const adaptationReport = {
      id: uuidv4(),
      learningId: learningUpdate.id,
      strategyAdjustments,
      workflowOptimisations,
      routingImprovements,
      thresholdUpdates,
      priorityRefinements,
      resourceOptimisations,
      behaviouralPolicies: this.generateBehaviouralPolicies(strategyAdjustments),
      stabilityPreserved: this.verifyStability(),
      timestamp: Date.now(),
    };

    this.state.adaptationHistory.push(adaptationReport);

    const adaptationOutput = {
      report: adaptationReport,
      summary: {
        strategiesAdjusted: strategyAdjustments.length,
        workflowsOptimised: workflowOptimisations.length,
        routingRulesUpdated: routingImprovements.length,
        thresholdsUpdated: thresholdUpdates.length,
        prioritiesRefined: priorityRefinements.length,
        resourcesOptimised: resourceOptimisations.length,
        systemStability: adaptationReport.stabilityPreserved ? 'preserved' : 'requires-review',
        adaptationDepth: this.calculateAdaptationDepth(adaptationReport),
      },
    };

    return this.buildResult(
      [adaptationOutput],
      learningUpdate.modelUpdates.length > 0 ? 0.8 : 0.5,
      startTime,
      `Adaptation from learning ${learningUpdate.id}: ${strategyAdjustments.length} strategies, ${workflowOptimisations.length} workflows, ${routingImprovements.length} routing rules. Stability: ${adaptationReport.stabilityPreserved ? 'preserved' : 'review-required'}.`
    );
  }

  private adjustStrategies(learningUpdate: LearningUpdate, context: EngineContext): any[] {
    const adjustments = [];

    for (const optimisation of learningUpdate.reasoningOptimisations) {
      const policyId = `strategy-${optimisation.pathway}`;
      const existing = this.state.policies.get(policyId);

      const newPolicy: AdaptationPolicy = {
        id: policyId,
        target: optimisation.pathway,
        changeType: 'strategy',
        description: optimisation.optimisation,
        confidence: optimisation.expectedImprovement,
        scope: 'micro',
        validated: false,
        createdAt: Date.now(),
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
      };

      this.state.policies.set(policyId, newPolicy);
      adjustments.push({
        policyId,
        pathway: optimisation.pathway,
        change: optimisation.optimisation,
        expectedImprovement: optimisation.expectedImprovement,
        previousPolicy: existing?.description || 'none',
      });
    }

    return adjustments;
  }

  private optimiseWorkflows(learningUpdate: LearningUpdate, reflection: any): any[] {
    const optimisations = [];

    for (const modelUpdate of learningUpdate.modelUpdates) {
      if (modelUpdate.dimension === 'execution-gap' || modelUpdate.dimension === 'timing-mismatch') {
        optimisations.push({
          workflow: 'execution-pipeline',
          optimisation: 'parallelise-independent-tasks',
          target: modelUpdate.dimension,
          expectedImprovement: modelUpdate.improvement,
        });
      }
    }

    if (reflection.cognitiveEfficiency?.score < 0.5) {
      optimisations.push({
        workflow: 'cognitive-cycle',
        optimisation: 'reduce-redundant-stages',
        target: 'efficiency',
        expectedImprovement: 0.2,
      });
    }

    return optimisations;
  }

  private improveEngineRouting(learningUpdate: LearningUpdate): any[] {
    const improvements = [];

    // Route more tasks to engines that showed strength
    for (const pattern of learningUpdate.strengthenedPatterns) {
      if (pattern.newStrength > 0.8) {
        improvements.push({
          route: pattern.patternId,
          targetEngine: this.inferEngineFromPattern(pattern.patternId),
          priorityBoost: pattern.newStrength * COUPLING,
          reason: 'Pattern consistently validated',
        });
      }
    }

    return improvements;
  }

  private inferEngineFromPattern(patternId: string): string {
    if (patternId.includes('reasoning')) return 'reasoning-engine';
    if (patternId.includes('decision')) return 'decision-engine';
    if (patternId.includes('observation')) return 'observation-engine';
    if (patternId.includes('evidence')) return 'evidence-engine';
    if (patternId.includes('knowledge')) return 'knowledge-engine';
    return 'cognitive-kernel';
  }

  private updateConfidenceThresholds(learningUpdate: LearningUpdate, performanceMetrics: any): any[] {
    const updates = [];

    for (const calibration of learningUpdate.confidenceUpdates) {
      updates.push({
        threshold: calibration.target,
        oldValue: calibration.newBaseline - calibration.adjustment,
        newValue: calibration.newBaseline,
        adjustment: calibration.adjustment,
        reason: calibration.reason,
      });
    }

    // Global threshold adaptation based on performance
    if (performanceMetrics.accuracy < 0.6) {
      updates.push({
        threshold: 'global-evidence',
        oldValue: 0.5,
        newValue: 0.6,
        adjustment: 0.1,
        reason: 'Low accuracy requires higher evidence threshold',
      });
    }

    return updates;
  }

  private refinePriorities(learningUpdate: LearningUpdate, realityTrends: any[]): any[] {
    const refinements = [];

    for (const trend of realityTrends) {
      if (trend.urgency > 0.7) {
        refinements.push({
          priorityArea: trend.domain || 'general',
          oldPriority: 0.5,
          newPriority: Math.min(1, 0.5 + trend.urgency * COUPLING),
          reason: `Reality trend shows high urgency in ${trend.domain}`,
        });
      }
    }

    // Deprioritise areas with repeated failures
    for (const modelUpdate of learningUpdate.modelUpdates) {
      if (modelUpdate.dimension === 'accuracy' && modelUpdate.confidence < 0.5) {
        refinements.push({
          priorityArea: modelUpdate.dimension,
          oldPriority: 0.7,
          newPriority: 0.9,
          reason: 'Repeated failures require focused attention',
        });
      }
    }

    return refinements;
  }

  private optimiseResourceAllocation(learningUpdate: LearningUpdate, performanceMetrics: any): any[] {
    const optimisations = [];

    if (performanceMetrics.latency > 5000) {
      optimisations.push({
        resource: 'compute',
        allocation: 'increase-parallelism',
        expectedImprovement: 0.3,
        reason: 'High latency detected',
      });
    }

    if (performanceMetrics.resourceConsumption > 0.8) {
      optimisations.push({
        resource: 'memory',
        allocation: 'enable-aggressive-cleanup',
        expectedImprovement: 0.25,
        reason: 'High resource consumption detected',
      });
    }

    return optimisations;
  }

  private generateBehaviouralPolicies(adjustments: any[]): any[] {
    return adjustments.map(adj => ({
      policyId: adj.policyId,
      behaviour: adj.change,
      enforcement: 'soft', // Gradual adoption
      rollbackAvailable: true,
      reviewInterval: 1000 * 60 * 60 * 24, // 24 hours
    }));
  }

  private verifyStability(): boolean {
    // Check that no core architectural laws are violated
    const corePolicies = ['identity', 'reality-validation', 'ethical-constraints', 'security'];
    for (const policy of this.state.policies.values()) {
      if (corePolicies.some(cp => policy.target.includes(cp)) && policy.changeType === 'architectural') {
        return false;
      }
    }
    return true;
  }

  private calculateAdaptationDepth(report: any): string {
    const types = [
      report.strategyAdjustments.length > 0 ? 'micro' : '',
      report.workflowOptimisations.length > 0 ? 'behavioural' : '',
      report.routingImprovements.length > 0 ? 'strategic' : '',
    ].filter(Boolean);

    if (types.includes('strategic')) return 'strategic';
    if (types.includes('behavioural')) return 'behavioural';
    return 'micro';
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

  getPolicies(): AdaptationPolicy[] {
    return [...this.state.policies.values()];
  }

  getAdaptationHistory(): any[] {
    return this.state.adaptationHistory;
  }
}
