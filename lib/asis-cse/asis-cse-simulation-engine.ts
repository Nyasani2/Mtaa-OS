/**
 * ASIS CSE — Simulation Engine (Engine 12)
 * Specification: 12_SIMULATION_ENGINE.md
 * 
 * Explores possible futures before action is taken.
 * Internal experimentation without real-world consequences.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveEngine,
  EngineContext,
  EngineResult,
  Conclusion,
  Scenario,
  ScenarioTree,
  RiskReport,
  KAMOSValue,
} from './asis-cse-types';
import { COUPLING, SIMULATION_DEPTH_LIMIT, SIMULATION_BRANCHING_FACTOR } from './asis-cse-constants';
import { kamosMultiply, emergenceFunction } from './asis-cse-kamos';

interface SimulationEngineState {
  scenarioHistory: Scenario[];
  simulationCount: number;
}

export class SimulationEngine implements CognitiveEngine {
  readonly id = 'simulation-engine';
  readonly version = '1.0.0';
  readonly capabilities = ['future-prediction', 'scenario-exploration', 'risk-estimation', 'consequence-detection', 'strategy-testing'];

  private state: SimulationEngineState;

  constructor() {
    this.state = {
      scenarioHistory: [],
      simulationCount: 0,
    };
  }

  async process(context: EngineContext): Promise<EngineResult> {
    const startTime = Date.now();
    const reasoning = context.inputs?.reasoning as any | undefined;

    if (!reasoning || !reasoning.conclusions || reasoning.conclusions.length === 0) {
      return this.buildResult([], 0, startTime, 'No reasoning conclusions provided for simulation');
    }

    const conclusions = reasoning.conclusions as Conclusion[];
    const realityModel = context.inputs?.reality || {};
    const constraints = context.inputs?.constraints || {};

    const scenarioTrees: ScenarioTree[] = [];
    const riskReports: RiskReport[] = [];

    for (const conclusion of conclusions.slice(0, SIMULATION_BRANCHING_FACTOR)) {
      const tree = await this.simulateScenarioTree(conclusion, realityModel, constraints, context);
      scenarioTrees.push(tree);

      const riskReport = this.assessRisk(tree);
      riskReports.push(riskReport);
    }

    // Rank scenarios by utility
    const rankedScenarios = this.rankScenarios(scenarioTrees);

    const simulationOutput = {
      scenarioTrees,
      riskReports,
      rankedScenarios,
      recommendedScenario: rankedScenarios[0] || null,
      simulationCount: this.state.simulationCount,
      worstCase: this.findWorstCase(scenarioTrees),
      bestCase: this.findBestCase(scenarioTrees),
      mostProbable: this.findMostProbable(scenarioTrees),
    };

    const avgConfidence = scenarioTrees.length > 0
      ? scenarioTrees.reduce((sum, t) => sum + t.root.confidence, 0) / scenarioTrees.length
      : 0;

    return this.buildResult(
      [simulationOutput],
      avgConfidence,
      startTime,
      `Simulated ${scenarioTrees.length} scenario trees with depth up to ${SIMULATION_DEPTH_LIMIT}. Best utility: ${simulationOutput.bestCase?.utility.toFixed(3) || 0}, Worst: ${simulationOutput.worstCase?.utility.toFixed(3) || 0}`
    );
  }

  private async simulateScenarioTree(
    conclusion: Conclusion,
    realityModel: any,
    constraints: any,
    context: EngineContext
  ): Promise<ScenarioTree> {
    const rootScenario: Scenario = {
      id: uuidv4(),
      name: `Root: ${conclusion.statement.substring(0, 60)}...`,
      description: conclusion.statement,
      parentId: null,
      children: [],
      state: { ...realityModel, actionTaken: conclusion.statement },
      probability: conclusion.confidence.overall,
      utility: 0,
      risk: 0,
      confidence: conclusion.confidence.overall,
      depth: 0,
      timestamp: Date.now(),
      metrics: {
        expectedBenefit: 0,
        expectedCost: 0,
        trustImpact: 0,
        ethicalImpact: 0,
        resourceConsumption: 0,
        sustainability: 0,
      },
    };

    await this.expandScenario(rootScenario, conclusion, constraints, context, 0);

    const tree: ScenarioTree = {
      id: uuidv4(),
      root: rootScenario,
      conclusionId: conclusion.id,
      totalNodes: this.countNodes(rootScenario),
      maxDepth: this.getMaxDepth(rootScenario),
      createdAt: Date.now(),
    };

    this.state.scenarioHistory.push(rootScenario);
    this.state.simulationCount++;

    return tree;
  }

  private async expandScenario(
    scenario: Scenario,
    conclusion: Conclusion,
    constraints: any,
    context: EngineContext,
    depth: number
  ): Promise<void> {
    if (depth >= SIMULATION_DEPTH_LIMIT) return;

    // Simulate state transitions based on conclusion type
    const transitions = this.generateTransitions(scenario, conclusion, constraints);

    for (const transition of transitions.slice(0, 3)) {
      const childProbability = scenario.probability * transition.probability * COUPLING;
      const childUtility = this.computeUtility(transition, scenario);
      const childRisk = this.computeRisk(transition, scenario);

      const childScenario: Scenario = {
        id: uuidv4(),
        name: transition.name,
        description: transition.description,
        parentId: scenario.id,
        children: [],
        state: { ...scenario.state, ...transition.stateDelta },
        probability: Math.max(0.01, Math.min(1, childProbability)),
        utility: childUtility,
        risk: childRisk,
        confidence: scenario.confidence * transition.confidence,
        depth: depth + 1,
        timestamp: Date.now(),
        metrics: {
          expectedBenefit: transition.benefit || 0,
          expectedCost: transition.cost || 0,
          trustImpact: transition.trustImpact || 0,
          ethicalImpact: transition.ethicalImpact || 0,
          resourceConsumption: transition.resourceCost || 0,
          sustainability: transition.sustainability || 0,
        },
      };

      scenario.children.push(childScenario);
      await this.expandScenario(childScenario, conclusion, constraints, context, depth + 1);
    }
  }

  private generateTransitions(scenario: Scenario, conclusion: Conclusion, constraints: any): any[] {
    const transitions = [];

    // Success transition
    transitions.push({
      name: 'success-path',
      description: 'Action succeeds as intended',
      probability: conclusion.confidence.overall,
      stateDelta: { status: 'succeeded', progress: 1 },
      confidence: conclusion.confidence.overall,
      benefit: 1.0,
      cost: 0.3,
      trustImpact: 0.2,
      ethicalImpact: 0.1,
      resourceCost: 0.4,
      sustainability: 0.3,
    });

    // Partial success
    transitions.push({
      name: 'partial-success',
      description: 'Action achieves partial objectives',
      probability: 0.3,
      stateDelta: { status: 'partial', progress: 0.5 },
      confidence: 0.5,
      benefit: 0.5,
      cost: 0.3,
      trustImpact: 0.05,
      ethicalImpact: 0.0,
      resourceCost: 0.4,
      sustainability: 0.1,
    });

    // Failure transition
    transitions.push({
      name: 'failure-path',
      description: 'Action fails or produces unintended consequences',
      probability: 0.2,
      stateDelta: { status: 'failed', progress: 0 },
      confidence: 0.7,
      benefit: 0,
      cost: 0.8,
      trustImpact: -0.3,
      ethicalImpact: -0.2,
      resourceCost: 0.6,
      sustainability: -0.1,
    });

    // Unintended consequence
    if (conclusion.type === 'causal' || conclusion.type === 'deductive') {
      transitions.push({
        name: 'unintended-consequence',
        description: 'Secondary effects emerge from the action',
        probability: 0.4,
        stateDelta: { status: 'complex', emergent: true },
        confidence: 0.4,
        benefit: 0.2,
        cost: 0.5,
        trustImpact: -0.1,
        ethicalImpact: -0.1,
        resourceCost: 0.3,
        sustainability: -0.05,
      });
    }

    return transitions;
  }

  private computeUtility(transition: any, parent: Scenario): number {
    const benefit = transition.benefit || 0;
    const cost = transition.cost || 0;
    const trust = transition.trustImpact || 0;
    const ethical = transition.ethicalImpact || 0;
    const sustainability = transition.sustainability || 0;
    return (benefit - cost + trust + ethical + sustainability) * COUPLING;
  }

  private computeRisk(transition: any, parent: Scenario): number {
    const cost = transition.cost || 0;
    const trustLoss = Math.abs(Math.min(0, transition.trustImpact || 0));
    const ethicalRisk = Math.abs(Math.min(0, transition.ethicalImpact || 0));
    return (cost + trustLoss + ethicalRisk) * (1 - parent.confidence);
  }

  private assessRisk(tree: ScenarioTree): RiskReport {
    const allScenarios = this.flattenTree(tree.root);
    const maxRisk = Math.max(...allScenarios.map(s => s.risk));
    const avgRisk = allScenarios.reduce((sum, s) => sum + s.risk, 0) / allScenarios.length;
    const worstScenario = allScenarios.reduce((worst, s) => s.risk > worst.risk ? s : worst, allScenarios[0]);

    return {
      id: uuidv4(),
      scenarioTreeId: tree.id,
      overallRisk: avgRisk,
      maxRisk,
      worstCase: worstScenario?.name || 'none',
      riskFactors: [
        { factor: 'execution-failure', probability: 0.2, impact: 0.8 },
        { factor: 'unintended-consequences', probability: 0.4, impact: 0.5 },
        { factor: 'resource-exhaustion', probability: 0.15, impact: 0.6 },
      ],
      mitigation: 'Monitor execution, maintain fallback plans, validate assumptions continuously',
      confidence: tree.root.confidence,
    };
  }

  private rankScenarios(trees: ScenarioTree[]): Scenario[] {
    const allLeaves: Scenario[] = [];
    for (const tree of trees) {
      allLeaves.push(...this.getLeaves(tree.root));
    }

    return allLeaves.sort((a, b) => {
      const scoreA = a.utility * a.probability * (1 - a.risk);
      const scoreB = b.utility * b.probability * (1 - b.risk);
      return scoreB - scoreA;
    });
  }

  private findWorstCase(trees: ScenarioTree[]): Scenario | null {
    const allLeaves = trees.flatMap(t => this.getLeaves(t.root));
    if (allLeaves.length === 0) return null;
    return allLeaves.reduce((worst, s) => s.utility < worst.utility ? s : worst, allLeaves[0]);
  }

  private findBestCase(trees: ScenarioTree[]): Scenario | null {
    const allLeaves = trees.flatMap(t => this.getLeaves(t.root));
    if (allLeaves.length === 0) return null;
    return allLeaves.reduce((best, s) => s.utility > best.utility ? s : best, allLeaves[0]);
  }

  private findMostProbable(trees: ScenarioTree[]): Scenario | null {
    const allLeaves = trees.flatMap(t => this.getLeaves(t.root));
    if (allLeaves.length === 0) return null;
    return allLeaves.reduce((best, s) => s.probability > best.probability ? s : best, allLeaves[0]);
  }

  private countNodes(scenario: Scenario): number {
    return 1 + scenario.children.reduce((sum, child) => sum + this.countNodes(child), 0);
  }

  private getMaxDepth(scenario: Scenario): number {
    if (scenario.children.length === 0) return scenario.depth;
    return Math.max(...scenario.children.map(c => this.getMaxDepth(c)));
  }

  private flattenTree(scenario: Scenario): Scenario[] {
    return [scenario, ...scenario.children.flatMap(c => this.flattenTree(c))];
  }

  private getLeaves(scenario: Scenario): Scenario[] {
    if (scenario.children.length === 0) return [scenario];
    return scenario.children.flatMap(c => this.getLeaves(c));
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
}
