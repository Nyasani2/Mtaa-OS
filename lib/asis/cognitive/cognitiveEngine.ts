// ASIS v3 — Cognitive Engine
// How ASIS "thinks": network traversal, pattern matching, prediction, cross-pollination
// No neural networks. No APIs. Intelligence emerges from graph topology.

import {
  KnowledgeNetwork,
} from '../network/knowledgeNetwork';
import {
  KnowledgeNode,
  KnowledgeEdge,
  NetworkQuery,
  NetworkPath,
  SimilarityResult,
  Prediction,
  CrossPollination,
  QueryResult,
  PatternMatch,
  NodeType,
  EdgeType,
  AsisDomain,
  GeneratedResponse,
  AsisRequest,
  AsisContext,
  AsisAction,
  AsisInsight,
  GrowthEvent,
  SpawnedCapability,
} from '../types';

/**
 * The Cognitive Engine is ASIS's "brain" — but it is not a neural network.
 * It is a set of graph algorithms that operate on the Knowledge Network:
 * 
 * 1. QUERY RESOLVER: "What do we know about X?"
 *    → Traverses the network to find relevant nodes and paths
 * 
 * 2. PATTERN MATCHER: "This looks like..."
 *    → Finds similar nodes based on properties and connections
 * 
 * 3. PREDICTOR ENGINE: "Most likely outcome is..."
 *    → Uses Bayesian inference on network topology
 * 
 * 4. CROSS-POLLINATOR: "Wallet insight applies to Transport"
 *    → Finds connections between unrelated domains
 * 
 * 5. RESPONSE GENERATOR: "Build natural language from network results"
 *    → Formats traversal results into human-readable responses
 */
export class CognitiveEngine {
  private network: KnowledgeNetwork;

  constructor(network: KnowledgeNetwork) {
    this.network = network;
  }

  // ═══════════════════════════════════════════════════════════════
  // QUERY RESOLVER
  // ═══════════════════════════════════════════════════════════════

  /**
   * Resolve a natural language query into network operations
   * 
   * Example: "My car won't start" →
   *   1. Find user node
   *   2. Find vehicle nodes connected to user
   *   3. Find problem nodes matching "won't start"
   *   4. Find paths from vehicle to problem to solution
   */
  async resolveQuery(
    query: string,
    context: AsisContext,
    maxDepth: number = 4
  ): Promise<QueryResult> {
    const startTime = Date.now();
    const normalizedQuery = query.toLowerCase();

    // Extract entities from query (simple keyword matching)
    const entities = this.extractEntities(normalizedQuery);

    // Find matching nodes in network
    const matchedNodes: KnowledgeNode[] = [];
    const matchedPaths: NetworkPath[] = [];

    // Search by label
    const allNodes = this.network.query({ maxResults: 10000 }).nodes;
    for (const node of allNodes) {
      const nodeLabel = node.label.toLowerCase();
      for (const entity of entities) {
        if (nodeLabel.includes(entity) || entity.includes(nodeLabel)) {
          matchedNodes.push(node);
          break;
        }
      }
    }

    // Find paths between matched nodes
    for (let i = 0; i < matchedNodes.length; i++) {
      for (let j = i + 1; j < matchedNodes.length; j++) {
        const paths = this.network.findPaths(
          matchedNodes[i].id,
          matchedNodes[j].id,
          maxDepth
        );
        matchedPaths.push(...paths);
      }
    }

    // Get edges between matched nodes
    const nodeIds = new Set(matchedNodes.map(n => n.id));
    const matchedEdges = this.network.query({ maxResults: 10000 }).edges.filter(
      edge => nodeIds.has(edge.from) && nodeIds.has(edge.to)
    );

    const processingTime = Date.now() - startTime;

    return {
      nodes: matchedNodes,
      edges: matchedEdges,
      paths: matchedPaths.sort((a, b) => b.score - a.score).slice(0, 20),
      query: normalizedQuery,
      processingTime,
    };
  }

  private extractEntities(query: string): string[] {
    // Simple entity extraction — can be enhanced with network-based NER
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
      'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
      'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'under', 'again', 'further', 'then', 'once',
      'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
      'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
      'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'my',
      'your', 'his', 'her', 'its', 'our', 'their', 'what', 'which', 'who',
      'whom', 'this', 'that', 'these', 'those', 'am', 'i', 'me', 'we', 'us',
    ]);

    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  // ═══════════════════════════════════════════════════════════════
  // PATTERN MATCHER
  // ═══════════════════════════════════════════════════════════════

  /**
   * Find patterns similar to a reference in the network
   * 
   * Example: User reports "car won't start, clicking noise"
   * → Find problem nodes with similar symptoms
   * → Rank by similarity score
   */
  async findPatterns(
    referenceNodeId: string,
    maxResults: number = 10
  ): Promise<PatternMatch> {
    const reference = this.network.getNode(referenceNodeId);
    if (!reference) {
      return {
        pattern: referenceNodeId as any,
        matches: [],
        confidence: 0,
        domain: 'general' as AsisDomain,
      };
    }

    const similar = this.network.findSimilar(referenceNodeId, maxResults);

    const avgConfidence = similar.length > 0
      ? similar.reduce((sum, m) => sum + m.score, 0) / similar.length
      : 0;

    return {
      pattern: reference,
      matches: similar,
      confidence: avgConfidence,
      domain: reference.domain,
    };
  }

  /**
   * Find patterns across domains (broader search)
   */
  async findCrossDomainPatterns(
    nodeType: NodeType,
    properties: Record<string, any>,
    maxResults: number = 10
  ): Promise<PatternMatch[]> {
    const candidates = this.network.query({
      nodeTypes: [nodeType],
      maxResults: 1000,
    }).nodes;

    const matches: PatternMatch[] = [];

    for (const candidate of candidates) {
      const propertyMatch = Object.entries(properties).every(
        ([key, value]) => candidate.properties[key] === value
      );

      if (propertyMatch) {
        const similar = this.network.findSimilar(candidate.id, 5);
        matches.push({
          pattern: candidate,
          matches: similar,
          confidence: similar.length > 0
            ? similar.reduce((sum, m) => sum + m.score, 0) / similar.length
            : 0.5,
          domain: candidate.domain,
        });
      }
    }

    return matches
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxResults);
  }

  // ═══════════════════════════════════════════════════════════════
  // PREDICTOR ENGINE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Predict the most likely outcomes given current network state
   * 
   * Uses Bayesian inference on the knowledge network:
   * P(outcome | evidence) ∝ P(evidence | outcome) × P(outcome)
   * 
   * Where:
   * - P(outcome) = prior probability from edge weights
   * - P(evidence | outcome) = likelihood from path strength
   */
  async predict(
    evidenceNodeIds: string[],
    outcomeType: NodeType,
    maxResults: number = 5
  ): Promise<Prediction[]> {
    const evidenceNodes = evidenceNodeIds
      .map(id => this.network.getNode(id))
      .filter(Boolean) as KnowledgeNode[];

    if (evidenceNodes.length === 0) return [];

    // Find all outcome nodes of the requested type
    const outcomes = this.network.query({
      nodeTypes: [outcomeType],
      maxResults: 1000,
    }).nodes;

    const predictions: Prediction[] = [];

    for (const outcome of outcomes) {
      // Calculate P(outcome) — prior from network position
      const prior = this.calculatePrior(outcome);

      // Calculate P(evidence | outcome) — likelihood from paths
      let likelihood = 1.0;
      const evidencePaths: NetworkPath[] = [];

      for (const evidence of evidenceNodes) {
        const paths = this.network.findPaths(evidence.id, outcome.id, 4);
        if (paths.length > 0) {
          const bestPath = paths[0];
          likelihood *= bestPath.score;
          evidencePaths.push(bestPath);
        } else {
          likelihood *= 0.1; // Penalty for no direct connection
        }
      }

      // Posterior probability (unnormalized)
      const posterior = prior * likelihood;

      predictions.push({
        outcome,
        probability: posterior,
        evidence: evidencePaths,
        confidence: Math.min(1.0, evidencePaths.length / evidenceNodes.length),
      });
    }

    // Normalize probabilities
    const totalProb = predictions.reduce((sum, p) => sum + p.probability, 0);
    if (totalProb > 0) {
      for (const pred of predictions) {
        pred.probability /= totalProb;
      }
    }

    return predictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, maxResults);
  }

  private calculatePrior(node: KnowledgeNode): number {
    // Prior probability based on:
    // 1. Node confidence
    // 2. Number of incoming connections (popularity)
    // 3. Domain-specific base rate

    const incomingEdges = this.network.query({ maxResults: 10000 }).edges.filter(
      edge => edge.to === node.id
    );

    const connectionBoost = Math.min(1.0, incomingEdges.length / 10);
    const baseRate = this.getDomainBaseRate(node.domain);

    return (node.confidence * 0.4 + connectionBoost * 0.4 + baseRate * 0.2);
  }

  private getDomainBaseRate(domain: AsisDomain): number {
    const baseRates: Record<string, number> = {
      wallet: 0.3,
      transport: 0.4,
      health: 0.2,
      jobs: 0.25,
      civic: 0.15,
      education: 0.2,
      marketplace: 0.35,
      general: 0.5,
      vehicle: 0.45,
      language: 0.6,
      code: 0.4,
      cad: 0.3,
    };
    return baseRates[domain] || 0.3;
  }

  // ═══════════════════════════════════════════════════════════════
  // CROSS-POLLINATOR
  // ═══════════════════════════════════════════════════════════════

  /**
   * Find insights from one domain that apply to another
   * 
   * Example: Wallet spending pattern → Transport route optimization
   * "You spend KES 500 daily on MTaxi to Westlands — 
   *  MTruck offers bulk delivery for your business at KES 300"
   */
  async crossPollinate(
    fromDomain: AsisDomain,
    toDomain: AsisDomain,
    userNodeId: string,
    maxResults: number = 5
  ): Promise<CrossPollination[]> {
    const userNode = this.network.getNode(userNodeId);
    if (!userNode) return [];

    const insights: CrossPollination[] = [];

    // Get all nodes in source domain connected to user
    const userNeighbors = this.network.getNeighbors(userNodeId);
    const fromDomainNodes = userNeighbors
      .filter(({ node }) => node.domain === fromDomain)
      .map(({ node }) => node);

    // For each source domain node, find paths to target domain
    for (const sourceNode of fromDomainNodes) {
      const targetNodes = this.network.query({
        domains: [toDomain],
        maxResults: 100,
      }).nodes;

      for (const targetNode of targetNodes) {
        const paths = this.network.findPaths(sourceNode.id, targetNode.id, 5);
        if (paths.length > 0) {
          const bestPath = paths[0];
          insights.push({
            fromDomain,
            toDomain,
            insight: `Connection found: ${sourceNode.label} → ${targetNode.label}`,
            confidence: bestPath.confidence,
            connectingNodes: bestPath.nodes,
          });
        }
      }
    }

    return insights
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxResults);
  }

  /**
   * Find all cross-domain insights for a user
   */
  async findAllCrossPollinations(
    userNodeId: string,
    minConfidence: number = 0.3
  ): Promise<CrossPollination[]> {
    const domains: AsisDomain[] = [
      'wallet', 'transport', 'health', 'jobs', 'civic',
      'education', 'marketplace', 'vehicle', 'language', 'code',
    ];

    const allInsights: CrossPollination[] = [];

    for (let i = 0; i < domains.length; i++) {
      for (let j = i + 1; j < domains.length; j++) {
        const insights = await this.crossPollinate(
          domains[i],
          domains[j],
          userNodeId,
          2
        );
        allInsights.push(...insights);
      }
    }

    return allInsights
      .filter(i => i.confidence >= minConfidence)
      .sort((a, b) => b.confidence - a.confidence);
  }

  // ═══════════════════════════════════════════════════════════════
  // RESPONSE GENERATOR
  // ═══════════════════════════════════════════════════════════════

  /**
   * Generate a natural language response from network traversal results
   * 
   * This is NOT an LLM. It is a template-based generator that:
   * 1. Takes query results, patterns, predictions, and cross-pollinations
   * 2. Formats them into coherent natural language
   * 3. Includes confidence scores and evidence paths
   */
  async generateResponse(
    request: AsisRequest,
    queryResult: QueryResult,
    patterns: PatternMatch[],
    predictions: Prediction[],
    crossPollinations: CrossPollination[]
  ): Promise<GeneratedResponse> {
    const parts: string[] = [];
    const actions: AsisAction[] = [];
    const insights: AsisInsight[] = [];

    // Build response from predictions
    if (predictions.length > 0) {
      const topPrediction = predictions[0];
      const confidence = Math.round(topPrediction.confidence * 100);

      parts.push(`Based on the MTAA knowledge network, I found the following:`);
      parts.push(`\n**${topPrediction.outcome.label}** (${confidence}% confidence)`);

      if (topPrediction.outcome.properties.description) {
        parts.push(`\n${topPrediction.outcome.properties.description}`);
      }

      // Add evidence
      if (predictions.length > 1) {
        parts.push(`\nOther possibilities:`);
        for (let i = 1; i < Math.min(3, predictions.length); i++) {
          const p = predictions[i];
          parts.push(`- ${p.outcome.label} (${Math.round(p.probability * 100)}%)`);
        }
      }

      // Create action
      if (topPrediction.outcome.properties.action) {
        actions.push({
          type: 'suggest',
          target: topPrediction.outcome.properties.action,
          description: topPrediction.outcome.properties.actionDescription || 'Recommended action',
          requiresConfirmation: true,
        });
      }
    }

    // Add pattern insights
    for (const pattern of patterns.slice(0, 2)) {
      if (pattern.matches.length > 0) {
        const topMatch = pattern.matches[0];
        insights.push({
          type: 'pattern',
          severity: 'info',
          title: `Similar to ${topMatch.node.label}`,
          description: `This matches a known pattern with ${Math.round(topMatch.score * 100)}% similarity.`,
          data: { matchedProperties: topMatch.matchedProperties },
        });
      }
    }

    // Add cross-pollination insights
    for (const pollination of crossPollinations.slice(0, 2)) {
      insights.push({
        type: 'opportunity',
        severity: 'low',
        title: `${pollination.fromDomain} → ${pollination.toDomain}`,
        description: pollination.insight,
        data: { confidence: pollination.confidence },
      });
    }

    // Build final message
    const message = parts.join('\n') || 
      "I'm analyzing your request through the MTAA knowledge network. Let me search for relevant information.";

    const confidence = predictions.length > 0
      ? predictions[0].confidence
      : (patterns.length > 0 ? patterns[0].confidence : 0.5);

    return {
      message,
      actions,
      insights,
      confidence,
      sources: queryResult.paths.slice(0, 3),
      growthEvent: this.createGrowthEvent(request, queryResult, predictions),
    };
  }

  private createGrowthEvent(
    request: AsisRequest,
    queryResult: QueryResult,
    predictions: Prediction[]
  ): GrowthEvent {
    return {
      id: `growth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityA: `user:${request.context.userId}`,
      entityB: `asis:query`,
      context: request.message.substring(0, 200),
      domain: request.domain as AsisDomain,
      factor: {
        base: 1.0,
        constitutional: 0.8,
        interaction: Math.min(1.0, queryResult.nodes.length / 10),
        observation: 1.2,
        computed: 0,
        immune: 1.0,
        final: 0,
      },
      spawned: predictions.map(p => ({
        type: 'insight',
        targetModule: p.outcome.domain,
        description: `Prediction: ${p.outcome.label}`,
        requiresConfirmation: false,
      })),
      timestamp: new Date().toISOString(),
      userId: request.context.userId,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN PROCESSING PIPELINE
  // ═══════════════════════════════════════════════════════════════

  /**
   * The main ASIS thinking pipeline
   * 
   * 1. Resolve query → find relevant network nodes
   * 2. Find patterns → identify similar past cases
   * 3. Predict outcomes → rank likely results
   * 4. Cross-pollinate → bring in other domains
   * 5. Generate response → format into natural language
   */
  async think(request: AsisRequest): Promise<GeneratedResponse> {
    const startTime = Date.now();

    // Step 1: Resolve query
    const queryResult = await this.resolveQuery(
      request.message,
      request.context
    );

    // Step 2: Find patterns for top nodes
    const patterns: PatternMatch[] = [];
    for (const node of queryResult.nodes.slice(0, 3)) {
      const pattern = await this.findPatterns(node.id);
      if (pattern.matches.length > 0) {
        patterns.push(pattern);
      }
    }

    // Step 3: Predict outcomes
    const nodeIds = queryResult.nodes.map(n => n.id);
    const predictions = await this.predict(
      nodeIds,
      'solution',
      5
    );

    // If no solutions found, try predicting problems
    const finalPredictions = predictions.length > 0
      ? predictions
      : await this.predict(nodeIds, 'outcome', 5);

    // Step 4: Cross-pollinate
    const crossPollinations = await this.findAllCrossPollinations(
      request.context.userId,
      0.3
    );

    // Step 5: Generate response
    const response = await this.generateResponse(
      request,
      queryResult,
      patterns,
      finalPredictions,
      crossPollinations
    );

    const processingTime = Date.now() - startTime;

    return {
      ...response,
      message: response.message + `\n\n_(Processed in ${processingTime}ms via M-Theory Knowledge Network)_`,
    };
  }
}

export default CognitiveEngine;
