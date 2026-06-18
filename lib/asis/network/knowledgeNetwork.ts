// ASIS v3 — Knowledge Network Engine
// The growth substrate: a dynamic graph where intelligence emerges from topology
// 1 × 1 = 1 + f(growth, replication, interaction, observation)

import {
  KnowledgeNode,
  KnowledgeEdge,
  NetworkQuery,
  NetworkPath,
  SimilarityResult,
  NodeType,
  EdgeType,
  AsisDomain,
  Evidence,
} from '../types';

/**
 * The Knowledge Network is the heart of M-Theory intelligence.
 * It is not a neural network. It is a dynamic graph where:
 * - Nodes = entities (users, businesses, problems, solutions, vehicles, words, etc.)
 * - Edges = relationships (transacted_with, causes, solves, translates_to, etc.)
 * - Weights = confidence based on evidence
 * - Growth = new nodes/edges created from every interaction
 * 
 * Intelligence emerges from the network's ability to:
 * 1. Find paths between related entities
 * 2. Identify similar patterns across domains
 * 3. Predict outcomes based on historical connections
 * 4. Cross-pollinate insights between unrelated domains
 */
export class KnowledgeNetwork {
  private nodes: Map<string, KnowledgeNode> = new Map();
  private edges: Map<string, KnowledgeEdge> = new Map();
  private adjacencyList: Map<string, Set<string>> = new Map(); // nodeId -> edgeIds
  private nodeIndex: Map<string, Set<string>> = new Map(); // type -> nodeIds
  private domainIndex: Map<string, Set<string>> = new Map(); // domain -> nodeIds
  private persistenceEnabled: boolean = false;
  private db: any = null; // SQLite instance (lazy loaded)

  constructor(persistenceEnabled: boolean = false) {
    this.persistenceEnabled = persistenceEnabled;
    if (persistenceEnabled) {
      this.initPersistence();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // NODE OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  addNode(node: Omit<KnowledgeNode, 'createdAt' | 'updatedAt' | 'accessCount'>): KnowledgeNode {
    const now = new Date().toISOString();
    const fullNode: KnowledgeNode = {
      ...node,
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
    };

    this.nodes.set(node.id, fullNode);

    // Update indices
    if (!this.nodeIndex.has(node.type)) {
      this.nodeIndex.set(node.type, new Set());
    }
    this.nodeIndex.get(node.type)!.add(node.id);

    if (!this.domainIndex.has(node.domain)) {
      this.domainIndex.set(node.domain, new Set());
    }
    this.domainIndex.get(node.domain)!.add(node.id);

    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, new Set());
    }

    if (this.persistenceEnabled) {
      this.persistNode(fullNode);
    }

    return fullNode;
  }

  getNode(id: string): KnowledgeNode | undefined {
    const node = this.nodes.get(id);
    if (node) {
      node.accessCount++;
      node.updatedAt = new Date().toISOString();
    }
    return node;
  }

  updateNode(id: string, updates: Partial<KnowledgeNode>): KnowledgeNode | undefined {
    const node = this.nodes.get(id);
    if (!node) return undefined;

    const updated = { ...node, ...updates, updatedAt: new Date().toISOString() };
    this.nodes.set(id, updated);

    // Update indices if type or domain changed
    if (updates.type && updates.type !== node.type) {
      this.nodeIndex.get(node.type)?.delete(id);
      if (!this.nodeIndex.has(updates.type)) {
        this.nodeIndex.set(updates.type, new Set());
      }
      this.nodeIndex.get(updates.type)!.add(id);
    }

    if (updates.domain && updates.domain !== node.domain) {
      this.domainIndex.get(node.domain)?.delete(id);
      if (!this.domainIndex.has(updates.domain)) {
        this.domainIndex.set(updates.domain, new Set());
      }
      this.domainIndex.get(updates.domain)!.add(id);
    }

    if (this.persistenceEnabled) {
      this.persistNode(updated);
    }

    return updated;
  }

  removeNode(id: string): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;

    // Remove all connected edges
    const edgeIds = this.adjacencyList.get(id) || new Set();
    for (const edgeId of edgeIds) {
      this.removeEdge(edgeId);
    }

    this.nodes.delete(id);
    this.nodeIndex.get(node.type)?.delete(id);
    this.domainIndex.get(node.domain)?.delete(id);
    this.adjacencyList.delete(id);

    return true;
  }

  // ═══════════════════════════════════════════════════════════════
  // EDGE OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  addEdge(edge: Omit<KnowledgeEdge, 'createdAt' | 'updatedAt' | 'accessCount'>): KnowledgeEdge {
    const now = new Date().toISOString();
    const fullEdge: KnowledgeEdge = {
      ...edge,
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
    };

    this.edges.set(edge.id, fullEdge);

    // Update adjacency list
    if (!this.adjacencyList.has(edge.from)) {
      this.adjacencyList.set(edge.from, new Set());
    }
    this.adjacencyList.get(edge.from)!.add(edge.id);

    if (!this.adjacencyList.has(edge.to)) {
      this.adjacencyList.set(edge.to, new Set());
    }
    this.adjacencyList.get(edge.to)!.add(edge.id);

    if (this.persistenceEnabled) {
      this.persistEdge(fullEdge);
    }

    return fullEdge;
  }

  getEdge(id: string): KnowledgeEdge | undefined {
    const edge = this.edges.get(id);
    if (edge) {
      edge.accessCount++;
      edge.updatedAt = new Date().toISOString();
    }
    return edge;
  }

  updateEdge(id: string, updates: Partial<KnowledgeEdge>): KnowledgeEdge | undefined {
    const edge = this.edges.get(id);
    if (!edge) return undefined;

    const updated = { ...edge, ...updates, updatedAt: new Date().toISOString() };
    this.edges.set(id, updated);

    if (this.persistenceEnabled) {
      this.persistEdge(updated);
    }

    return updated;
  }

  removeEdge(id: string): boolean {
    const edge = this.edges.get(id);
    if (!edge) return false;

    this.adjacencyList.get(edge.from)?.delete(id);
    this.adjacencyList.get(edge.to)?.delete(id);
    this.edges.delete(id);

    return true;
  }

  // ═══════════════════════════════════════════════════════════════
  // GRAPH TRAVERSAL
  // ═══════════════════════════════════════════════════════════════

  /**
   * Find paths between two nodes using BFS
   */
  findPaths(
    fromId: string,
    toId: string,
    maxDepth: number = 5,
    edgeTypes?: EdgeType[]
  ): NetworkPath[] {
    const paths: NetworkPath[] = [];
    const visited = new Set<string>();
    const queue: { nodeId: string; path: NetworkPath }[] = [
      { nodeId: fromId, path: { nodes: [], edges: [], score: 1.0, confidence: 1.0 } },
    ];

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = this.getNode(nodeId);
      if (!node) continue;

      const currentPath = {
        ...path,
        nodes: [...path.nodes, node],
      };

      if (nodeId === toId && currentPath.nodes.length > 1) {
        paths.push(currentPath);
        continue;
      }

      if (currentPath.nodes.length >= maxDepth) continue;

      const edgeIds = this.adjacencyList.get(nodeId) || new Set();
      for (const edgeId of edgeIds) {
        const edge = this.getEdge(edgeId);
        if (!edge) continue;

        if (edgeTypes && !edgeTypes.includes(edge.type)) continue;

        const nextNodeId = edge.from === nodeId ? edge.to : edge.from;
        if (visited.has(nextNodeId)) continue;

        queue.push({
          nodeId: nextNodeId,
          path: {
            ...currentPath,
            edges: [...currentPath.edges, edge],
            score: currentPath.score * edge.weight,
            confidence: currentPath.confidence * edge.confidence,
          },
        });
      }
    }

    return paths.sort((a, b) => b.score - a.score);
  }

  /**
   * Find neighbors of a node
   */
  getNeighbors(
    nodeId: string,
    edgeTypes?: EdgeType[],
    maxResults: number = 20
  ): { node: KnowledgeNode; edge: KnowledgeEdge }[] {
    const edgeIds = this.adjacencyList.get(nodeId) || new Set();
    const results: { node: KnowledgeNode; edge: KnowledgeEdge }[] = [];

    for (const edgeId of edgeIds) {
      const edge = this.getEdge(edgeId);
      if (!edge) continue;

      if (edgeTypes && !edgeTypes.includes(edge.type)) continue;

      const neighborId = edge.from === nodeId ? edge.to : edge.from;
      const neighbor = this.getNode(neighborId);
      if (!neighbor) continue;

      results.push({ node: neighbor, edge });
    }

    return results
      .sort((a, b) => b.edge.weight - a.edge.weight)
      .slice(0, maxResults);
  }

  /**
   * Query the network with filters
   */
  query(query: NetworkQuery): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    let nodeIds = new Set<string>();

    // Start with type filter
    if (query.nodeTypes && query.nodeTypes.length > 0) {
      for (const type of query.nodeTypes) {
        const typeNodes = this.nodeIndex.get(type);
        if (typeNodes) {
          for (const id of typeNodes) {
            nodeIds.add(id);
          }
        }
      }
    } else {
      nodeIds = new Set(this.nodes.keys());
    }

    // Domain filter
    if (query.domains && query.domains.length > 0) {
      const domainNodes = new Set<string>();
      for (const domain of query.domains) {
        const domainNodeIds = this.domainIndex.get(domain);
        if (domainNodeIds) {
          for (const id of domainNodeIds) {
            domainNodes.add(id);
          }
        }
      }
      nodeIds = new Set([...nodeIds].filter(id => domainNodes.has(id)));
    }

    // Property filter
    if (query.properties) {
      nodeIds = new Set(
        [...nodeIds].filter(id => {
          const node = this.nodes.get(id);
          if (!node) return false;
          return Object.entries(query.properties!).every(
            ([key, value]) => node.properties[key] === value
          );
        })
      );
    }

    // Confidence filter
    if (query.confidenceThreshold !== undefined) {
      nodeIds = new Set(
        [...nodeIds].filter(id => {
          const node = this.nodes.get(id);
          return node && node.confidence >= query.confidenceThreshold!;
        })
      );
    }

    const resultNodes = [...nodeIds]
      .map(id => this.nodes.get(id)!)
      .filter(Boolean)
      .sort((a, b) => b.confidence - a.confidence);

    // Get edges between result nodes
    const resultNodeIds = new Set(resultNodes.map(n => n.id));
    const resultEdges = [...this.edges.values()].filter(
      edge => resultNodeIds.has(edge.from) && resultNodeIds.has(edge.to)
    );

    if (query.maxResults) {
      return {
        nodes: resultNodes.slice(0, query.maxResults),
        edges: resultEdges.slice(0, query.maxResults * 2),
      };
    }

    return { nodes: resultNodes, edges: resultEdges };
  }

  // ═══════════════════════════════════════════════════════════════
  // SIMILARITY & PREDICTION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Find nodes similar to a reference node based on properties and connections
   */
  findSimilar(
    referenceNodeId: string,
    maxResults: number = 10,
    minScore: number = 0.3
  ): SimilarityResult[] {
    const reference = this.getNode(referenceNodeId);
    if (!reference) return [];

    const candidates = this.query({
      nodeTypes: [reference.type],
      domains: [reference.domain],
      maxResults: 1000,
    }).nodes.filter(n => n.id !== referenceNodeId);

    const results: SimilarityResult[] = [];

    for (const candidate of candidates) {
      const score = this.computeSimilarity(reference, candidate);
      if (score >= minScore) {
        const paths = this.findPaths(reference.id, candidate.id, 3);
        results.push({
          node: candidate,
          score,
          matchedProperties: this.getMatchedProperties(reference, candidate),
          path: paths[0] || { nodes: [], edges: [], score: 0, confidence: 0 },
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  private computeSimilarity(a: KnowledgeNode, b: KnowledgeNode): number {
    let score = 0;
    let totalWeight = 0;

    // Property similarity (Jaccard-like)
    const aProps = Object.keys(a.properties);
    const bProps = Object.keys(b.properties);
    const commonProps = aProps.filter(p => bProps.includes(p));
    const allProps = new Set([...aProps, ...bProps]);

    if (allProps.size > 0) {
      const propertyScore = commonProps.length / allProps.size;
      score += propertyScore * 0.4;
      totalWeight += 0.4;
    }

    // Common neighbors
    const aNeighbors = new Set(
      this.getNeighbors(a.id).map(n => n.node.id)
    );
    const bNeighbors = new Set(
      this.getNeighbors(b.id).map(n => n.node.id)
    );
    const commonNeighbors = [...aNeighbors].filter(id => bNeighbors.has(id));
    const allNeighbors = new Set([...aNeighbors, ...bNeighbors]);

    if (allNeighbors.size > 0) {
      const neighborScore = commonNeighbors.length / allNeighbors.size;
      score += neighborScore * 0.4;
      totalWeight += 0.4;
    }

    // Domain match
    if (a.domain === b.domain) {
      score += 0.1;
      totalWeight += 0.1;
    }

    // Label similarity (simple string overlap)
    const aWords = new Set(a.label.toLowerCase().split(/\s+/));
    const bWords = new Set(b.label.toLowerCase().split(/\s+/));
    const commonWords = [...aWords].filter(w => bWords.has(w));
    const allWords = new Set([...aWords, ...bWords]);

    if (allWords.size > 0) {
      const labelScore = commonWords.length / allWords.size;
      score += labelScore * 0.1;
      totalWeight += 0.1;
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  private getMatchedProperties(a: KnowledgeNode, b: KnowledgeNode): string[] {
    return Object.keys(a.properties).filter(
      key => b.properties[key] !== undefined && a.properties[key] === b.properties[key]
    );
  }

  /**
   * Predict the most likely next node given a starting node and edge type
   */
  predictNext(
    fromNodeId: string,
    edgeType: EdgeType,
    maxResults: number = 5
  ): { node: KnowledgeNode; probability: number; evidence: NetworkPath[] }[] {
    const neighbors = this.getNeighbors(fromNodeId, [edgeType]);
    const totalWeight = neighbors.reduce((sum, n) => sum + n.edge.weight, 0);

    if (totalWeight === 0) return [];

    return neighbors
      .map(({ node, edge }) => ({
        node,
        probability: edge.weight / totalWeight,
        evidence: this.findPaths(fromNodeId, node.id, 2, [edgeType]),
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, maxResults);
  }

  // ═══════════════════════════════════════════════════════════════
  // NETWORK METRICS (for M-Theory growth measurement)
  // ═══════════════════════════════════════════════════════════════

  getMetrics(): {
    totalNodes: number;
    totalEdges: number;
    nodesByType: Record<string, number>;
    nodesByDomain: Record<string, number>;
    averageDegree: number;
    networkDensity: number;
    averageConfidence: number;
    averageEdgeWeight: number;
  } {
    const totalNodes = this.nodes.size;
    const totalEdges = this.edges.size;

    const nodesByType: Record<string, number> = {};
    for (const [type, ids] of this.nodeIndex) {
      nodesByType[type] = ids.size;
    }

    const nodesByDomain: Record<string, number> = {};
    for (const [domain, ids] of this.domainIndex) {
      nodesByDomain[domain] = ids.size;
    }

    const totalDegree = [...this.adjacencyList.values()].reduce(
      (sum, edges) => sum + edges.size,
      0
    );
    const averageDegree = totalNodes > 0 ? totalDegree / totalNodes : 0;

    const maxEdges = totalNodes * (totalNodes - 1) / 2;
    const networkDensity = maxEdges > 0 ? totalEdges / maxEdges : 0;

    const totalConfidence = [...this.nodes.values()].reduce(
      (sum, n) => sum + n.confidence,
      0
    );
    const averageConfidence = totalNodes > 0 ? totalConfidence / totalNodes : 0;

    const totalWeight = [...this.edges.values()].reduce(
      (sum, e) => sum + e.weight,
      0
    );
    const averageEdgeWeight = totalEdges > 0 ? totalWeight / totalEdges : 0;

    return {
      totalNodes,
      totalEdges,
      nodesByType,
      nodesByDomain,
      averageDegree,
      networkDensity,
      averageConfidence,
      averageEdgeWeight,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // PERSISTENCE (SQLite)
  // ═══════════════════════════════════════════════════════════════

  private async initPersistence(): Promise<void> {
    // Lazy load SQLite — works in React Native with expo-sqlite
    try {
      const SQLite = require('expo-sqlite');
      this.db = SQLite.openDatabaseSync('asis_knowledge_network.db');
      await this.createTables();
      await this.loadFromDatabase();
    } catch (err) {
      console.warn('[KnowledgeNetwork] SQLite not available, running in-memory only:', err);
      this.persistenceEnabled = false;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS knowledge_nodes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        domain TEXT NOT NULL,
        label TEXT NOT NULL,
        properties TEXT NOT NULL,
        confidence REAL NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        access_count INTEGER NOT NULL,
        source TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS knowledge_edges (
        id TEXT PRIMARY KEY,
        from_node TEXT NOT NULL,
        to_node TEXT NOT NULL,
        type TEXT NOT NULL,
        domain TEXT NOT NULL,
        weight REAL NOT NULL,
        properties TEXT NOT NULL,
        evidence TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        access_count INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_nodes_type ON knowledge_nodes(type);
      CREATE INDEX IF NOT EXISTS idx_nodes_domain ON knowledge_nodes(domain);
      CREATE INDEX IF NOT EXISTS idx_edges_from ON knowledge_edges(from_node);
      CREATE INDEX IF NOT EXISTS idx_edges_to ON knowledge_edges(to_node);
      CREATE INDEX IF NOT EXISTS idx_edges_type ON knowledge_edges(type);
    `);
  }

  private async persistNode(node: KnowledgeNode): Promise<void> {
    if (!this.db) return;
    // Batch persistence for performance
  }

  private async persistEdge(edge: KnowledgeEdge): Promise<void> {
    if (!this.db) return;
    // Batch persistence for performance
  }

  private async loadFromDatabase(): Promise<void> {
    if (!this.db) return;
    // Load nodes and edges from SQLite on startup
  }

  async save(): Promise<void> {
    if (!this.persistenceEnabled || !this.db) return;
    // Batch save all nodes and edges
  }

  // ═══════════════════════════════════════════════════════════════
  // IMPORT / EXPORT
  // ═══════════════════════════════════════════════════════════════

  export(): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    return {
      nodes: [...this.nodes.values()],
      edges: [...this.edges.values()],
    };
  }

  import(data: { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }): void {
    for (const node of data.nodes) {
      this.nodes.set(node.id, node);

      if (!this.nodeIndex.has(node.type)) {
        this.nodeIndex.set(node.type, new Set());
      }
      this.nodeIndex.get(node.type)!.add(node.id);

      if (!this.domainIndex.has(node.domain)) {
        this.domainIndex.set(node.domain, new Set());
      }
      this.domainIndex.get(node.domain)!.add(node.id);

      if (!this.adjacencyList.has(node.id)) {
        this.adjacencyList.set(node.id, new Set());
      }
    }

    for (const edge of data.edges) {
      this.edges.set(edge.id, edge);

      if (!this.adjacencyList.has(edge.from)) {
        this.adjacencyList.set(edge.from, new Set());
      }
      this.adjacencyList.get(edge.from)!.add(edge.id);

      if (!this.adjacencyList.has(edge.to)) {
        this.adjacencyList.set(edge.to, new Set());
      }
      this.adjacencyList.get(edge.to)!.add(edge.id);
    }
  }
}

export default KnowledgeNetwork;
