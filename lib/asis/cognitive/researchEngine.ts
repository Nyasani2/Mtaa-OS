// ASIS v3 — Research Engine
// M-Theory governs: how deep to research, when to stop, what to cross-pollinate
// ASIS goes online, learns, then produces answers

import {
  GrowthCalculator,
} from '../core/growthEngine';
import {
  KnowledgeNetwork,
} from '../network/knowledgeNetwork';
import {
  AsisRequest,
  AsisContext,
  AsisDomain,
} from '../types';

interface ResearchResult {
  query: string;
  sources: ResearchSource[];
  summary: string;
  facts: Fact[];
  confidence: number;
  depth: number;
  timeSpent: number;
}

interface ResearchSource {
  url: string;
  title: string;
  snippet: string;
  relevance: number;
  accessedAt: string;
}

interface Fact {
  statement: string;
  source: string;
  confidence: number;
  verified: boolean;
  contradictions: string[];
}

/**
 * Research Engine: ASIS goes online to learn
 * 
 * M-Theory controls:
 * - f(growth) -> How many sources to fetch
 * - f(replication) -> Whether to search related topics
 * - f(interaction) -> How to combine sources
 * - f(observation) -> Whether to fact-check
 */
export class ResearchEngine {
  private network: KnowledgeNetwork;
  private growthCalculator: GrowthCalculator;
  private searchCache: Map<string, ResearchResult> = new Map();

  constructor(network: KnowledgeNetwork) {
    this.network = network;
    this.growthCalculator = new GrowthCalculator();
  }

  /**
   * Main research pipeline
   * 
   * 1. Compute M-Theory f() -> determines research depth
   * 2. Search web -> fetch sources
   * 3. Extract facts -> parse content
   * 4. Verify facts -> cross-reference
   * 5. Summarize -> build coherent picture
   * 6. Store in knowledge network -> ASIS learns
   */
  async research(
    query: string,
    context: AsisContext,
    options: {
      maxDepth?: number;
      maxSources?: number;
      verifyFacts?: boolean;
      crossPollinate?: boolean;
    } = {}
  ): Promise<ResearchResult> {
    const startTime = Date.now();

    if (this.searchCache.has(query)) {
      return this.searchCache.get(query)!;
    }

    const mockRequest: AsisRequest = {
      message: query,
      context,
      domain: 'general',
      history: [],
    };
    const growthFactor = this.growthCalculator.computeF(mockRequest, this.network);

    const depth = this.computeResearchDepth(growthFactor, options.maxDepth);
    const maxSources = options.maxSources || Math.min(20, Math.floor(5 + growthFactor.final * 10));

    const sources = await this.searchWeb(query, maxSources);
    let facts = await this.extractFacts(sources, query);

    if (options.verifyFacts !== false && growthFactor.final > 0.5) {
      facts = await this.verifyFacts(facts);
    }

    if (options.crossPollinate !== false && growthFactor.final > 1.5) {
      const relatedQueries = this.generateRelatedQueries(query, facts);
      for (const relatedQuery of relatedQueries.slice(0, 3)) {
        const related = await this.searchWeb(relatedQuery, 5);
        const relatedFacts = await this.extractFacts(related, relatedQuery);
        facts = [...facts, ...relatedFacts];
      }
    }

    const summary = this.summarizeFacts(facts, query);
    await this.storeResearch(query, sources, facts, summary);

    const result: ResearchResult = {
      query,
      sources,
      summary,
      facts,
      confidence: this.computeOverallConfidence(facts),
      depth,
      timeSpent: Date.now() - startTime,
    };

    this.searchCache.set(query, result);
    return result;
  }

  private computeResearchDepth(growthFactor: any, maxDepth?: number): number {
    const baseDepth = growthFactor.final;
    let depth = 1;
    if (baseDepth > 0.3) depth = 2;
    if (baseDepth > 0.6) depth = 3;
    if (baseDepth > 1.0) depth = 4;
    if (baseDepth > 1.5) depth = 5;
    return maxDepth ? Math.min(depth, maxDepth) : depth;
  }

  private async searchWeb(query: string, maxResults: number): Promise<ResearchSource[]> {
    const sources: ResearchSource[] = [];

    try {
      const response = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (!response.ok) {
        return this.searchLocalNetwork(query, maxResults);
      }

      const html = await response.text();
      const results = this.parseDuckDuckGoResults(html);

      for (let i = 0; i < Math.min(maxResults, results.length); i++) {
        sources.push({
          url: results[i].url,
          title: results[i].title,
          snippet: results[i].snippet,
          relevance: 1.0 - (i * 0.1),
          accessedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      return this.searchLocalNetwork(query, maxResults);
    }

    return sources;
  }

  private parseDuckDuckGoResults(html: string): Array<{ url: string; title: string; snippet: string }> {
    const results: Array<{ url: string; title: string; snippet: string }> = [];
    const resultRegex = /<a rel="nofollow" class="result__a" href="([^"]+)">(.*?)<\/a>.*?<a class="result__snippet"[^>]*>(.*?)<\/a>/gs;
    let match;

    while ((match = resultRegex.exec(html)) !== null && results.length < 20) {
      results.push({
        url: this.decodeHTMLEntities(match[1]),
        title: this.stripHtml(match[2]),
        snippet: this.stripHtml(match[3]),
      });
    }

    return results;
  }

  private decodeHTMLEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
      '&nbsp;': ' ', '&mdash;': '-', '&ndash;': '-',
    };
    return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private searchLocalNetwork(query: string, maxResults: number): ResearchSource[] {
    const nodes = this.network.query({ maxResults: maxResults * 2 }).nodes;
    const queryWords = query.toLowerCase().split(/\s+/);

    const scored = nodes.map(node => {
      const nodeText = `${node.label} ${JSON.stringify(node.properties)}`.toLowerCase();
      const matches = queryWords.filter(word => nodeText.includes(word)).length;
      return { node, score: matches / queryWords.length };
    }).filter(s => s.score > 0.3).sort((a, b) => b.score - a.score);

    return scored.slice(0, maxResults).map(({ node, score }) => ({
      url: `mtaa://knowledge/${node.id}`,
      title: node.label,
      snippet: JSON.stringify(node.properties).substring(0, 200),
      relevance: score,
      accessedAt: new Date().toISOString(),
    }));
  }

  private async extractFacts(sources: ResearchSource[], query: string): Promise<Fact[]> {
    const facts: Fact[] = [];
    const queryWords = query.toLowerCase().split(/\s+/);

    for (const source of sources) {
      const sentences = source.snippet.split(/[.!?]+/);

      for (const sentence of sentences) {
        const sentenceLower = sentence.toLowerCase();
        const hasKeywords = queryWords.some(word => sentenceLower.includes(word));

        if (hasKeywords && sentence.length > 20) {
          facts.push({
            statement: sentence.trim(),
            source: source.url,
            confidence: source.relevance * 0.8,
            verified: false,
            contradictions: [],
          });
        }
      }
    }

    return this.deduplicateFacts(facts);
  }

  private deduplicateFacts(facts: Fact[]): Fact[] {
    const unique: Fact[] = [];

    for (const fact of facts) {
      const isDuplicate = unique.some(u => 
        this.textSimilarity(fact.statement, u.statement) > 0.8
      );
      if (!isDuplicate) {
        unique.push(fact);
      }
    }

    return unique;
  }

  private textSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = [...wordsA].filter(w => wordsB.has(w));
    return intersection.length / Math.max(wordsA.size, wordsB.size);
  }

  private async verifyFacts(facts: Fact[]): Promise<Fact[]> {
    const verified: Fact[] = [];

    for (const fact of facts) {
      const existing = this.network.query({ maxResults: 10 }).nodes.filter(node => 
        this.textSimilarity(fact.statement, node.label) > 0.7
      );

      if (existing.length > 0) {
        fact.verified = true;
        fact.confidence = Math.min(1.0, fact.confidence + 0.2);
      } else {
        const contradictions = this.findContradictions(fact);
        fact.contradictions = contradictions;

        if (contradictions.length > 0) {
          fact.confidence *= 0.5;
        }
      }

      verified.push(fact);
    }

    return verified;
  }

  private findContradictions(fact: Fact): string[] {
    const contradictions: string[] = [];
    const allNodes = this.network.query({ maxResults: 1000 }).nodes;

    for (const node of allNodes) {
      const nodeText = `${node.label} ${JSON.stringify(node.properties)}`.toLowerCase();
      const factText = fact.statement.toLowerCase();

      const negations = ['not', 'never', 'false', 'incorrect', 'wrong', 'myth'];
      const hasNegation = negations.some(n => nodeText.includes(n) && factText.includes(n.replace('not ', '')));

      if (hasNegation && this.textSimilarity(fact.statement, node.label) > 0.6) {
        contradictions.push(node.label);
      }
    }

    return contradictions;
  }

  private summarizeFacts(facts: Fact[], query: string): string {
    const sorted = facts.sort((a, b) => b.confidence - a.confidence);
    const topFacts = sorted.slice(0, 10);

    const parts: string[] = [];
    parts.push(`Research on "${query}":`);
    parts.push('');

    for (let i = 0; i < topFacts.length; i++) {
      const fact = topFacts[i];
      const verified = fact.verified ? 'OK' : '?';
      parts.push(`${i + 1}. [${verified}] ${fact.statement} (confidence: ${Math.round(fact.confidence * 100)}%)`);
    }

    if (facts.length > topFacts.length) {
      parts.push('');
      parts.push(`... and ${facts.length - topFacts.length} more facts.`);
    }

    return parts.join('\n');
  }

  private async storeResearch(query: string, sources: ResearchSource[], facts: Fact[], summary: string): Promise<void> {
    const researchId = `research_${Date.now()}`;
    this.network.addNode({
      id: researchId,
      type: 'event',
      domain: 'general' as AsisDomain,
      label: `Research: ${query}`,
      properties: {
        query,
        summary,
        factCount: facts.length,
        sourceCount: sources.length,
        timestamp: new Date().toISOString(),
      },
      confidence: this.computeOverallConfidence(facts),
      source: 'interaction',
    });

    for (const fact of facts) {
      const factId = `fact_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      this.network.addNode({
        id: factId,
        type: 'outcome',
        domain: 'general' as AsisDomain,
        label: fact.statement.substring(0, 100),
        properties: {
          statement: fact.statement,
          verified: fact.verified,
          confidence: fact.confidence,
          source: fact.source,
        },
        confidence: fact.confidence,
        source: 'inference',
      });

      this.network.addEdge({
        id: `edge_${Date.now()}_fact`,
        from: researchId,
        to: factId,
        type: 'contains',
        domain: 'general' as AsisDomain,
        weight: fact.confidence,
        properties: {},
        evidence: [{
          type: 'inferred',
          description: 'Fact extracted from research',
          timestamp: new Date().toISOString(),
          confidence: fact.confidence,
        }],
      });
    }
  }

  private computeOverallConfidence(facts: Fact[]): number {
    if (facts.length === 0) return 0;
    const avgConfidence = facts.reduce((sum, f) => sum + f.confidence, 0) / facts.length;
    const verifiedRatio = facts.filter(f => f.verified).length / facts.length;
    return (avgConfidence * 0.6 + verifiedRatio * 0.4);
  }

  private generateRelatedQueries(query: string, facts: Fact[]): string[] {
    const terms = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const related: string[] = [];

    for (const term of terms.slice(0, 3)) {
      related.push(`${term} tutorial`);
      related.push(`${term} examples`);
      related.push(`${term} best practices`);
    }

    return related;
  }

  async researchCode(task: string, language: string = 'typescript'): Promise<{
    solution: string;
    explanation: string;
    sources: ResearchSource[];
    tested: boolean;
  }> {
    const codeQuery = `${task} ${language} example`;
    const research = await this.research(codeQuery, {
      userId: 'asis',
      userName: 'ASIS',
      language: 'en',
      region: 'global',
      timezone: 'UTC',
      currentApp: 'code',
      sessionId: `session_${Date.now()}`,
      timestamp: new Date().toISOString(),
    } as AsisContext);

    const codeBlocks = this.extractCodeBlocks(research.sources);
    const solution = this.synthesizeCode(codeBlocks, task, language);

    return {
      solution,
      explanation: research.summary,
      sources: research.sources,
      tested: false,
    };
  }

  private extractCodeBlocks(sources: ResearchSource[]): string[] {
    const blocks: string[] = [];

    for (const source of sources) {
      const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let match;

      while ((match = codeRegex.exec(source.snippet)) !== null) {
        blocks.push(match[2].trim());
      }
    }

    return blocks;
  }

  private synthesizeCode(blocks: string[], task: string, language: string): string {
    const parts: string[] = [];
    parts.push(`// ASIS Generated Solution`);
    parts.push(`// Task: ${task}`);
    parts.push(`// Language: ${language}`);
    parts.push('');

    for (let i = 0; i < Math.min(3, blocks.length); i++) {
      parts.push(`// Source ${i + 1}`);
      parts.push(blocks[i]);
      parts.push('');
    }

    return parts.join('\n');
  }
}

export default ResearchEngine;
