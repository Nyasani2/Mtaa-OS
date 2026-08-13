// @ts-nocheck
/**
 * ASIS CSE — Knowledge Engine (Engine 09)
 * Specification: 09_KNOWLEDGE_ENGINE.md
 * 
 * Transforms validated evidence into structured knowledge.
 * Builds the dynamic Knowledge Graph used by all downstream cognition.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveEngine,
  EngineContext,
  EngineResult,
  EvidenceSet,
  KnowledgeGraph,
  KnowledgeNode,
  KnowledgeEdge,
  MemoryEntry,
  ConfidenceScore,
  KAMOSValue,
} from './asis-cse-types';
import { COUPLING, KNOWLEDGE_CONFIDENCE_THRESHOLD, KNOWLEDGE_DECAY_RATE } from './asis-cse-constants';
import { kamosMultiply, emergenceFunction, computeContextDistance } from './asis-cse-kamos';

interface KnowledgeEngineState {
  graph: KnowledgeGraph;
  nodeIndex: Map<string, KnowledgeNode>;
  edgeIndex: Map<string, KnowledgeEdge>;
  lastConsolidated: number;
}

export class KnowledgeEngine implements CognitiveEngine {
  readonly id = 'knowledge-engine';
  readonly version = '1.0.0';
  readonly capabilities = ['knowledge-construction', 'graph-management', 'entity-extraction', 'semantic-structuring'];

  private state: KnowledgeEngineState;

  constructor() {
    this.state = {
      graph: { nodes: [], edges: [], version: '1.0.0', lastUpdated: Date.now() },
      nodeIndex: new Map(),
      edgeIndex: new Map(),
      lastConsolidated: Date.now(),
    };
  }

  async process(context: EngineContext): Promise<EngineResult> {
    const startTime = Date.now();
    const evidence = context.inputs?.evidence as EvidenceSet | undefined;

    if (!evidence || !evidence.observations || evidence.observations.length === 0) {
      return this.buildResult([], 0, startTime, 'No evidence provided for knowledge construction');
    }

    const newNodes: KnowledgeNode[] = [];
    const newEdges: KnowledgeEdge[] = [];

    for (const observation of evidence.observations) {
      const node = await this.extractKnowledgeNode(observation, context);
      if (node && node.confidence.overall >= KNOWLEDGE_CONFIDENCE_THRESHOLD) {
        newNodes.push(node);
        this.state.nodeIndex.set(node.id, node);
      }
    }

    // Build relationships between new nodes and existing graph
    for (const node of newNodes) {
      const edges = await this.inferRelationships(node, context);
      newEdges.push(...edges);
      for (const edge of edges) {
        this.state.edgeIndex.set(edge.id, edge);
      }
    }

    // Merge into graph
    this.state.graph.nodes.push(...newNodes);
    this.state.graph.edges.push(...newEdges);
    this.state.graph.lastUpdated = Date.now();

    // Decay stale knowledge
    this.decayKnowledge();

    // Consolidate duplicates
    await this.consolidateGraph();

    const knowledgeOutput = {
      graph: this.state.graph,
      newNodes,
      newEdges,
      nodeCount: this.state.graph.nodes.length,
      edgeCount: this.state.graph.edges.length,
    };

    return this.buildResult(
      [knowledgeOutput],
      this.computeAverageConfidence(newNodes),
      startTime,
      `Constructed ${newNodes.length} knowledge nodes and ${newEdges.length} edges from ${evidence.observations.length} observations`
    );
  }

  private async extractKnowledgeNode(observation: any, context: EngineContext): Promise<KnowledgeNode | null> {
    const id = uuidv4();
    const sourceConfidence = observation.confidence?.overall || 0.5;
    const temporalConfidence = this.computeTemporalConfidence(observation.timestamp);

    // KAMOS-based confidence emergence
    const kamosValue = kamosMultiply(
      { value: sourceConfidence, confidence: sourceConfidence, timestamp: Date.now() },
      { value: temporalConfidence, confidence: temporalConfidence, timestamp: Date.now() },
      context
    );

    const overallConfidence = Math.min(1, (kamosValue as any).value * (1 + COUPLING * (1 - sourceConfidence)));

    const node: KnowledgeNode = {
      id,
      identity: observation.entityId || id,
      description: observation.content || observation.description || 'Unknown entity',
      type: this.classifyEntityType(observation),
      relationships: [],
      confidence: {
        source: sourceConfidence,
        temporal: temporalConfidence,
        overall: overallConfidence,
      },
      history: [{
        timestamp: Date.now(),
        event: 'created',
        sourceObservation: observation.id,
      }],
      dependencies: observation.dependencies || [],
      sourceReferences: [observation.source || 'unknown'],
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        observationId: observation.id,
        contextDistance: computeContextDistance(context, observation.context || {}),
      },
    };

    return node;
  }

  private async inferRelationships(node: KnowledgeNode, context: EngineContext): Promise<KnowledgeEdge[]> {
    const edges: KnowledgeEdge[] = [];

    for (const existingNode of this.state.graph.nodes) {
      if (existingNode.id === node.id) continue;

      const relationshipType = this.detectRelationshipType(node, existingNode);
      if (relationshipType) {
        const confidence = this.computeRelationshipConfidence(node, existingNode);

        const edge: KnowledgeEdge = {
          id: uuidv4(),
          source: node.id,
          target: existingNode.id,
          type: relationshipType,
          confidence,
          metadata: {
            discoveredAt: Date.now(),
            discoveryContext: context.sessionId,
            strength: confidence * COUPLING,
          },
        };

        edges.push(edge);
        node.relationships.push(existingNode.id);
        existingNode.relationships.push(node.id);
      }
    }

    return edges;
  }

  private classifyEntityType(observation: any): string {
    const content = (observation.content || observation.description || '').toLowerCase();
    if (content.includes('person') || observation.entityType === 'person') return 'person';
    if (content.includes('place') || observation.entityType === 'place') return 'place';
    if (content.includes('event') || observation.entityType === 'event') return 'event';
    if (content.includes('process') || observation.entityType === 'process') return 'process';
    if (content.includes('object') || observation.entityType === 'object') return 'object';
    if (content.includes('rule') || content.includes('law')) return 'rule';
    if (content.includes('concept') || content.includes('idea')) return 'concept';
    return 'entity';
  }

  private detectRelationshipType(a: KnowledgeNode, b: KnowledgeNode): string | null {
    // Semantic relationship detection based on description overlap and type compatibility
    const aWords = new Set(a.description.toLowerCase().split(/\s+/));
    const bWords = new Set(b.description.toLowerCase().split(/\s+/));
    const overlap = [...aWords].filter((w: any) => bWords.has(w)).length;
    const similarity = overlap / Math.max(aWords.size, bWords.size);

    if (similarity > 0.7) return 'synonym';
    if (similarity > 0.4) return 'related';
    if (a.type === 'person' && b.type === 'place') return 'located_at';
    if (a.type === 'event' && b.type === 'place') return 'occurred_at';
    if (a.type === 'person' && b.type === 'person') return 'associated_with';
    if (a.type === 'process' && b.type === 'object') return 'operates_on';
    if (a.type === 'rule' && b.type === 'concept') return 'governs';
    if (similarity > 0.2) return 'weakly_related';
    return null;
  }

  private computeRelationshipConfidence(a: KnowledgeNode, b: KnowledgeNode): number {
    const baseConfidence = (a.confidence.overall + b.confidence.overall) / 2;
    const typeBonus = a.type === b.type ? 0.1 : 0;
    return Math.min(1, baseConfidence * COUPLING + typeBonus);
  }

  private computeTemporalConfidence(timestamp?: number): number {
    if (!timestamp) return 0.5;
    const age = Date.now() - timestamp;
    const maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days
    return Math.max(0.3, 1 - age / maxAge);
  }

  private decayKnowledge(): void {
    const now = Date.now();
    for (const node of this.state.graph.nodes) {
      const age = now - (node.metadata?.createdAt || now);
      const decayFactor = Math.exp(-KNOWLEDGE_DECAY_RATE * age / (1000 * 60 * 60 * 24));
      node.confidence.overall *= decayFactor;
    }
  }

  private async consolidateGraph(): Promise<void> {
    // Remove nodes with confidence below threshold
    const validNodes = this.state.graph.nodes.filter((n: any) => n.confidence.overall >= 0.15);
    const validNodeIds = new Set(validNodes.map((n: any) => n.id));
    const validEdges = this.state.graph.edges.filter((e: any) => 
      validNodeIds.has(e.source) && validNodeIds.has(e.target)
    );

    this.state.graph.nodes = validNodes;
    this.state.graph.edges = validEdges;
    this.state.lastConsolidated = Date.now();
  }

  private computeAverageConfidence(nodes: KnowledgeNode[]): number {
    if (nodes.length === 0) return 0;
    return nodes.reduce((sum, n) => sum + n.confidence.overall, 0) / nodes.length;
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

  getGraph(): KnowledgeGraph {
    return this.state.graph;
  }

  getNode(id: string): KnowledgeNode | undefined {
    return this.state.nodeIndex.get(id);
  }
}
