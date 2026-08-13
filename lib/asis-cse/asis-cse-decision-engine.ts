// @ts-nocheck
/**
 * ASIS CSE — Decision Engine (Engine 13)
 * Specification: 13_DECISION_ENGINE.md
 * 
 * Selects the optimal action from all simulated possibilities.
 * Balances benefit, risk, ethics, trust, and long-term sustainability.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveEngine,
  EngineContext,
  EngineResult,
  Scenario,
  Decision,
  RiskReport,
  KAMOSValue,
} from './asis-cse-types';
import { COUPLING, DECISION_CONFIDENCE_THRESHOLD } from './asis-cse-constants';
import { kamosMultiply, emergenceFunction } from './asis-cse-kamos';

interface DecisionEngineState {
  decisionHistory: Decision[];
  rejectedStrategies: Map<string, string>;
}

export class DecisionEngine implements CognitiveEngine {
  readonly id = 'decision-engine';
  readonly version = '1.0.0';
  readonly capabilities = ['decision-optimisation', 'trade-off-balancing', 'ethical-constraint-enforcement', 'strategy-selection', 'explainable-decisions'];

  private state: DecisionEngineState;

  constructor() {
    this.state = {
      decisionHistory: [],
      rejectedStrategies: new Map(),
    };
  }

  async process(context: EngineContext): Promise<EngineResult> {
    const startTime = Date.now();
    const simulation = context.inputs?.simulation as any | undefined;

    if (!simulation || !simulation.rankedScenarios || simulation.rankedScenarios.length === 0) {
      return this.buildResult([], 0, startTime, 'No simulation scenarios provided for decision');
    }

    const scenarios = simulation.rankedScenarios as Scenario[];
    const riskReports = (simulation.riskReports as RiskReport[]) || [];
    const purpose = context.inputs?.purpose || {};
    const identity = context.inputs?.identity || {};
    const ethicalConstraints = context.inputs?.ethicalConstraints || [];

    // Evaluate each scenario against decision formula
    const evaluatedScenarios = scenarios.map((scenario: any) => ({
      scenario,
      score: this.computeDecisionValue(scenario, riskReports.find((r: any) => r.scenarioTreeId === scenario.id), purpose, identity),
      violations: this.checkConstraintViolations(scenario, ethicalConstraints),
    }));

    // Filter out scenarios that violate hard constraints
    const validScenarios = evaluatedScenarios.filter((es: any) => es.violations.length === 0);
    const rejectedScenarios = evaluatedScenarios.filter((es: any) => es.violations.length > 0);

    for (const rejected of rejectedScenarios) {
      this.state.rejectedStrategies.set(rejected.scenario.id, rejected.violations.join('; '));
    }

    // Select optimal strategy
    const optimal = validScenarios.length > 0
      ? validScenarios.reduce((best, current) => current.score > best.score ? current : best, validScenarios[0])
      : null;

    if (!optimal) {
      return this.buildResult(
        [{ error: 'All scenarios violate constraints', rejectedCount: rejectedScenarios.length }],
        0,
        startTime,
        `Decision blocked: All ${evaluatedScenarios.length} scenarios violate ethical or safety constraints`
      );
    }

    const decision: Decision = {
      id: uuidv4(),
      selectedStrategy: optimal.scenario,
      rejectedStrategies: rejectedScenarios.map((rs: any) => ({
        scenarioId: rs.scenario.id,
        reason: rs.violations.join('; '),
        score: rs.score,
      })),
      confidence: {
        overall: optimal.scenario.confidence,
        logical: optimal.score,
        evidence: optimal.scenario.probability,
      },
      explanation: this.generateExplanation(optimal, validScenarios, rejectedScenarios),
      priority: this.computePriority(optimal.scenario, purpose),
      constraintsRespected: ethicalConstraints,
      timestamp: Date.now(),
      traceId: uuidv4(),
    };

    this.state.decisionHistory.push(decision);

    const decisionOutput = {
      decision,
      alternativesConsidered: validScenarios.filter((vs: any) => vs.scenario.id !== optimal.scenario.id).map((vs: any) => ({
        scenarioId: vs.scenario.id,
        score: vs.score,
        whyNotSelected: vs.score < optimal.score ? 'lower-utility' : 'tied-utility',
      })),
      riskAcceptance: optimal.scenario.risk < 0.5 ? 'accepted' : 'marginal',
      ethicalClearance: rejectedScenarios.length === 0 ? 'full' : 'partial',
    };

    return this.buildResult(
      [decisionOutput],
      decision.confidence.overall,
      startTime,
      `Selected strategy '${optimal.scenario.name}' with score ${optimal.score.toFixed(3)}. ${rejectedScenarios.length} strategies rejected. Risk: ${(optimal.scenario.risk * 100).toFixed(1)}%`
    );
  }

  private computeDecisionValue(
    scenario: Scenario,
    riskReport: RiskReport | undefined,
    purpose: any,
    identity: any
  ): number {
    const benefit = scenario.metrics?.expectedBenefit || scenario.utility || 0;
    const risk = scenario.risk || 0;
    const cost = scenario.metrics?.expectedCost || 0;
    const trust = scenario.metrics?.trustImpact || 0;
    const sustainability = scenario.metrics?.sustainability || 0;
    const humanWellbeing = this.estimateHumanWellbeing(scenario);
    const learningValue = scenario.metrics?.learningValue || 0.1;

    // Decision Formula: Benefit - Risk - Cost + Trust + Sustainability + HumanWellbeing + LearningValue
    let value = benefit - risk - cost + trust + sustainability + humanWellbeing + learningValue;

    // KAMOS emergence adjustment
    const kamosValue = kamosMultiply(
      { value: scenario.confidence, confidence: scenario.confidence, timestamp: Date.now() },
      { value: scenario.probability, confidence: scenario.probability, timestamp: Date.now() },
      { sessionId: 'decision', userId: identity.userId || 'system' }
    );

    value *= (1 + COUPLING * ((kamosValue as any).value - 0.5));

    // Safety override: heavily penalise high-risk scenarios
    if (risk > 0.7) value *= 0.1;
    if (risk > 0.9) value = -1;

    return Math.max(-1, Math.min(1, value));
  }

  private estimateHumanWellbeing(scenario: Scenario): number {
    const ethical = scenario.metrics?.ethicalImpact || 0;
    const trust = scenario.metrics?.trustImpact || 0;
    const sustainability = scenario.metrics?.sustainability || 0;
    return (ethical + trust + sustainability) / 3;
  }

  private checkConstraintViolations(scenario: Scenario, constraints: string[]): string[] {
    const violations: string[] = [];

    for (const constraint of constraints) {
      const lower = constraint.toLowerCase();
      if (lower.includes('safety') && scenario.risk > 0.5) {
        violations.push('safety-threshold-exceeded');
      }
      if (lower.includes('ethics') && (scenario.metrics?.ethicalImpact || 0) < -0.3) {
        violations.push('ethical-impact-unacceptable');
      }
      if (lower.includes('trust') && (scenario.metrics?.trustImpact || 0) < -0.4) {
        violations.push('trust-damage-unacceptable');
      }
      if (lower.includes('resource') && (scenario.metrics?.resourceConsumption || 0) > 0.9) {
        violations.push('resource-limit-exceeded');
      }
    }

    return [...new Set(violations)];
  }

  private computePriority(scenario: Scenario, purpose: any): number {
    const urgency = purpose.urgency || 0.5;
    const importance = purpose.importance || 0.5;
    const deadlineProximity = purpose.deadline ? Math.max(0, 1 - (purpose.deadline - Date.now()) / (1000 * 60 * 60 * 24)) : 0.5;
    return (urgency + importance + deadlineProximity) / 3;
  }

  private generateExplanation(
    optimal: { scenario: Scenario; score: number },
    validScenarios: { scenario: Scenario; score: number }[],
    rejectedScenarios: { scenario: Scenario; violations: string[]; score: number }[]
  ): string {
    const parts = [
      `Selected '${optimal.scenario.name}' because it maximises the decision value function.`,
      `Score: ${optimal.score.toFixed(3)} (benefit ${(optimal.scenario.metrics?.expectedBenefit || 0).toFixed(2)}, risk ${(optimal.scenario.risk * 100).toFixed(1)}%, trust impact ${(optimal.scenario.metrics?.trustImpact || 0).toFixed(2)}).`,
      `Considered ${validScenarios.length} valid alternatives and rejected ${rejectedScenarios.length} strategies due to constraint violations.`,
      `Confidence: ${(optimal.scenario.confidence * 100).toFixed(1)}%. Uncertainty remains: ${((1 - optimal.scenario.confidence) * 100).toFixed(1)}%.`,
    ];

    if (rejectedScenarios.length > 0) {
      parts.push(`Rejected: ${rejectedScenarios.map((r: any) => `${r.scenario.name} (${r.violations.join(', ')})`).join('; ')}`);
    }

    return parts.join(' ');
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

  getDecisionHistory(): Decision[] {
    return this.state.decisionHistory;
  }
}
