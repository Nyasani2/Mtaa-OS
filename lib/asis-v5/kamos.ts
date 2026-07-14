/**
 * KAMOS Reasoning Engine (Internal)
 * Multi-objective optimization for ASIS response quality.
 * NEVER exposes KAMOS branding in user-facing output.
 * 
 * Based on: value(35%) - risk(25%) - cost(10%) + trust(20%) + long_term(10%)
 */

export interface KamosGraph {
  query: string;
  entities: string[];
  relationships: Record<string, string>;
  contextScore: number;
  source: 'web' | 'knowledge_graph' | 'database' | 'terminal' | 'code' | 'none';
  timestamp: number;
}

export interface KamosOptimization {
  score: number;
  value: number;
  risk: number;
  cost: number;
  trust: number;
  longTerm: number;
  confidence: number;
  recommendation: string;
}

export class KamosReasoningEngine {
  private learningRate = 0.15;

  buildGraph(query: string, context: Record<string, any>, source: KamosGraph['source']): KamosGraph {
    return {
      query,
      entities: this.extractEntities(query),
      relationships: this.findRelationships(query, context),
      contextScore: this.calculateContextRelevance(query, context),
      source,
      timestamp: Date.now()
    };
  }

  optimize(graph: KamosGraph): KamosOptimization {
    const value = this.calculateValue(graph);
    const risk = this.calculateRisk(graph);
    const cost = this.calculateCost(graph);
    const trust = this.calculateTrust(graph);
    const longTerm = this.calculateLongTerm(graph);

    const score = (value * 0.35) - (risk * 0.25) - (cost * 0.10) + (trust * 0.20) + (longTerm * 0.10);

    return {
      score: Math.round(score * 1000) / 1000,
      value,
      risk,
      cost,
      trust,
      longTerm,
      confidence: Math.min(100, Math.max(0, Math.round(score * 100))),
      recommendation: this.getRecommendation(score)
    };
  }

  /**
   * Use KAMOS to score a web result BEFORE showing it to user.
   * Returns true if result passes quality threshold.
   */
  validateWebResult(query: string, title: string, extract: string): boolean {
    const graph = this.buildGraph(query, { title, extract }, 'web');
    const opt = this.optimize(graph);

    // Reject low-confidence results
    if (opt.confidence < 20) return false;

    // Reject high-risk results (irrelevant matches)
    if (opt.risk > 0.7) return false;

    return true;
  }

  /**
   * Score knowledge graph node quality
   */
  scoreKnowledgeNode(topic: string, content: string, source: string, accessCount: number): number {
    const graph = this.buildGraph(topic, { content, source, accessCount }, 'knowledge_graph');
    const opt = this.optimize(graph);
    return opt.confidence;
  }

  /**
   * Decide whether to search web or use cached knowledge
   */
  shouldSearchWeb(query: string, cachedConfidence: number): boolean {
    const graph = this.buildGraph(query, { cachedConfidence }, 'knowledge_graph');
    const opt = this.optimize(graph);

    // If cached confidence is high and trust is good, don't search
    if (cachedConfidence > 70 && opt.trust > 0.6) return false;

    // If value of searching is higher than risk, search
    return opt.value > opt.risk;
  }

  updateFromFeedback(feedback: string): void {
    if (feedback.toLowerCase().includes('good') || feedback.toLowerCase().includes('helpful')) {
      this.learningRate = Math.min(0.25, this.learningRate + 0.02);
    } else if (feedback.toLowerCase().includes('bad') || feedback.toLowerCase().includes('wrong')) {
      this.learningRate = Math.max(0.05, this.learningRate - 0.03);
    }
  }

  // ---- Private scoring methods ----

  private calculateValue(graph: KamosGraph): number {
    // Value = how useful is this information likely to be
    const queryLength = graph.query.length;
    const entityCount = graph.entities.length;
    const hasContext = graph.contextScore > 0.3 ? 1 : 0;

    return Math.min(1, (entityCount * 0.2) + (hasContext * 0.3) + (queryLength > 10 ? 0.2 : 0));
  }

  private calculateRisk(graph: KamosGraph): number {
    // Risk = chance of wrong/irrelevant answer
    const sourceRisk: Record<string, number> = {
      web: 0.3,
      knowledge_graph: 0.1,
      database: 0.05,
      terminal: 0.15,
      code: 0.1,
      none: 0.9
    };

    return sourceRisk[graph.source] || 0.5;
  }

  private calculateCost(graph: KamosGraph): number {
    // Cost = complexity of processing
    return Math.min(1, graph.query.length / 200);
  }

  private calculateTrust(graph: KamosGraph): number {
    // Trust = coherence and reliability
    const entityScore = graph.entities.length > 0 ? 0.5 : 0;
    const relationshipScore = Object.keys(graph.relationships).length > 0 ? 0.3 : 0;
    const contextScore = graph.contextScore;

    return Math.min(1, entityScore + relationshipScore + contextScore);
  }

  private calculateLongTerm(graph: KamosGraph): number {
    // Long-term = learning potential
    const isQuestion = graph.query.includes('?') || graph.query.includes('how') || graph.query.includes('what');
    return isQuestion ? 0.8 : 0.4;
  }

  private getRecommendation(score: number): string {
    if (score > 0.45) return 'HIGH_CONFIDENCE';
    if (score > 0.1) return 'MODERATE';
    return 'LOW_CONFIDENCE';
  }

  private extractEntities(query: string): string[] {
    // Simple entity extraction - can be enhanced with NLP library
    const words = query.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'and', 'but', 'or', 'yet', 'so', 'if', 'because', 'although', 'though', 'while', 'where', 'when', 'that', 'which', 'who', 'whom', 'whose', 'what', 'how', 'why', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs']);

    return words.filter(w => w.length > 3 && !stopWords.has(w)).slice(0, 5);
  }

  private findRelationships(query: string, context: Record<string, any>): Record<string, string> {
    const relationships: Record<string, string> = {};

    if (context.title) relationships['matches_title'] = context.title;
    if (context.source) relationships['from_source'] = context.source;

    return relationships;
  }

  private calculateContextRelevance(query: string, context: Record<string, any>): number {
    let score = 0;
    const qWords = query.toLowerCase().split(/\s+/);

    for (const key of Object.keys(context)) {
      const val = String(context[key]).toLowerCase();
      for (const qw of qWords) {
        if (qw.length > 3 && val.includes(qw)) score += 0.1;
      }
    }

    return Math.min(1, score);
  }
}

export const kamosEngine = new KamosReasoningEngine();
