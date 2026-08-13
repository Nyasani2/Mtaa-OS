// @ts-nocheck
/**
 * ASIS CSE — Understanding Engine (Engine 10)
 * Specification: 10_UNDERSTANDING_ENGINE.md
 * 
 * Transforms structured knowledge into coherent mental models.
 * Discovers causality, patterns, and emergent behaviour.
 * The heart of Cognitive Systems Engineering.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveEngine,
  EngineContext,
  EngineResult,
  KnowledgeGraph,
  MentalModel,
  CausalLink,
  Pattern,
  KAMOSValue,
} from './asis-cse-types';
import { COUPLING, UNDERSTANDING_DEPTH_LIMIT } from './asis-cse-constants';
import { kamosMultiply, emergenceFunction, computeContextDistance } from './asis-cse-kamos';

interface UnderstandingEngineState {
  mentalModels: Map<string, MentalModel>;
  causalNetwork: CausalLink[];
  patternLibrary: Map<string, Pattern>;
  modelConfidence: Map<string, number>;
}

export class UnderstandingEngine implements CognitiveEngine {
  readonly id = 'understanding-engine';
  readonly version = '1.0.0';
  readonly capabilities = ['mental-model-construction', 'causality-detection', 'pattern-recognition', 'generalisation', 'analogy-formation'];

  private state: UnderstandingEngineState;

  constructor() {
    this.state = {
      mentalModels: new Map(),
      causalNetwork: [],
      patternLibrary: new Map(),
      modelConfidence: new Map(),
    };
  }

  async process(context: EngineContext): Promise<EngineResult> {
    const startTime = Date.now();
    const knowledgeGraph = context.inputs?.knowledgeGraph as KnowledgeGraph | undefined;

    if (!knowledgeGraph || knowledgeGraph.nodes.length === 0) {
      return this.buildResult([], 0, startTime, 'No knowledge graph provided for understanding construction');
    }

    // Build mental models from knowledge graph structure
    const models = await this.constructMentalModels(knowledgeGraph, context);

    // Discover causal relationships
    const causalLinks = await this.discoverCausality(knowledgeGraph, context);

    // Detect patterns across domains
    const patterns = await this.detectPatterns(knowledgeGraph, models, context);

    // Generalise across domains
    const generalisations = await this.generalisePatterns(patterns, context);

    const understandingOutput = {
      mentalModels: models,
      causalNetwork: causalLinks,
      patterns: [...patterns, ...generalisations],
      modelCount: models.length,
      causalLinkCount: causalLinks.length,
      patternCount: patterns.length + generalisations.length,
    };

    const avgConfidence = this.computeModelConfidence(models);

    return this.buildResult(
      [understandingOutput],
      avgConfidence,
      startTime,
      `Constructed ${models.length} mental models, ${causalLinks.length} causal links, and ${patterns.length + generalisations.length} patterns from ${knowledgeGraph.nodes.length} knowledge nodes`
    );
  }

  private async constructMentalModels(graph: KnowledgeGraph, context: EngineContext): Promise<MentalModel[]> {
    const models: MentalModel[] = [];
    const visited = new Set<string>();

    for (const node of graph.nodes) {
      if (visited.has(node.id)) continue;

      const connectedComponent = this.findConnectedComponent(node.id, graph, visited);
      if (connectedComponent.length >= 2) {
        const model = await this.buildMentalModel(connectedComponent, graph, context);
        if (model) {
          models.push(model);
          this.state.mentalModels.set(model.id, model);
        }
      }
    }

    return models;
  }

  private findConnectedComponent(startId: string, graph: KnowledgeGraph, visited: Set<string>): string[] {
    const component: string[] = [];
    const queue = [startId];

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      component.push(id);

      const neighbors = graph.edges
        .filter((e: any) => e.source === id || e.target === id)
        .map((e: any) => e.source === id ? e.target : e.source);

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) queue.push(neighbor);
      }
    }

    return component;
  }

  private async buildMentalModel(nodeIds: string[], graph: KnowledgeGraph, context: EngineContext): Promise<MentalModel | null> {
    const nodes = graph.nodes.filter((n: any) => nodeIds.includes(n.id));
    if (nodes.length < 2) return null;

    const edges = graph.edges.filter((e: any) => nodeIds.includes(e.source) && nodeIds.includes(e.target));
    const avgConfidence = nodes.reduce((sum, n) => sum + n.confidence.overall, 0) / nodes.length;

    // Extract system dynamics from edge types
    const dynamics = this.inferDynamics(edges);

    const model: MentalModel = {
      id: uuidv4(),
      name: (this as any).generateModelName(nodes),
      description: `Mental model of ${nodes.length} interconnected entities exhibiting ${dynamics.join(', ')} dynamics`,
      entities: nodeIds,
      relationships: edges.map((e: any) => e.id),
      dynamics,
      confidence: avgConfidence * COUPLING,
      domain: this.inferDomain(nodes),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      validationHistory: [{
        timestamp: Date.now(),
        event: 'constructed',
        confidence: avgConfidence,
      }],
    };

    return model;
  }

  private inferDynamics(edges: any[]): string[] {
    const dynamics = new Set<string>();
    const typeCounts = new Map<string, number>();

    for (const edge of edges) {
      const type = edge.type || 'related';
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    }

    if (typeCounts.has('causes') || typeCounts.has('governs')) dynamics.add('causal');
    if (typeCounts.has('operates_on') || typeCounts.has('process')) dynamics.add('operational');
    if (typeCounts.has('located_at') || typeCounts.has('occurred_at')) dynamics.add('spatial-temporal');
    if (typeCounts.has('associated_with') || typeCounts.has('related')) dynamics.add('relational');
    if (edges.length > nodeCount(edges) * 1.5) dynamics.add('highly-interconnected');

    return [...dynamics];
  }

  private inferDomain(nodes: any[]): string {
    const types = new Set(nodes.map((n: any) => n.type));
    if (types.has('person') && types.has('place')) return 'social-geographic';
    if (types.has('process') && types.has('object')) return 'operational';
    if (types.has('rule') || types.has('concept')) return 'abstract-conceptual';
    if (types.has('event')) return 'event-driven';
    return 'general';
  }

  private async discoverCausality(graph: KnowledgeGraph, context: EngineContext): Promise<CausalLink[]> {
    const links: CausalLink[] = [];

    for (const edge of graph.edges) {
      if (edge.type === 'causes' || edge.type === 'governs' || edge.type === 'influences') {
        const sourceNode = graph.nodes.find((n: any) => n.id === edge.source);
        const targetNode = graph.nodes.find((n: any) => n.id === edge.target);

        if (sourceNode && targetNode) {
          const link: CausalLink = {
            id: uuidv4(),
            cause: edge.source,
            effect: edge.target,
            strength: edge.confidence * COUPLING,
            mechanism: edge.type,
            confidence: Math.min(sourceNode.confidence.overall, targetNode.confidence.overall) * edge.confidence,
            conditions: [],
            validated: false,
            discoveredAt: Date.now(),
          };
          links.push(link);
          this.state.causalNetwork.push(link);
        }
      }
    }

    // Infer transitive causality
    const transitiveLinks = this.inferTransitiveCausality(links);
    links.push(...transitiveLinks);

    return links;
  }

  private inferTransitiveCausality(links: CausalLink[]): CausalLink[] {
    const transitive: CausalLink[] = [];
    const causeMap = new Map<string, string[]>();

    for (const link of links) {
      if (!causeMap.has(link.cause)) causeMap.set(link.cause, []);
      causeMap.get(link.cause)!.push(link.effect);
    }

    for (const [cause, effects] of causeMap) {
      for (const effect of effects) {
        const secondaryEffects = causeMap.get(effect);
        if (secondaryEffects) {
          for (const secondary of secondaryEffects) {
            if (secondary !== cause) {
              transitive.push({
                id: uuidv4(),
                cause,
                effect: secondary,
                strength: 0.3,
                mechanism: 'transitive-inference',
                confidence: 0.4,
                conditions: ['requires-validation'],
                validated: false,
                discoveredAt: Date.now(),
              });
            }
          }
        }
      }
    }

    return transitive;
  }

  private async detectPatterns(graph: KnowledgeGraph, models: MentalModel[], context: EngineContext): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    // Detect recurring subgraph structures
    const structurePatterns = this.detectStructuralPatterns(graph);
    patterns.push(...structurePatterns);

    // Detect temporal patterns if timestamps available
    const temporalPatterns = this.detectTemporalPatterns(graph);
    patterns.push(...temporalPatterns);

    // Cross-model pattern detection
    for (let i = 0; i < models.length; i++) {
      for (let j = i + 1; j < models.length; j++) {
        const analogy = this.detectAnalogy(models[i], models[j]);
        if (analogy) patterns.push(analogy);
      }
    }

    return patterns;
  }

  private detectStructuralPatterns(graph: KnowledgeGraph): Pattern[] {
    const patterns: Pattern[] = [];

    // Detect hub nodes (highly connected)
    const degreeMap = new Map<string, number>();
    for (const edge of graph.edges) {
      degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
      degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
    }

    const hubs = [...degreeMap.entries()].filter(([_, d]) => d > 3).map(([id]) => id);
    if (hubs.length > 0) {
      patterns.push({
        id: uuidv4(),
        name: 'hub-structure',
        description: `Detected ${hubs.length} hub nodes with high connectivity`,
        entities: hubs,
        confidence: 0.7,
        domain: 'structural',
        frequency: hubs.length,
        firstObserved: Date.now(),
        lastObserved: Date.now(),
      });
    }

    return patterns;
  }

  private detectTemporalPatterns(graph: KnowledgeGraph): Pattern[] {
    const patterns: Pattern[] = [];
    const timestamps = graph.nodes
      .map((n: any) => n.metadata?.createdAt)
      .filter((t): t is number => typeof t === 'number');

    if (timestamps.length > 3) {
      const sorted = timestamps.sort((a, b) => a - b);
      const intervals = [];
      for (let i = 1; i < sorted.length; i++) {
        intervals.push(sorted[i] - sorted[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, iv) => sum + Math.pow(iv - avgInterval, 2), 0) / intervals.length;

      if (variance < avgInterval * 0.3) {
        patterns.push({
          id: uuidv4(),
          name: 'periodic-observation-pattern',
          description: `Regular observations every ${Math.round(avgInterval / 1000)}s`,
          entities: graph.nodes.map((n: any) => n.id),
          confidence: 0.6,
          domain: 'temporal',
          frequency: timestamps.length,
          firstObserved: sorted[0],
          lastObserved: sorted[sorted.length - 1],
        });
      }
    }

    return patterns;
  }

  private detectAnalogy(modelA: MentalModel, modelB: MentalModel): Pattern | null {
    const commonDynamics = modelA.dynamics.filter((d: any) => modelB.dynamics.includes(d));
    if (commonDynamics.length >= 2) {
      return {
        id: uuidv4(),
        name: `analogy-${modelA.domain}-${modelB.domain}`,
        description: `Structural analogy between ${modelA.name} and ${modelB.name}: shared ${commonDynamics.join(', ')} dynamics`,
        entities: [...modelA.entities, ...modelB.entities],
        confidence: commonDynamics.length * 0.25,
        domain: 'cross-domain',
        frequency: 1,
        firstObserved: Date.now(),
        lastObserved: Date.now(),
      };
    }
    return null;
  }

  private async generalisePatterns(patterns: Pattern[], context: EngineContext): Promise<Pattern[]> {
    const generalisations: Pattern[] = [];
    const domainGroups = new Map<string, Pattern[]>();

    for (const pattern of patterns) {
      if (!domainGroups.has(pattern.domain)) domainGroups.set(pattern.domain, []);
      domainGroups.get(pattern.domain)!.push(pattern);
    }

    for (const [domain, domainPatterns] of domainGroups) {
      if (domainPatterns.length >= 2) {
        generalisations.push({
          id: uuidv4(),
          name: `generalised-${domain}-pattern`,
          description: `Generalised pattern across ${domainPatterns.length} instances in ${domain} domain`,
          entities: domainPatterns.flatMap((p: any) => p.entities),
          confidence: Math.min(0.9, domainPatterns.length * 0.2),
          domain: `${domain}-generalised`,
          frequency: domainPatterns.length,
          firstObserved: Math.min(...domainPatterns.map((p: any) => p.firstObserved)),
          lastObserved: Date.now(),
        });
      }
    }

    return generalisations;
  }

  private computeModelConfidence(models: MentalModel[]): number {
    if (models.length === 0) return 0;
    return models.reduce((sum, m) => sum + m.confidence, 0) / models.length;
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

  getMentalModels(): MentalModel[] {
    return [...this.state.mentalModels.values()];
  }

  getCausalNetwork(): CausalLink[] {
    return this.state.causalNetwork;
  }
}

function nodeCount(edges: any[]): number {
  const nodes = new Set<string>();
  for (const e of edges) {
    nodes.add(e.source);
    nodes.add(e.target);
  }
  return nodes.size;
}


// === AUTO-ADDED STUB ===
(UnderstandingEngine.prototype as any).generateModelName = function(nodes: any[]): string {
  return 'Model_' + Date.now();
};
