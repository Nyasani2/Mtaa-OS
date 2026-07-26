/**
 * ASIS CSE — Reflection Engine (Engine 17)
 * Specification: 17_REFLECTION_ENGINE.md
 * 
 * Evaluates cognition itself.
 * Transforms experience into understanding — the beginning of wisdom.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveEngine,
  EngineContext,
  EngineResult,
  FeedbackReport,
  ReflectionReport,
  Lesson,
  KAMOSValue,
} from './asis-cse-types';
import { COUPLING, REFLECTION_CONFIDENCE_THRESHOLD } from './asis-cse-constants';
import { kamosMultiply, emergenceFunction } from './asis-cse-kamos';

interface ReflectionEngineState {
  reflections: ReflectionReport[];
  lessonsLearned: Map<string, Lesson>;
  improvementOpportunities: any[];
}

export class ReflectionEngine implements CognitiveEngine {
  readonly id = 'reflection-engine';
  readonly version = '1.0.0';
  readonly capabilities = ['cognitive-cycle-analysis', 'strength-identification', 'weakness-detection', 'assumption-evaluation', 'decision-quality-assessment', 'improvement-recommendation'];

  private state: ReflectionEngineState;

  constructor() {
    this.state = {
      reflections: [],
      lessonsLearned: new Map(),
      improvementOpportunities: [],
    };
  }

  async process(context: EngineContext): Promise<EngineResult> {
    const startTime = Date.now();
    const feedback = context.inputs?.feedback as any | undefined;

    if (!feedback || !feedback.report) {
      return this.buildResult([], 0, startTime, 'No feedback report provided for reflection');
    }

    const feedbackReport = feedback.report as FeedbackReport;
    const reasoningTrace = context.inputs?.reasoningTrace || [];
    const decisionReport = context.inputs?.decisionReport || {};
    const executionLogs = context.inputs?.executionLogs || [];
    const realityChanges = context.inputs?.realityChanges || [];

    // Analyse the completed cognitive cycle
    const cycleAnalysis = this.analyseCognitiveCycle(feedbackReport, reasoningTrace, decisionReport, executionLogs);

    // Identify strengths
    const strengths = this.identifyStrengths(cycleAnalysis, feedbackReport);

    // Detect weaknesses
    const weaknesses = this.detectWeaknesses(cycleAnalysis, feedbackReport);

    // Evaluate assumptions
    const assumptionEvaluation = this.evaluateAssumptions(reasoningTrace, realityChanges);

    // Assess decision quality
    const decisionQuality = this.assessDecisionQuality(decisionReport, feedbackReport);

    // Measure cognitive efficiency
    const cognitiveEfficiency = this.measureCognitiveEfficiency(cycleAnalysis);

    // Generate lessons
    const lessons = this.generateLessons(strengths, weaknesses, assumptionEvaluation, decisionQuality);

    // Recommend improvements
    const recommendations = this.recommendImprovements(weaknesses, assumptionEvaluation, decisionQuality);

    const reflectionReport: ReflectionReport = {
      id: uuidv4(),
      feedbackId: feedbackReport.id,
      cycleAnalysis,
      strengths,
      weaknesses,
      assumptionEvaluation,
      decisionQuality,
      cognitiveEfficiency,
      lessons,
      recommendations,
      learningSignals: this.generateLearningSignals(lessons, weaknesses),
      policySuggestions: this.suggestPolicies(weaknesses),
      adaptationRequests: this.requestAdaptations(weaknesses, recommendations),
      timestamp: Date.now(),
    };

    this.state.reflections.push(reflectionReport);
    for (const lesson of lessons) {
      this.state.lessonsLearned.set(lesson.id, lesson);
    }

    const reflectionOutput = {
      report: reflectionReport,
      summary: {
        strengthsFound: strengths.length,
        weaknessesFound: weaknesses.length,
        lessonsGenerated: lessons.length,
        recommendations: recommendations.length,
        decisionQuality: decisionQuality.score,
        cognitiveEfficiency: cognitiveEfficiency.score,
        wisdomGrowth: this.calculateWisdomGrowth(lessons),
      },
    };

    return this.buildResult(
      [reflectionOutput],
      decisionQuality.score,
      startTime,
      `Reflected on cycle ${feedbackReport.actionId}: ${strengths.length} strengths, ${weaknesses.length} weaknesses, ${lessons.length} lessons. Decision quality: ${(decisionQuality.score * 100).toFixed(1)}%.`
    );
  }

  private analyseCognitiveCycle(feedback: FeedbackReport, reasoningTrace: any[], decisionReport: any, executionLogs: any[]): any {
    return {
      cycleId: feedback.actionId,
      stagesExecuted: this.identifyStages(reasoningTrace),
      gapsAtStage: this.mapGapsToStages(feedback.gapAnalysis),
      attentionAllocation: this.assessAttentionAllocation(reasoningTrace),
      evidenceQuality: this.assessEvidenceQuality(reasoningTrace),
      reasoningQuality: this.assessReasoningQuality(reasoningTrace),
      executionQuality: this.assessExecutionQuality(executionLogs),
      overallCoherence: this.assessCoherence(reasoningTrace, executionLogs),
    };
  }

  private identifyStages(trace: any[]): string[] {
    const stages = new Set<string>();
    for (const entry of trace) {
      if (entry.stage) stages.add(entry.stage);
    }
    return [...stages];
  }

  private mapGapsToStages(gapAnalysis: any): any[] {
    if (!gapAnalysis.gaps) return [];
    return gapAnalysis.gaps.map((gap: any) => ({
      stage: this.inferStageFromGap(gap.dimension),
      gap,
    }));
  }

  private inferStageFromGap(dimension: string): string {
    const mapping: Record<string, string> = {
      'outcome': 'action',
      'duration': 'planning',
      'resources': 'planning',
      'reality-change': 'observation',
    };
    return mapping[dimension] || 'unknown';
  }

  private assessAttentionAllocation(trace: any[]): any {
    const attentionEntries = trace.filter((t: any) => t.stage === 'attention');
    return {
      focusAreas: attentionEntries.map((t: any) => t.focus),
      coverage: attentionEntries.length > 0 ? 0.8 : 0.3,
      efficiency: attentionEntries.length > 2 ? 0.7 : 0.5,
    };
  }

  private assessEvidenceQuality(trace: any[]): any {
    const evidenceEntries = trace.filter((t: any) => t.stage === 'evidence');
    return {
      sourcesUsed: evidenceEntries.length,
      crossValidation: evidenceEntries.some((t: any) => t.crossValidated) ? 0.8 : 0.4,
      confidence: evidenceEntries.length > 0 ? 0.7 : 0.3,
    };
  }

  private assessReasoningQuality(trace: any[]): any {
    const reasoningEntries = trace.filter((t: any) => t.stage === 'reasoning');
    return {
      typesUsed: [...new Set(reasoningEntries.map((t: any) => t.type))],
      conclusionCount: reasoningEntries.reduce((sum: number, t: any) => sum + (t.conclusions || 0), 0),
      confidence: reasoningEntries.length > 0 ? 0.75 : 0.4,
    };
  }

  private assessExecutionQuality(logs: any[]): any {
    if (logs.length === 0) return { successRate: 0, issues: 0 };
    const successes = logs.filter((l: any) => l.success).length;
    return {
      successRate: successes / logs.length,
      issues: logs.filter((l: any) => !l.success).length,
      recoveryRate: logs.filter((l: any) => l.recoveryPerformed).length / logs.length,
    };
  }

  private assessCoherence(trace: any[], logs: any[]): number {
    const hasAllStages = ['observation', 'evidence', 'knowledge', 'understanding', 'reasoning'].every(
      stage => trace.some((t: any) => t.stage === stage)
    );
    const executionMatchesPlan = logs.every((l: any) => l.planned === true || l.success);
    return (hasAllStages ? 0.5 : 0.2) + (executionMatchesPlan ? 0.5 : 0.2);
  }

  private identifyStrengths(cycleAnalysis: any, feedback: FeedbackReport): any[] {
    const strengths = [];

    if (feedback.performanceMetrics.accuracy > 0.8) {
      strengths.push({
        dimension: 'accuracy',
        description: 'High accuracy in execution',
        evidence: `Accuracy: ${(feedback.performanceMetrics.accuracy * 100).toFixed(1)}%`,
        confidence: feedback.performanceMetrics.accuracy,
      });
    }

    if (cycleAnalysis.overallCoherence > 0.7) {
      strengths.push({
        dimension: 'coherence',
        description: 'Cognitive cycle maintained coherence across stages',
        evidence: `Coherence score: ${(cycleAnalysis.overallCoherence * 100).toFixed(1)}%`,
        confidence: cycleAnalysis.overallCoherence,
      });
    }

    if (feedback.performanceMetrics.efficiency > 0.7) {
      strengths.push({
        dimension: 'efficiency',
        description: 'Execution completed efficiently',
        evidence: `Efficiency: ${(feedback.performanceMetrics.efficiency * 100).toFixed(1)}%`,
        confidence: feedback.performanceMetrics.efficiency,
      });
    }

    return strengths;
  }

  private detectWeaknesses(cycleAnalysis: any, feedback: FeedbackReport): any[] {
    const weaknesses = [];

    if (feedback.gapAnalysis.severity !== 'none') {
      weaknesses.push({
        dimension: 'execution-gap',
        description: `Gaps detected: ${feedback.gapAnalysis.gapCount}`,
        severity: feedback.gapAnalysis.severity,
        rootCause: feedback.gapAnalysis.rootCause,
        confidence: 0.9,
      });
    }

    if (cycleAnalysis.attentionAllocation.coverage < 0.5) {
      weaknesses.push({
        dimension: 'attention',
        description: 'Attention allocation was insufficient',
        severity: 'medium',
        rootCause: 'incomplete-observation-coverage',
        confidence: 0.7,
      });
    }

    if (cycleAnalysis.evidenceQuality.confidence < 0.5) {
      weaknesses.push({
        dimension: 'evidence',
        description: 'Evidence quality was low',
        severity: 'high',
        rootCause: 'insufficient-validation',
        confidence: 0.8,
      });
    }

    if (feedback.performanceMetrics.accuracy < 0.6) {
      weaknesses.push({
        dimension: 'accuracy',
        description: 'Accuracy below acceptable threshold',
        severity: 'high',
        rootCause: 'reasoning-error-or-incomplete-understanding',
        confidence: 0.85,
      });
    }

    return weaknesses;
  }

  private evaluateAssumptions(reasoningTrace: any[], realityChanges: any[]): any {
    const assumptions = reasoningTrace
      .filter((t: any) => t.assumptions)
      .flatMap((t: any) => t.assumptions || []);

    const validated = [];
    const invalidated = [];

    for (const assumption of assumptions) {
      const confirmed = realityChanges.some((rc: any) => 
        rc.validates && rc.validates.includes(assumption)
      );
      const contradicted = realityChanges.some((rc: any) => 
        rc.contradicts && rc.contradicts.includes(assumption)
      );

      if (confirmed) {
        validated.push({ assumption, confidence: 0.9 });
      } else if (contradicted) {
        invalidated.push({ assumption, confidence: 0.9 });
      }
    }

    return {
      totalAssumptions: assumptions.length,
      validated,
      invalidated,
      unverified: assumptions.length - validated.length - invalidated.length,
      assumptionQuality: validated.length / Math.max(assumptions.length, 1),
    };
  }

  private assessDecisionQuality(decisionReport: any, feedback: FeedbackReport): any {
    const expectedOutcome = decisionReport.expectedOutcome;
    const actualOutcome = feedback.outcomeCategory;

    let score = 0.5;
    if (actualOutcome === 'successful-outcome' && expectedOutcome === 'success') score = 0.95;
    else if (actualOutcome === 'partial-success') score = 0.6;
    else if (actualOutcome === 'failure') score = 0.1;

    return {
      score,
      expectedVsActual: { expected: expectedOutcome, actual: actualOutcome },
      alternativesConsidered: decisionReport.alternativesConsidered?.length || 0,
      confidenceCalibration: Math.abs((decisionReport.confidence || 0.5) - score),
    };
  }

  private measureCognitiveEfficiency(cycleAnalysis: any): any {
    const stageCount = cycleAnalysis.stagesExecuted.length;
    const idealStages = 10; // Full cycle
    const completeness = Math.min(1, stageCount / idealStages);

    return {
      score: completeness * cycleAnalysis.overallCoherence,
      stageCoverage: completeness,
      coherence: cycleAnalysis.overallCoherence,
      resourceEfficiency: 0.7, // Placeholder for actual measurement
    };
  }

  private generateLessons(strengths: any[], weaknesses: any[], assumptionEval: any, decisionQuality: any): Lesson[] {
    const lessons: Lesson[] = [];

    for (const weakness of weaknesses) {
      lessons.push({
        id: uuidv4(),
        type: 'correction',
        description: `Address ${weakness.dimension}: ${weakness.description}`,
        source: 'weakness-analysis',
        confidence: weakness.confidence,
        applicability: [weakness.dimension],
        createdAt: Date.now(),
      });
    }

    for (const strength of strengths) {
      lessons.push({
        id: uuidv4(),
        type: 'reinforcement',
        description: `Reinforce ${strength.dimension}: ${strength.description}`,
        source: 'strength-analysis',
        confidence: strength.confidence,
        applicability: [strength.dimension],
        createdAt: Date.now(),
      });
    }

    if (assumptionEval.invalidated.length > 0) {
      lessons.push({
        id: uuidv4(),
        type: 'assumption-update',
        description: `Update invalidated assumptions: ${assumptionEval.invalidated.map((a: any) => a.assumption).join(', ')}`,
        source: 'assumption-evaluation',
        confidence: 0.9,
        applicability: ['reasoning', 'understanding'],
        createdAt: Date.now(),
      });
    }

    if (decisionQuality.confidenceCalibration > 0.3) {
      lessons.push({
        id: uuidv4(),
        type: 'calibration',
        description: 'Improve confidence calibration — predicted confidence diverged significantly from outcome',
        source: 'decision-quality',
        confidence: 0.8,
        applicability: ['decision', 'reasoning'],
        createdAt: Date.now(),
      });
    }

    return lessons;
  }

  private recommendImprovements(weaknesses: any[], assumptionEval: any, decisionQuality: any): any[] {
    const recommendations = [];

    for (const weakness of weaknesses) {
      recommendations.push({
        target: weakness.dimension,
        action: `Improve ${weakness.dimension} to prevent ${weakness.rootCause}`,
        priority: weakness.severity === 'high' ? 'immediate' : 'scheduled',
        expectedImpact: weakness.confidence,
      });
    }

    if (assumptionEval.unverified > 3) {
      recommendations.push({
        target: 'evidence',
        action: 'Increase evidence gathering to validate assumptions before reasoning',
        priority: 'high',
        expectedImpact: 0.7,
      });
    }

    if (decisionQuality.alternativesConsidered < 2) {
      recommendations.push({
        target: 'decision',
        action: 'Consider more alternatives during decision phase',
        priority: 'medium',
        expectedImpact: 0.6,
      });
    }

    return recommendations;
  }

  private generateLearningSignals(lessons: Lesson[], weaknesses: any[]): any[] {
    return lessons.map(lesson => ({
      type: lesson.type,
      priority: weaknesses.some((w: any) => w.severity === 'high') ? 'high' : 'medium',
      lessonId: lesson.id,
      description: lesson.description,
    }));
  }

  private suggestPolicies(weaknesses: any[]): any[] {
    const policies = [];
    if (weaknesses.some((w: any) => w.dimension === 'evidence')) {
      policies.push({
        policy: 'minimum-evidence-threshold',
        value: 'increase-by-20-percent',
        rationale: 'Low evidence quality detected',
      });
    }
    if (weaknesses.some((w: any) => w.dimension === 'attention')) {
      policies.push({
        policy: 'attention-coverage-minimum',
        value: '0.7',
        rationale: 'Insufficient attention coverage detected',
      });
    }
    return policies;
  }

  private requestAdaptations(weaknesses: any[], recommendations: any[]): any[] {
    return recommendations.map(rec => ({
      targetEngine: rec.target,
      adaptationType: rec.priority === 'immediate' ? 'behavioural' : 'strategic',
      description: rec.action,
      expectedImprovement: rec.expectedImpact,
    }));
  }

  private calculateWisdomGrowth(lessons: Lesson[]): number {
    if (lessons.length === 0) return 0;
    const avgConfidence = lessons.reduce((sum, l) => sum + l.confidence, 0) / lessons.length;
    return avgConfidence * COUPLING * Math.min(1, lessons.length / 5);
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

  getReflections(): ReflectionReport[] {
    return this.state.reflections;
  }

  getLessons(): Lesson[] {
    return [...this.state.lessonsLearned.values()];
  }
}
