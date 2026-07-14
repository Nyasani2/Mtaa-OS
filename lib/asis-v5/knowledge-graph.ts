export interface KnowledgeNode {
  id: string;
  topic: string;
  content: string;
  source: string;
  confidence: number;
  timestamp: number;
  accessCount: number;
  verified: boolean;
}

export interface GraphStats {
  totalNodes: number;
  verifiedNodes: number;
  topics: string[];
  lastUpdated: number;
}

export class KnowledgeGraph {
  private nodes: Map<string, KnowledgeNode> = new Map();
  private readonly MAX_NODES = 1000;
  private readonly PRUNE_THRESHOLD = 100;

  addNode(topic: string, content: string, source: string, confidence: number): void {
    const id = this.generateId(topic);
    const existing = this.nodes.get(id);

    if (existing) {
      // Update if new confidence is higher
      if (confidence > existing.confidence) {
        this.nodes.set(id, {
          ...existing,
          content,
          source,
          confidence,
          timestamp: Date.now(),
          verified: confidence > 70
        });
      }
    } else {
      // Prune if at capacity
      if (this.nodes.size >= this.MAX_NODES) {
        this.pruneOldNodes();
      }

      this.nodes.set(id, {
        id,
        topic,
        content,
        source,
        confidence,
        timestamp: Date.now(),
        accessCount: 0,
        verified: confidence > 70
      });
    }
  }

  search(query: string): KnowledgeNode | null {
    const qWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let bestMatch: KnowledgeNode | null = null;
    let bestScore = 0;

    for (const node of this.nodes.values()) {
      const nodeWords = node.topic.toLowerCase().split(/\s+/);
      const contentWords = node.content.toLowerCase().split(/\s+/);

      let score = 0;
      for (const qw of qWords) {
        if (nodeWords.some(nw => nw.includes(qw) || qw.includes(nw))) score += 5;
        if (contentWords.some(cw => cw.includes(qw) || qw.includes(cw))) score += 2;
      }

      // Boost verified nodes
      if (node.verified) score *= 1.5;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = node;
      }
    }

    if (bestMatch) {
      bestMatch.accessCount++;
    }

    return bestMatch;
  }

  getNodesByTopic(topic: string): KnowledgeNode[] {
    return Array.from(this.nodes.values())
      .filter(n => n.topic.toLowerCase().includes(topic.toLowerCase()))
      .sort((a, b) => b.confidence - a.confidence);
  }

  getRecentLearnings(limit: number = 10): KnowledgeNode[] {
    return Array.from(this.nodes.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getVerifiedLearnings(): KnowledgeNode[] {
    return Array.from(this.nodes.values())
      .filter(n => n.verified)
      .sort((a, b) => b.confidence - a.confidence);
  }

  forget(topic: string): boolean {
    const id = this.generateId(topic);
    return this.nodes.delete(id);
  }

  getStats(): GraphStats {
    const nodes = Array.from(this.nodes.values());
    return {
      totalNodes: nodes.length,
      verifiedNodes: nodes.filter(n => n.verified).length,
      topics: [...new Set(nodes.map(n => n.topic.split(' ')[0]))].slice(0, 20),
      lastUpdated: nodes.length > 0 ? Math.max(...nodes.map(n => n.timestamp)) : Date.now()
    };
  }

  exportData(): string {
    return JSON.stringify(Array.from(this.nodes.values()), null, 2);
  }

  importData(json: string): void {
    try {
      const data = JSON.parse(json);
      for (const node of data) {
        this.nodes.set(node.id, node);
      }
    } catch (e) {
      console.error('Failed to import knowledge:', e);
    }
  }

  private generateId(topic: string): string {
    return topic.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 50);
  }

  private pruneOldNodes(): void {
    const sorted = Array.from(this.nodes.values())
      .sort((a, b) => {
        // Sort by: accessCount desc, then confidence desc, then timestamp desc
        if (a.accessCount !== b.accessCount) return a.accessCount - b.accessCount;
        if (a.confidence !== b.confidence) return a.confidence - b.confidence;
        return a.timestamp - b.timestamp;
      });

    // Remove oldest 10%
    const toRemove = Math.ceil(sorted.length * 0.1);
    for (let i = 0; i < toRemove && i < sorted.length; i++) {
      this.nodes.delete(sorted[i].id);
    }
  }
}

export const knowledgeGraph = new KnowledgeGraph();
