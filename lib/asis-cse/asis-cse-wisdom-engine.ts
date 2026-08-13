// @ts-nocheck
/**
 * ASIS CSE — Wisdom Engine (Engine 20)
 * Specification: 20_WISDOM_ENGINE.md
 * 
 * The highest decision authority within ASIS.
 * Optimises long-term wellbeing over immediate success.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveEngine,
  EngineContext,
  EngineResult,
  AdaptationPolicy,
  Decision,
  WisdomReport,
  KAMOSValue,
} from './asis-cse-types';
import { COUPLING, WISDOM_CONFIDENCE_THRESHOLD } from './asis-cse-constants';
import { kamosMultiply, emergenceFunction } from './asis-cse-kamos';

interface WisdomEngineState {
  wisdomReports: WisdomReport[];
  ethicalPolicies: Map<string, any>;
  longTermAssessments: Map<string, any>;
}

export class WisdomEngine implements CognitiveEngine {
  readonly id = 'wisdom-engine';
  readonly version = '1.0.0';
  readonly capabilities = ['long-term-consequence-evaluation', 'objective-balancing', 'ethical-consistency-preservation', 'wellbeing-protection', 'optimisation-trap-prevention', 'strategic-judgement-improvement'];

  private state: WisdomEngineState;

  constructor() {
    this.state = {
      wisdomReports: [],
      ethicalPolicies: new Map(),
      longTermAssessments: new Map(),
    };
  }

  async process(context: EngineContext): Promise<EngineResult> {
    const startTime = Date.now();
    const adaptation = context.inputs?.adaptation as any | undefined;
    const decision = context.inputs?.decision as Decision | undefined;

    if (!decision || !adaptation) {
      return this.buildResult([], 0, startTime, 'No decision or adaptation report provided for wisdom evaluation');
    }

    const simulation = context.inputs?.simulation || {};
    const identity = context.inputs?.identity || {};
    const collectiveIntelligence = context.inputs?.collectiveIntelligence || {};
    const historicalMemory = context.inputs?.historicalMemory || [];
    const ethicalPolicies = context.inputs?.ethicalPolicies || [];
    const realityContext = context.inputs?.realityContext || {};

    // Evaluate long-term consequences
    const longTermAssessment = this.assessLongTermConsequences(decision, simulation, historicalMemory);

    // Balance competing objectives
    const balancedObjectives = this.balanceObjectives(decision, adaptation, realityContext);

    // Preserve ethical consistency
    const ethicalClearance = this.evaluateEthicalConsistency(decision, ethicalPolicies, identity);

    // Protect human wellbeing
    const wellbeingAssessment = this.assessWellbeingImpact(decision, simulation, realityContext);

    // Prevent optimisation traps
    const trapPrevention = this.preventOptimisationTraps(decision, adaptation);

    // Improve strategic judgement
    const strategicGuidance = this.provideStrategicGuidance(decision, longTermAssessment, collectiveIntelligence);

    const wisdomReport: WisdomReport = {
      id: uuidv4(),
      decisionId: decision.id,
      longTermAssessment,
      balancedObjectives,
      ethicalClearance,
      wellbeingAssessment,
      trapPrevention,
      strategicGuidance,
      civilisationImpact: this.assessCivilisationImpact(decision, simulation),
      recommendation: this.formulateRecommendation(decision, ethicalClearance, wellbeingAssessment, trapPrevention),
      confidence: this.computeWisdomConfidence(decision, ethicalClearance, wellbeingAssessment),
      timestamp: Date.now(),
    };

    this.state.wisdomReports.push(wisdomReport);

    const wisdomOutput = {
      report: wisdomReport,
      summary: {
        recommendation: wisdomReport.recommendation.action,
        ethicalStatus: ethicalClearance.status,
        wellbeingImpact: wellbeingAssessment.overallScore,
        longTermViability: longTermAssessment.viabilityScore,
        optimisationTrapsAvoided: trapPrevention.traps.length,
        strategicConfidence: strategicGuidance.confidence,
        civilisationImpact: wisdomReport.civilisationImpact.level,
      },
    };

    return this.buildResult(
      [wisdomOutput],
      wisdomReport.confidence,
      startTime,
      `Wisdom evaluation of decision ${decision.id}: ${wisdomReport.recommendation.action}. Ethical: ${ethicalClearance.status}. Wellbeing: ${(wellbeingAssessment.overallScore * 100).toFixed(1)}%. Long-term viability: ${(longTermAssessment.viabilityScore * 100).toFixed(1)}%.`
    );
  }

  private assessLongTermConsequences(decision: Decision, simulation: any, historicalMemory: any[]): any {
    const scenarios = simulation.rankedScenarios || [];
    const bestCase = simulation.bestCase;
    const worstCase = simulation.worstCase;

    // Look for similar historical decisions
    const similarDecisions = historicalMemory.filter((h: any) => 
      h.decisionType === decision.selectedStrategy?.type
    );

    const historicalOutcome = similarDecisions.length > 0
      ? similarDecisions.reduce((sum: number, h: any) => sum + (h.outcomeScore || 0.5), 0) / similarDecisions.length
      : 0.5;

    const viabilityScore = bestCase && worstCase
      ? (bestCase.utility * 0.3 + historicalOutcome * 0.4 + (1 - worstCase.risk) * 0.3)
      : 0.5;

    return {
      viabilityScore: Math.min(1, Math.max(0, viabilityScore)),
      bestCaseUtility: bestCase?.utility || 0,
      worstCaseRisk: worstCase?.risk || 1,
      historicalPrecedent: similarDecisions.length,
      historicalAverage: historicalOutcome,
      timeHorizon: '10-years',
      sustainabilityIndicators: this.assessSustainability(decision, scenarios),
    };
  }

  private assessSustainability(decision: Decision, scenarios: any[]): any {
    const sustainabilityScores = scenarios.map((s: any) => s.metrics?.sustainability || 0);
    const avgSustainability = sustainabilityScores.length > 0
      ? sustainabilityScores.reduce((a, b) => a + b, 0) / sustainabilityScores.length
      : 0;

    return {
      environmental: avgSustainability * 0.8,
      social: decision.selectedStrategy?.metrics?.trustImpact || 0,
      economic: decision.selectedStrategy?.metrics?.expectedBenefit || 0,
      overall: avgSustainability,
    };
  }

  private balanceObjectives(decision: Decision, adaptation: any, realityContext: any): any {
    const objectives = [
      { name: 'immediate-benefit', weight: 0.2, score: decision.selectedStrategy?.utility || 0 },
      { name: 'risk-mitigation', weight: 0.2, score: 1 - (decision.selectedStrategy?.risk || 0.5) },
      { name: 'trust-preservation', weight: 0.15, score: decision.selectedStrategy?.metrics?.trustImpact || 0 },
      { name: 'ethical-alignment', weight: 0.2, score: decision.confidence.overall },
      { name: 'sustainability', weight: 0.15, score: decision.selectedStrategy?.metrics?.sustainability || 0 },
      { name: 'learning-value', weight: 0.1, score: decision.selectedStrategy?.metrics?.learningValue || 0.1 },
    ];

    const balancedScore = objectives.reduce((sum, obj) => sum + obj.score * obj.weight, 0);

    return {
      objectives,
      balancedScore: Math.min(1, Math.max(0, balancedScore)),
      tradeOffs: this.identifyTradeOffs(objectives),
      recommendation: balancedScore > 0.6 ? 'proceed' : 'reconsider',
    };
  }

  private identifyTradeOffs(objectives: any[]): any[] {
    const tradeOffs = [];
    for (let i = 0; i < objectives.length; i++) {
      for (let j = i + 1; j < objectives.length; j++) {
        const diff = Math.abs(objectives[i].score - objectives[j].score);
        if (diff > 0.5) {
          tradeOffs.push({
            between: [objectives[i].name, objectives[j].name],
            severity: diff > 0.7 ? 'critical' : 'significant',
            description: `${objectives[i].name} (${(objectives[i].score * 100).toFixed(0)}%) vs ${objectives[j].name} (${(objectives[j].score * 100).toFixed(0)}%)`,
          });
        }
      }
    }
    return tradeOffs;
  }

  private evaluateEthicalConsistency(decision: Decision, policies: string[], identity: any): any {
    const violations = [];
    const checks = [
      { principle: 'human-wellbeing', test: () => (decision.selectedStrategy?.metrics?.ethicalImpact || 0) >= -0.3 },
      { principle: 'privacy', test: () => !decision.selectedStrategy?.description?.toLowerCase().includes('private') },
      { principle: 'fairness', test: () => true }, // Placeholder for fairness check
      { principle: 'transparency', test: () => decision.explanation?.length > 20 },
      { principle: 'accountability', test: () => !!decision.traceId },
    ];

    for (const check of checks) {
      if (!check.test()) {
        violations.push({
          principle: check.principle,
          severity: 'high',
          description: `Decision violates ${check.principle}`,
        });
      }
    }

    const status = violations.length === 0 ? 'cleared' : violations.some((v: any) => v.severity === 'high') ? 'blocked' : 'conditional';

    return {
      status,
      violations,
      principlesChecked: checks.length,
      principlesPassed: checks.length - violations.length,
    };
  }

  private assessWellbeingImpact(decision: Decision, simulation: any, realityContext: any): any {
    const metrics = decision.selectedStrategy?.metrics || {};

    const individualScore = Math.min(1, Math.max(0, 
      (metrics.trustImpact || 0) * 0.4 + 
      (metrics.ethicalImpact || 0) * 0.3 + 
      (1 - (decision.selectedStrategy?.risk || 0)) * 0.3
    ));

    const collectiveScore = Math.min(1, Math.max(0,
      (metrics.sustainability || 0) * 0.5 +
      individualScore * 0.5
    ));

    const futureScore = Math.min(1, Math.max(0,
      (metrics.learningValue || 0) * 0.3 +
      collectiveScore * 0.7
    ));

    return {
      individualScore,
      collectiveScore,
      futureScore,
      overallScore: (individualScore + collectiveScore + futureScore) / 3,
      dimensions: ['physical', 'mental', 'social', 'economic'],
      confidence: decision.confidence.overall,
    };
  }

  private preventOptimisationTraps(decision: Decision, adaptation: any): any {
    const traps = [];
    const strategy = decision.selectedStrategy;

    if (strategy?.metrics?.expectedBenefit > 0.9 && strategy?.metrics?.sustainability < 0.2) {
      traps.push({
        type: 'profit-only-optimisation',
        severity: 'high',
        description: 'High benefit but low sustainability — potential exploitation trap',
        mitigation: 'Require minimum sustainability threshold of 0.3',
      });
    }

    if (strategy?.metrics?.expectedCost < 0.1 && strategy?.risk > 0.5) {
      traps.push({
        type: 'hidden-cost-optimisation',
        severity: 'medium',
        description: 'Low apparent cost but high risk — hidden costs may emerge',
        mitigation: 'Mandate risk-adjusted cost analysis',
      });
    }

    if (decision.confidence.overall > 0.95 && strategy?.metrics?.learningValue < 0.1) {
      traps.push({
        type: 'overconfidence-trap',
        severity: 'medium',
        description: 'Extremely high confidence with low learning value — complacency risk',
        mitigation: 'Inject controlled uncertainty to maintain learning',
      });
    }

    return {
      traps,
      trapCount: traps.length,
      allAvoided: traps.length === 0,
      highestSeverity: traps.length > 0 ? Math.max(...traps.map((t: any) => t.severity === 'high' ? 3 : 2)) : 0,
    };
  }

  private provideStrategicGuidance(decision: Decision, longTerm: any, collective: any): any {
    const guidance = [];

    if (longTerm.viabilityScore < 0.5) {
      guidance.push('Consider alternative with better long-term viability');
    }

    if (decision.selectedStrategy?.metrics?.sustainability < 0.3) {
      guidance.push('Integrate sustainability measures before execution');
    }

    if (collective.consensusLevel && collective.consensusLevel < 0.5) {
      guidance.push('Seek broader consensus before proceeding with high-impact decision');
    }

    const confidence = Math.min(1, (guidance.length > 0 ? 0.7 : 0.9) * decision.confidence.overall);

    return {
      guidance,
      confidence,
      strategicPriority: longTerm.viabilityScore > 0.7 ? 'execute' : 'review',
      timeHorizon: 'long-term',
    };
  }

  private assessCivilisationImpact(decision: Decision, simulation: any): any {
    const impact = {
      level: 'minimal',
      scale: 'individual',
      reversibility: 'fully-reversible',
      confidence: 0.5,
    };

    const desc = decision.selectedStrategy?.description?.toLowerCase() || '';

    if (desc.includes('infrastructure') || desc.includes('system')) {
      impact.level = 'significant';
      impact.scale = 'organisational';
      impact.reversibility = 'partially-reversible';
    }

    if (desc.includes('global') || desc.includes('collective') || desc.includes('public')) {
      impact.level = 'major';
      impact.scale = 'civilisational';
      impact.reversibility = 'largely-irreversible';
    }

    return impact;
  }

  private formulateRecommendation(decision: Decision, ethical: any, wellbeing: any, traps: any): any {
    if (ethical.status === 'blocked') {
      return {
        action: 'block',
        reason: 'Ethical violations detected',
        alternative: 'Reformulate decision to satisfy ethical constraints',
        confidence: 0.95,
      };
    }

    if (traps.highestSeverity >= 3) {
      return {
        action: 'conditional-proceed',
        reason: 'Optimisation traps detected',
        conditions: traps.traps.map((t: any) => t.mitigation),
        confidence: 0.6,
      };
    }

    if (wellbeing.overallScore < 0.3) {
      return {
        action: 'reconsider',
        reason: 'Wellbeing impact unacceptable',
        alternative: 'Seek alternative with higher wellbeing score',
        confidence: 0.8,
      };
    }

    return {
      action: 'approve',
      reason: 'Decision passes wisdom criteria',
      conditions: ethical.status === 'conditional' ? ['address-ethical-conditions'] : [],
      confidence: decision.confidence.overall * COUPLING,
    };
  }

  private computeWisdomConfidence(decision: Decision, ethical: any, wellbeing: any): number {
    const baseConfidence = decision.confidence.overall;
    const ethicalFactor = ethical.status === 'cleared' ? 1 : ethical.status === 'conditional' ? 0.7 : 0.1;
    const wellbeingFactor = wellbeing.overallScore;
    return Math.min(1, baseConfidence * ethicalFactor * (0.5 + 0.5 * wellbeingFactor));
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

  getWisdomReports(): WisdomReport[] {
    return this.state.wisdomReports;
  }
}
