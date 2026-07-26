/**
 * ASIS CSE — Feedback Engine (Engine 16)
 * Specification: 16_FEEDBACK_ENGINE.md
 * 
 * Measures the consequences of action.
 * Closes the cognitive loop between action and reality.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveEngine,
  EngineContext,
  EngineResult,
  ActionLog,
  FeedbackReport,
  PerformanceMetrics,
  KAMOSValue,
} from './asis-cse-types';
import { COUPLING, FEEDBACK_CONFIDENCE_THRESHOLD } from './asis-cse-constants';
import { kamosMultiply, emergenceFunction } from './asis-cse-kamos';

interface FeedbackEngineState {
  feedbackHistory: FeedbackReport[];
  performanceBaseline: Map<string, number>;
  reflectionTriggers: number;
}

export class FeedbackEngine implements CognitiveEngine {
  readonly id = 'feedback-engine';
  readonly version = '1.0.0';
  readonly capabilities = ['outcome-measurement', 'gap-analysis', 'performance-metrics', 'reflection-triggering', 'unexpected-event-detection'];

  private state: FeedbackEngineState;

  constructor() {
    this.state = {
      feedbackHistory: [],
      performanceBaseline: new Map(),
      reflectionTriggers: 0,
    };
  }

  async process(context: EngineContext): Promise<EngineResult> {
    const startTime = Date.now();
    const actionResult = context.inputs?.actionResult as any | undefined;

    if (!actionResult || !actionResult.actionLog) {
      return this.buildResult([], 0, startTime, 'No action result provided for feedback analysis');
    }

    const actionLog = actionResult.actionLog as ActionLog;
    const expectedResults = context.inputs?.expectedResults || {};
    const realityState = context.inputs?.realityState || {};

    // Compare expected vs actual
    const gapAnalysis = this.analyseGap(expectedResults, actionLog, realityState);

    // Measure performance
    const performanceMetrics = this.measurePerformance(actionLog, gapAnalysis);

    // Categorise outcome
    const outcomeCategory = this.categoriseOutcome(actionLog, gapAnalysis);

    // Detect unexpected events
    const unexpectedEvents = this.detectUnexpectedEvents(actionLog, realityState);

    // Determine if reflection should be triggered
    const reflectionSignal = this.shouldTriggerReflection(gapAnalysis, performanceMetrics, unexpectedEvents);

    const feedbackReport: FeedbackReport = {
      id: uuidv4(),
      actionId: actionLog.id,
      planId: actionLog.planId,
      outcomeCategory,
      gapAnalysis,
      performanceMetrics,
      unexpectedEvents,
      reflectionSignal,
      learningSignals: this.extractLearningSignals(gapAnalysis, performanceMetrics),
      timestamp: Date.now(),
    };

    this.state.feedbackHistory.push(feedbackReport);

    if (reflectionSignal.trigger) {
      this.state.reflectionTriggers++;
    }

    const feedbackOutput = {
      report: feedbackReport,
      summary: {
        outcome: outcomeCategory,
        accuracy: performanceMetrics.accuracy,
        efficiency: performanceMetrics.efficiency,
        reflectionRequired: reflectionSignal.trigger,
        reflectionReason: reflectionSignal.reason,
        learningOpportunities: feedbackReport.learningSignals.length,
      },
    };

    return this.buildResult(
      [feedbackOutput],
      performanceMetrics.accuracy,
      startTime,
      `Feedback on action ${actionLog.id}: ${outcomeCategory}. Accuracy ${(performanceMetrics.accuracy * 100).toFixed(1)}%. ${reflectionSignal.trigger ? 'Reflection triggered: ' + reflectionSignal.reason : 'No reflection needed.'}`
    );
  }

  private analyseGap(expected: any, actual: ActionLog, realityState: any): any {
    const gaps = [];

    if (expected.outcome && expected.outcome !== actual.outcome) {
      gaps.push({
        dimension: 'outcome',
        expected: expected.outcome,
        actual: actual.outcome,
        deviation: expected.outcome === 'success' && actual.outcome !== 'success' ? 'major' : 'minor',
      });
    }

    if (expected.duration && Math.abs(expected.duration - actual.duration) > expected.duration * 0.2) {
      gaps.push({
        dimension: 'duration',
        expected: expected.duration,
        actual: actual.duration,
        deviation: actual.duration > expected.duration * 1.5 ? 'major' : 'minor',
      });
    }

    if (expected.resources && actual.resourcesUsed) {
      const expectedTypes = new Set(expected.resources.types || []);
      const actualTypes = new Set(actual.resourcesUsed.types || []);
      const missing = [...expectedTypes].filter(t => !actualTypes.has(t));
      if (missing.length > 0) {
        gaps.push({
          dimension: 'resources',
          expected: [...expectedTypes],
          actual: [...actualTypes],
          deviation: 'minor',
        });
      }
    }

    // Check reality state changes
    if (realityState.expectedChanges) {
      for (const change of realityState.expectedChanges) {
        if (!realityState.actualChanges?.some((ac: any) => ac.field === change.field)) {
          gaps.push({
            dimension: 'reality-change',
            expected: change,
            actual: null,
            deviation: 'major',
          });
        }
      }
    }

    return {
      gaps,
      gapCount: gaps.length,
      severity: gaps.some(g => g.deviation === 'major') ? 'major' : gaps.length > 0 ? 'minor' : 'none',
      rootCause: this.inferRootCause(gaps),
    };
  }

  private inferRootCause(gaps: any[]): string {
    if (gaps.length === 0) return 'none';
    if (gaps.some(g => g.dimension === 'outcome' && g.deviation === 'major')) return 'execution-failure';
    if (gaps.some(g => g.dimension === 'duration')) return 'timing-mismatch';
    if (gaps.some(g => g.dimension === 'resources')) return 'resource-shortage';
    if (gaps.some(g => g.dimension === 'reality-change')) return 'reality-divergence';
    return 'unknown';
  }

  private measurePerformance(actionLog: ActionLog, gapAnalysis: any): PerformanceMetrics {
    const baselineAccuracy = this.state.performanceBaseline.get('accuracy') || 0.7;
    const baselineEfficiency = this.state.performanceBaseline.get('efficiency') || 0.7;

    const accuracy = actionLog.outcome === 'success' ? 0.95 : actionLog.outcome === 'partial-failure' ? 0.6 : 0.2;
    const efficiency = Math.max(0, 1 - (actionLog.duration / 60000)); // Normalize to 60s
    const latency = actionLog.duration;
    const resourceConsumption = actionLog.resourcesUsed?.count || 1;

    // Update baselines with exponential moving average
    this.state.performanceBaseline.set('accuracy', baselineAccuracy * 0.9 + accuracy * 0.1);
    this.state.performanceBaseline.set('efficiency', baselineEfficiency * 0.9 + efficiency * 0.1);

    return {
      accuracy,
      efficiency,
      latency,
      resourceConsumption,
      trustImpact: actionLog.outcome === 'success' ? 0.1 : actionLog.outcome === 'partial-failure' ? -0.05 : -0.2,
      userSatisfaction: this.estimateSatisfaction(actionLog, gapAnalysis),
      learningOpportunity: gapAnalysis.gapCount > 0 ? 0.8 : 0.2,
    };
  }

  private estimateSatisfaction(actionLog: ActionLog, gapAnalysis: any): number {
    if (actionLog.outcome === 'success') return 0.9;
    if (actionLog.outcome === 'partial-failure') {
      return actionLog.recoveryPerformed ? 0.6 : 0.4;
    }
    return actionLog.recoveryPerformed ? 0.3 : 0.1;
  }

  private categoriseOutcome(actionLog: ActionLog, gapAnalysis: any): string {
    if (actionLog.outcome === 'success' && gapAnalysis.severity === 'none') return 'successful-outcome';
    if (actionLog.outcome === 'success' && gapAnalysis.severity === 'minor') return 'partial-success';
    if (actionLog.outcome === 'partial-failure') return 'partial-failure';
    if (actionLog.outcome === 'failure' && actionLog.recoveryPerformed) return 'recovered-failure';
    if (actionLog.outcome === 'failure') return 'failure';
    return 'unknown-outcome';
  }

  private detectUnexpectedEvents(actionLog: ActionLog, realityState: any): any[] {
    const unexpected = [];

    if (actionLog.errors && actionLog.errors.length > 0) {
      for (const error of actionLog.errors) {
        unexpected.push({
          type: 'execution-error',
          description: error,
          severity: 'high',
          timestamp: actionLog.timestamp,
        });
      }
    }

    if (realityState.unexpectedChanges) {
      for (const change of realityState.unexpectedChanges) {
        unexpected.push({
          type: 'environmental-change',
          description: change.description,
          severity: change.impact > 0.5 ? 'high' : 'medium',
          timestamp: change.timestamp,
        });
      }
    }

    return unexpected;
  }

  private shouldTriggerReflection(gapAnalysis: any, metrics: PerformanceMetrics, unexpectedEvents: any[]): { trigger: boolean; reason: string } {
    if (gapAnalysis.severity === 'major') {
      return { trigger: true, reason: 'Major gap between expected and actual results' };
    }
    if (metrics.accuracy < 0.5) {
      return { trigger: true, reason: 'Accuracy below threshold' };
    }
    if (unexpectedEvents.length > 0) {
      return { trigger: true, reason: `Unexpected events detected: ${unexpectedEvents.length}` };
    }
    if (metrics.learningOpportunity > 0.7) {
      return { trigger: true, reason: 'High learning opportunity identified' };
    }
    return { trigger: false, reason: 'Performance within acceptable parameters' };
  }

  private extractLearningSignals(gapAnalysis: any, metrics: PerformanceMetrics): any[] {
    const signals = [];

    if (gapAnalysis.severity !== 'none') {
      signals.push({
        type: 'gap-correction',
        priority: gapAnalysis.severity === 'major' ? 'high' : 'medium',
        description: `Correct ${gapAnalysis.gapCount} identified gaps`,
      });
    }

    if (metrics.accuracy < 0.8) {
      signals.push({
        type: 'accuracy-improvement',
        priority: 'high',
        description: `Improve accuracy from ${(metrics.accuracy * 100).toFixed(1)}%`,
      });
    }

    if (metrics.efficiency < 0.7) {
      signals.push({
        type: 'efficiency-optimisation',
        priority: 'medium',
        description: `Optimise execution efficiency`,
      });
    }

    return signals;
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

  getFeedbackHistory(): FeedbackReport[] {
    return this.state.feedbackHistory;
  }
}
