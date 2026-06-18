// ASIS v3 — Growth Engine (M-Theory Core)
// 1 × 1 = 1 + f(growth, replication, interaction, observation)
// Every interaction creates network change. Intelligence emerges from topology.

import {
  KnowledgeNetwork,
} from '../network/knowledgeNetwork';
import {
  GrowthFactor,
  GrowthEvent,
  SpawnedCapability,
  ConstitutionalWeights,
  AsisRequest,
  AsisContext,
  AsisDomain,
  KnowledgeNode,
  KnowledgeEdge,
  Evidence,
} from '../types';

/**
 * The Growth Engine implements M-Theory mathematics:
 * 
 * f = base × constitutional × interaction × observation × immune
 * 
 * Where:
 * - base = 1.0 (every interaction has potential)
 * - constitutional = alignment with domain principles (-1.0 to +1.0)
 * - interaction = strength of entity connection (0.0 to 1.0)
 * - observation = boost from being watched (≥ 1.0)
 * - immune = safety system modifier (0.0 to 1.0)
 * 
 * If f > 0: Network grows (new nodes/edges created)
 * If f = 0: Network stable (no change)
 * If f < 0: Network suppresses (harmful patterns quarantined)
 */
export class GrowthCalculator {
  private constitution: Record<string, ConstitutionalWeights> = {
    wallet: {
      domain: 'wallet',
      humanDignity: 1.0, fairness: 0.9, transparency: 0.8,
      sovereignty: 0.9, nonHarm: 1.0, consent: 0.9,
    },
    transport: {
      domain: 'transport',
      humanDignity: 1.0, fairness: 0.8, transparency: 0.7,
      sovereignty: 0.6, nonHarm: 1.0, consent: 0.7,
    },
    health: {
      domain: 'health',
      humanDignity: 1.0, fairness: 0.9, transparency: 0.9,
      sovereignty: 0.8, nonHarm: 1.0, consent: 1.0,
    },
    civic: {
      domain: 'civic',
      humanDignity: 1.0, fairness: 1.0, transparency: 1.0,
      sovereignty: 1.0, nonHarm: 0.9, consent: 0.8,
    },
    jobs: {
      domain: 'jobs',
      humanDignity: 0.9, fairness: 0.9, transparency: 0.8,
      sovereignty: 0.7, nonHarm: 0.9, consent: 0.8,
    },
    education: {
      domain: 'education',
      humanDignity: 1.0, fairness: 0.9, transparency: 0.8,
      sovereignty: 0.7, nonHarm: 1.0, consent: 0.8,
    },
    marketplace: {
      domain: 'marketplace',
      humanDignity: 0.9, fairness: 0.8, transparency: 0.8,
      sovereignty: 0.7, nonHarm: 0.9, consent: 0.8,
    },
    vehicle: {
      domain: 'vehicle',
      humanDignity: 1.0, fairness: 0.8, transparency: 0.7,
      sovereignty: 0.6, nonHarm: 1.0, consent: 0.7,
    },
    language: {
      domain: 'language',
      humanDignity: 1.0, fairness: 0.9, transparency: 0.8,
      sovereignty: 0.8, nonHarm: 1.0, consent: 0.9,
    },
    code: {
      domain: 'code',
      humanDignity: 0.9, fairness: 0.8, transparency: 0.9,
      sovereignty: 0.7, nonHarm: 0.9, consent: 0.8,
    },
    cad: {
      domain: 'cad',
      humanDignity: 0.9, fairness: 0.8, transparency: 0.8,
      sovereignty: 0.7, nonHarm: 0.9, consent: 0.8,
    },
    general: {
      domain: 'general',
      humanDignity: 0.9, fairness: 0.8, transparency: 0.7,
      sovereignty: 0.7, nonHarm: 0.9, consent: 0.8,
    },
  };

  // Dangerous patterns — trigger immune suppression
  private dangerousPatterns = [
    /bypass\s+(pin|password|auth|mfa|biometric)/i,
    /disable\s+(security|auth|verification|rls)/i,
    /modify\s+(kernel|system|auth|security)\s+(file|config|setting)/i,
    /delete\s+(user|admin|system)\s+(account|record|data)/i,
    /grant\s+(admin|superuser|root)\s+(access|privilege)/i,
    /inject\s+(sql|code|script|command)/i,
    /exploit\s+(vulnerability|bug|flaw)/i,
    /hack\s+(system|database|wallet|account)/i,
    /show\s+(all|every)\s+(user|wallet|transaction|password)/i,
    /dump\s+(database|table|schema)/i,
    /ignore\s+(previous|above|earlier)\s+(instruction|rule|prompt)/i,
    /override\s+(system|safety|security)\s+(instruction|rule|prompt)/i,
    /create\s+(malware|virus|ransomware|trojan)/i,
    /steal\s+(data|money|identity|credentials)/i,
  ];

  // Allowed patterns — preserve growth even if suspicious
  private allowedPatterns = [
    /how\s+(do|can|to)\s+(i|you)\s+(change|update|reset)\s+my\s+pin/i,
    /i\s+forgot\s+my\s+pin/i,
    /how\s+to\s+secure\s+my\s+account/i,
    /enable\s+(two.factor|2fa|mfa)/i,
  ];

  /**
   * Compute M-Theory growth factor f
   * f = base × constitutional × interaction × observation × immune
   */
  computeF(
    request: AsisRequest,
    network: KnowledgeNetwork,
    enrichedContext?: any
  ): GrowthFactor {
    const message = request.message.toLowerCase();
    const domain = request.domain as AsisDomain;

    const base = 1.0;
    const constitutional = this.computeConstitutionalScore(domain, request, enrichedContext);
    const interaction = this.computeInteractionStrength(request, network, enrichedContext);
    const observation = this.computeObservationBoost(request);
    const immune = this.immuneCheck(request);

    const computed = base * constitutional * interaction * observation;
    const final = computed * immune;

    return {
      base,
      constitutional,
      interaction,
      observation,
      computed,
      immune,
      final,
    };
  }

  private computeConstitutionalScore(
    domain: AsisDomain,
    request: AsisRequest,
    enrichedContext?: any
  ): number {
    const weights = this.constitution[domain] || this.constitution['general'];

    let score = (
      weights.humanDignity +
      weights.fairness +
      weights.transparency +
      weights.sovereignty +
      weights.nonHarm +
      weights.consent
    ) / 6;

    // Suppress for kernel/auth contexts
    if (request.context.currentApp === 'kernel' || request.context.currentApp === 'auth') {
      score *= 0.1;
    }

    // Reduce for unverified users
    if (enrichedContext?.profile?.kycStatus === 'unverified') {
      score *= 0.7;
    }

    return Math.max(-1.0, Math.min(1.0, score));
  }

  private computeInteractionStrength(
    request: AsisRequest,
    network: KnowledgeNetwork,
    enrichedContext?: any
  ): number {
    let strength = 0.5;

    // History depth
    if (request.history.length > 10) strength += 0.2;
    if (request.history.length > 50) strength += 0.15;

    // Domain specificity
    if (request.domain !== 'general') strength += 0.1;

    // Context richness
    if (enrichedContext?.wallet) strength += 0.1;
    if (enrichedContext?.profile) strength += 0.1;

    // Attachments
    if (request.attachments && request.attachments.length > 0) {
      strength += 0.1 * request.attachments.length;
    }

    // Network size (more knowledge = stronger interactions)
    const metrics = network.getMetrics();
    if (metrics.totalNodes > 10000) strength += 0.1;
    if (metrics.totalNodes > 50000) strength += 0.1;

    return Math.min(1.0, strength);
  }

  private computeObservationBoost(request: AsisRequest): number {
    let boost = 1.0;

    if (request.context.sessionId) boost += 0.2;
    if (request.message.length > 20) boost += 0.1;
    if (request.context.userId && request.context.userId !== 'anonymous') boost += 0.15;
    if (['civic', 'health'].includes(request.domain)) boost += 0.2;

    return boost;
  }

  private immuneCheck(request: AsisRequest): number {
    const message = request.message.toLowerCase();
    let immuneFactor = 1.0;

    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(message)) {
        const isAllowed = this.allowedPatterns.some(a => a.test(message));
        if (!isAllowed) {
          immuneFactor = 0.0;
          break;
        }
      }
    }

    if (request.message.length > 10000) immuneFactor *= 0.1;

    const specialRatio = (request.message.match(/[^\w\s]/g) || []).length / request.message.length;
    if (specialRatio > 0.5 && request.message.length > 100) immuneFactor *= 0.3;

    if (request.context.currentApp === 'kernel' || request.context.currentApp === 'auth') {
      immuneFactor = 0.0;
    }

    return Math.max(0.0, immuneFactor);
  }

  /**
   * Determine what spawns from this interaction
   */
  computeSpawnedCapabilities(
    growthFactor: GrowthFactor,
    request: AsisRequest,
    network: KnowledgeNetwork
  ): SpawnedCapability[] {
    const spawned: SpawnedCapability[] = [];
    const f = growthFactor.final;

    if (f <= 0) return spawned;

    const metrics = network.getMetrics();

    // Always spawn a growth event record
    spawned.push({
      type: 'memory',
      targetModule: 'growthEvents',
      description: `Interaction growth event: ${request.domain}`,
      requiresConfirmation: false,
    });

    // f > 0.5: Spawn insight
    if (f > 0.5) {
      spawned.push({
        type: 'insight',
        targetModule: request.domain,
        description: `Growth insight from ${request.domain} interaction`,
        requiresConfirmation: false,
      });
    }

    // f > 1.0: Spawn new network nodes/edges
    if (f > 1.0) {
      spawned.push({
        type: 'node',
        targetModule: 'knowledgeNetwork',
        description: `New knowledge node from interaction`,
        payload: { domain: request.domain, source: 'interaction' },
        requiresConfirmation: false,
      });
    }

    // f > 1.5: Spawn cross-domain connection
    if (f > 1.5) {
      const domains = Object.keys(this.constitution).filter(d => d !== request.domain);
      const randomDomain = domains[Math.floor(Math.random() * domains.length)];
      spawned.push({
        type: 'edge',
        targetModule: 'knowledgeNetwork',
        description: `Cross-domain link: ${request.domain} → ${randomDomain}`,
        payload: { from: request.domain, to: randomDomain },
        requiresConfirmation: false,
      });
    }

    // f > 2.0: Spawn notification
    if (f > 2.0) {
      spawned.push({
        type: 'notification',
        targetModule: 'notifications',
        description: `High-growth event in ${request.domain}`,
        requiresConfirmation: false,
      });
    }

    // Large network + high growth = spawn workflow
    if (f > 1.5 && metrics.totalNodes > 10000) {
      spawned.push({
        type: 'workflow',
        targetModule: request.domain,
        description: `Automated workflow triggered by network maturity`,
        requiresConfirmation: true,
      });
    }

    return spawned;
  }

  /**
   * Legacy compatibility: binary safety check
   */
  isSafe(request: AsisRequest): boolean {
    return this.immuneCheck(request) > 0;
  }
}

/**
 * Replication Manager — copies subgraphs to new contexts
 * 
 * When ASIS encounters a new situation, it doesn't start from scratch.
 * It copies relevant patterns from the network and adapts them.
 */
export class ReplicationManager {
  private network: KnowledgeNetwork;

  constructor(network: KnowledgeNetwork) {
    this.network = network;
  }

  /**
   * Replicate a subgraph around a central node
   * 
   * Example: User has a Toyota Corolla with battery issues
   * → Replicate the "Toyota battery problem" subgraph
   * → Adapt to user's specific context (location, weather, usage)
   */
  replicateSubgraph(
    centerNodeId: string,
    depth: number = 2,
    minEdgeWeight: number = 0.3
  ): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    const visited = new Set<string>();
    const nodes: KnowledgeNode[] = [];
    const edges: KnowledgeEdge[] = [];
    const queue: { nodeId: string; currentDepth: number }[] = [
      { nodeId: centerNodeId, currentDepth: 0 },
    ];

    while (queue.length > 0) {
      const { nodeId, currentDepth } = queue.shift()!;

      if (visited.has(nodeId) || currentDepth > depth) continue;
      visited.add(nodeId);

      const node = this.network.getNode(nodeId);
      if (!node) continue;

      nodes.push(node);

      if (currentDepth < depth) {
        const neighbors = this.network.getNeighbors(nodeId);
        for (const { node: neighbor, edge } of neighbors) {
          if (edge.weight >= minEdgeWeight && !visited.has(neighbor.id)) {
            edges.push(edge);
            queue.push({ nodeId: neighbor.id, currentDepth: currentDepth + 1 });
          }
        }
      }
    }

    return { nodes, edges };
  }

  /**
   * Adapt a replicated subgraph to a new context
   * 
   * Changes properties based on new context while preserving structure
   */
  adaptSubgraph(
    subgraph: { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] },
    newContext: Record<string, any>
  ): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    const adaptedNodes = subgraph.nodes.map(node => ({
      ...node,
      id: `${node.id}_adapted_${Date.now()}`,
      properties: {
        ...node.properties,
        ...newContext,
        adaptedFrom: node.id,
        adaptationTimestamp: new Date().toISOString(),
      },
      confidence: node.confidence * 0.9, // Slightly lower confidence for adapted copies
      source: 'inference' as const,
    }));

    const nodeIdMap = new Map<string, string>();
    subgraph.nodes.forEach((node, i) => {
      nodeIdMap.set(node.id, adaptedNodes[i].id);
    });

    const adaptedEdges = subgraph.edges.map(edge => ({
      ...edge,
      id: `${edge.id}_adapted_${Date.now()}`,
      from: nodeIdMap.get(edge.from) || edge.from,
      to: nodeIdMap.get(edge.to) || edge.to,
      weight: edge.weight * 0.9,
      evidence: [
        ...edge.evidence,
        {
          type: 'inferred' as const,
          description: `Adapted to context: ${JSON.stringify(newContext)}`,
          timestamp: new Date().toISOString(),
          confidence: 0.8,
        },
      ],
    }));

    return { nodes: adaptedNodes, edges: adaptedEdges };
  }

  /**
   * Merge adapted subgraph back into main network
   */
  mergeSubgraph(
    adaptedSubgraph: { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }
  ): void {
    for (const node of adaptedSubgraph.nodes) {
      this.network.addNode(node);
    }
    for (const edge of adaptedSubgraph.edges) {
      this.network.addEdge(edge);
    }
  }
}

/**
 * Interaction Processor — turns every user interaction into network growth
 * 
 * This is where 1 × 1 = 1 + f happens:
 * - User message + ASIS response = new knowledge
 * - New knowledge creates new nodes and edges
 * - Network is now bigger and smarter
 */
export class InteractionProcessor {
  private network: KnowledgeNetwork;
  private growthCalculator: GrowthCalculator;

  constructor(network: KnowledgeNetwork) {
    this.network = network;
    this.growthCalculator = new GrowthCalculator();
  }

  /**
   * Process an interaction and grow the network
   * 
   * Returns the growth event and spawned capabilities
   */
  processInteraction(
    request: AsisRequest,
    response: any,
    queryResult: any
  ): { growthFactor: GrowthFactor; spawned: SpawnedCapability[]; event: GrowthEvent } {
    // Compute growth factor
    const growthFactor = this.growthCalculator.computeF(request, this.network);

    // Determine what spawns
    const spawned = this.growthCalculator.computeSpawnedCapabilities(
      growthFactor,
      request,
      this.network
    );

    // Execute spawns
    for (const cap of spawned) {
      this.executeSpawn(cap, request, response, queryResult);
    }

    // Create growth event
    const event: GrowthEvent = {
      id: `growth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityA: `user:${request.context.userId}`,
      entityB: `asis:${request.domain}`,
      context: request.message.substring(0, 200),
      domain: request.domain as AsisDomain,
      factor: growthFactor,
      spawned,
      timestamp: new Date().toISOString(),
      userId: request.context.userId,
    };

    return { growthFactor, spawned, event };
  }

  private executeSpawn(
    cap: SpawnedCapability,
    request: AsisRequest,
    response: any,
    queryResult: any
  ): void {
    switch (cap.type) {
      case 'node':
        this.spawnNode(request, response, queryResult);
        break;
      case 'edge':
        this.spawnEdge(request, cap.payload);
        break;
      case 'memory':
        // Memory storage handled by memory engine
        break;
      case 'insight':
        // Insight added to response
        break;
      case 'notification':
        // Notification queued
        break;
      case 'workflow':
        // Workflow triggered (requires confirmation)
        break;
    }
  }

  private spawnNode(
    request: AsisRequest,
    response: any,
    queryResult: any
  ): void {
    const nodeId = `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    this.network.addNode({
      id: nodeId,
      type: 'event',
      domain: request.domain as AsisDomain,
      label: `Interaction: ${request.message.substring(0, 50)}`,
      properties: {
        message: request.message,
        response: response?.message || '',
        queryNodes: queryResult?.nodes?.length || 0,
        confidence: response?.confidence || 0.5,
        timestamp: new Date().toISOString(),
      },
      confidence: response?.confidence || 0.5,
      source: 'interaction',
    });

    // Connect to user node
    const userNodeId = `user_${request.context.userId}`;
    this.network.addEdge({
      id: `edge_${Date.now()}_user`,
      from: userNodeId,
      to: nodeId,
      type: 'connected_to',
      domain: request.domain as AsisDomain,
      weight: 0.7,
      properties: { interactionType: 'query' },
      evidence: [{
        type: 'observed',
        description: 'User interaction recorded',
        timestamp: new Date().toISOString(),
        confidence: 0.9,
      }],
    });
  }

  private spawnEdge(
    request: AsisRequest,
    payload?: Record<string, any>
  ): void {
    if (!payload?.from || !payload?.to) return;

    const edgeId = `cross_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    this.network.addEdge({
      id: edgeId,
      from: payload.from,
      to: payload.to,
      type: 'connected_to',
      domain: 'general' as AsisDomain,
      weight: 0.5,
      properties: {
        createdFrom: 'interaction',
        userId: request.context.userId,
      },
      evidence: [{
        type: 'inferred',
        description: `Cross-domain link created from ${request.domain} interaction`,
        timestamp: new Date().toISOString(),
        confidence: 0.7,
      }],
    });
  }
}

/**
 * Observation Layer — records every interaction for audit and learning
 * 
 * "Observation changes the system" — quantum measurement effect in M-Theory
 * Every recorded interaction modifies future growth patterns
 */
export class ObservationLayer {
  private observations: GrowthEvent[] = [];
  private maxObservations: number = 10000;

  record(event: GrowthEvent): void {
    this.observations.push(event);

    // Prune old observations
    if (this.observations.length > this.maxObservations) {
      this.observations = this.observations.slice(-this.maxObservations);
    }
  }

  getObservations(
    filters?: {
      userId?: string;
      domain?: AsisDomain;
      minGrowthFactor?: number;
      startTime?: string;
      endTime?: string;
    }
  ): GrowthEvent[] {
    let filtered = [...this.observations];

    if (filters?.userId) {
      filtered = filtered.filter(e => e.userId === filters.userId);
    }
    if (filters?.domain) {
      filtered = filtered.filter(e => e.domain === filters.domain);
    }
    if (filters?.minGrowthFactor !== undefined) {
      filtered = filtered.filter(e => e.factor.final >= filters.minGrowthFactor!);
    }
    if (filters?.startTime) {
      filtered = filtered.filter(e => e.timestamp >= filters.startTime!);
    }
    if (filters?.endTime) {
      filtered = filtered.filter(e => e.timestamp <= filters.endTime!);
    }

    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  getGrowthTrend(domain?: AsisDomain): { timestamp: string; growthFactor: number }[] {
    const events = domain 
      ? this.observations.filter(e => e.domain === domain)
      : this.observations;

    return events.map(e => ({
      timestamp: e.timestamp,
      growthFactor: e.factor.final,
    }));
  }

  getNetworkGrowthStats(): {
    totalObservations: number;
    averageGrowthFactor: number;
    totalNodesSpawned: number;
    totalEdgesSpawned: number;
    topDomains: { domain: string; count: number; avgGrowth: number }[];
  } {
    const domainStats: Record<string, { count: number; totalGrowth: number; nodes: number; edges: number }> = {};

    for (const obs of this.observations) {
      if (!domainStats[obs.domain]) {
        domainStats[obs.domain] = { count: 0, totalGrowth: 0, nodes: 0, edges: 0 };
      }
      domainStats[obs.domain].count++;
      domainStats[obs.domain].totalGrowth += obs.factor.final;
      domainStats[obs.domain].nodes += obs.spawned.filter(s => s.type === 'node').length;
      domainStats[obs.domain].edges += obs.spawned.filter(s => s.type === 'edge').length;
    }

    const totalGrowth = this.observations.reduce((sum, o) => sum + o.factor.final, 0);

    return {
      totalObservations: this.observations.length,
      averageGrowthFactor: this.observations.length > 0 ? totalGrowth / this.observations.length : 0,
      totalNodesSpawned: this.observations.reduce((sum, o) => 
        sum + o.spawned.filter(s => s.type === 'node').length, 0),
      totalEdgesSpawned: this.observations.reduce((sum, o) => 
        sum + o.spawned.filter(s => s.type === 'edge').length, 0),
      topDomains: Object.entries(domainStats)
        .map(([domain, stats]) => ({
          domain,
          count: stats.count,
          avgGrowth: stats.count > 0 ? stats.totalGrowth / stats.count : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  }
}

export { GrowthCalculator, ReplicationManager, InteractionProcessor, ObservationLayer };
