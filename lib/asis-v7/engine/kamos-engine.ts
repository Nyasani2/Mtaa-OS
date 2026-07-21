/**
 * ASIS v7 Kamos Synthesis Engine
 * Core intelligence layer based on Kamos Theory
 * 1×1 = 1 + f(growth, replication, interaction, observation)
 * 
 * Every user interaction → Observation
 * Pattern extraction → Growth
 * Shared insight → Replication (anonymized across users)
 * Better predictions → Interaction (improved next response)
 * Loop repeats = Intelligence proliferation
 */

import {
  KamosState, KnowledgeGraph, KnowledgeFact, UserPreference,
  InteractionRecord, CollectivePattern, ContextVector, Observation,
  SynthesizedResponse, ToolOutput, IntentResult, ASISPersonality,
} from '../types';

// ─── Kamos Math ─────────────────────────────────────────────────

/**
 * Kamos Theory: 1×1 = 1 + f(growth, replication, interaction, observation)
 * 
 * Base truth (1×1 = 1): Every query starts with a factual foundation
 * Growth factor: User-specific knowledge accumulation
 * Replication factor: Collective wisdom from all users
 * Interaction factor: Current context weighting
 * Observation factor: What we just learned
 */

interface KamosFactors {
  growth: number;      // 0-1, user knowledge depth
  replication: number; // 0-1, collective pattern strength
  interaction: number; // 0-1, context relevance
  observation: number; // 0-1, new learning confidence
}

function calculateKamosValue(base: number, factors: KamosFactors): number {
  // 1×1 = 1 + f(growth, replication, interaction, observation)
  const f = (factors.growth * 0.3) +
            (factors.replication * 0.25) +
            (factors.interaction * 0.25) +
            (factors.observation * 0.2);

  return base + f;
}

// ─── Knowledge Graph Manager ────────────────────────────────────

class KnowledgeGraphManager {
  private graph: KnowledgeGraph;
  private maxFacts: number = 500;
  private maxHistory: number = 100;

  constructor(userId: string) {
    this.graph = {
      userId,
      facts: [],
      preferences: [],
      interactionHistory: [],
      lastUpdated: Date.now(),
    };
  }

  addFact(fact: Omit<KnowledgeFact, 'timestamp'>): void {
    this.graph.facts.push({ ...fact, timestamp: Date.now() });
    this.pruneFacts();
    this.graph.lastUpdated = Date.now();
  }

  addPreference(pref: Omit<UserPreference, 'weight'> & { weight?: number }): void {
    const existing = this.graph.preferences.find(
      p => p.category === pref.category && p.key === pref.key
    );

    if (existing) {
      // Update with exponential moving average
      existing.value = pref.value;
      existing.weight = Math.min((existing.weight * 0.7) + ((pref.weight || 0.5) * 0.3), 1.0);
    } else {
      this.graph.preferences.push({
        category: pref.category,
        key: pref.key,
        value: pref.value,
        weight: pref.weight || 0.5,
      });
    }
  }

  addInteraction(record: Omit<InteractionRecord, 'timestamp'>): void {
    this.graph.interactionHistory.push({ ...record, timestamp: Date.now() });
    this.pruneHistory();
    this.graph.lastUpdated = Date.now();
  }

  getRelevantFacts(subject: string): KnowledgeFact[] {
    const subjectLower = subject.toLowerCase();
    return this.graph.facts
      .filter(f => 
        f.subject.toLowerCase().includes(subjectLower) ||
        f.object.toLowerCase().includes(subjectLower)
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  getPreference(category: string, key: string): UserPreference | null {
    return this.graph.preferences.find(
      p => p.category === category && p.key === key
    ) || null;
  }

  getRecentInteractions(count: number = 10): InteractionRecord[] {
    return this.graph.interactionHistory
      .slice(-count)
      .reverse();
  }

  getInteractionStats(): { total: number; avgSatisfaction: number; topIntents: string[] } {
    const total = this.graph.interactionHistory.length;
    const avgSatisfaction = total > 0
      ? this.graph.interactionHistory.reduce((sum, h) => sum + h.satisfaction, 0) / total
      : 0;

    const intentCounts = new Map<string, number>();
    for (const h of this.graph.interactionHistory) {
      intentCounts.set(h.intent, (intentCounts.get(h.intent) || 0) + 1);
    }

    const topIntents = Array.from(intentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([intent]) => intent);

    return { total, avgSatisfaction, topIntents };
  }

  private pruneFacts(): void {
    if (this.graph.facts.length > this.maxFacts) {
      // Keep highest confidence facts, remove oldest low-confidence ones
      this.graph.facts.sort((a, b) => {
        const scoreA = a.confidence + (a.timestamp / Date.now()) * 0.1;
        const scoreB = b.confidence + (b.timestamp / Date.now()) * 0.1;
        return scoreB - scoreA;
      });
      this.graph.facts = this.graph.facts.slice(0, this.maxFacts);
    }
  }

  private pruneHistory(): void {
    if (this.graph.interactionHistory.length > this.maxHistory) {
      this.graph.interactionHistory = this.graph.interactionHistory.slice(-this.maxHistory);
    }
  }

  getGraph(): KnowledgeGraph {
    return { ...this.graph };
  }
}

// ─── Collective Pattern Manager ─────────────────────────────────

class CollectivePatternManager {
  private patterns: CollectivePattern[] = [];
  private maxPatterns: number = 1000;

  addPattern(pattern: Omit<CollectivePattern, 'anonymized'>): void {
    const existing = this.patterns.find(
      p => p.patternId === pattern.patternId
    );

    if (existing) {
      // Update success rate with moving average
      existing.successRate = (existing.successRate * existing.usageCount + pattern.successRate) / (existing.usageCount + 1);
      existing.usageCount++;
      existing.responseTemplate = pattern.responseTemplate;
    } else {
      this.patterns.push({
        ...pattern,
        anonymized: true,
      });
    }

    this.prunePatterns();
  }

  findPatterns(intent: string, query: string): CollectivePattern[] {
    const queryLower = query.toLowerCase();
    return this.patterns
      .filter(p => {
        if (p.intent !== intent) return false;
        try {
          const regex = new RegExp(p.queryPattern, 'i');
          return regex.test(queryLower);
        } catch {
          return false;
        }
      })
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);
  }

  getTopPatterns(limit: number = 50): CollectivePattern[] {
    return this.patterns
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  private prunePatterns(): void {
    if (this.patterns.length > this.maxPatterns) {
      this.patterns.sort((a, b) => {
        const scoreA = a.successRate * Math.log(a.usageCount + 1);
        const scoreB = b.successRate * Math.log(b.usageCount + 1);
        return scoreB - scoreA;
      });
      this.patterns = this.patterns.slice(0, this.maxPatterns);
    }
  }
}

// ─── Context Manager ────────────────────────────────────────────

class ContextManager {
  private context: ContextVector;

  constructor() {
    this.context = this.buildDefaultContext();
  }

  private buildDefaultContext(): ContextVector {
    const now = new Date();
    const hour = now.getHours();
    let timeOfDay: ContextVector['timeOfDay'] = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else if (hour >= 21 || hour < 5) timeOfDay = 'night';

    return {
      timeOfDay,
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()],
      recentApps: [],
      recentQueries: [],
      deviceState: {
        batteryLevel: 0.5,
        isCharging: false,
        storageUsed: 0,
        storageTotal: 1,
        osVersion: '1.0',
        appVersion: '1.0',
      },
      networkState: {
        type: 'WIFI',
        isConnected: true,
        isInternetReachable: true,
      },
    };
  }

  updateContext(updates: Partial<ContextVector>): void {
    this.context = { ...this.context, ...updates };
  }

  updateDeviceState(state: Partial<ContextVector['deviceState']>): void {
    this.context.deviceState = { ...this.context.deviceState, ...state };
  }

  updateNetworkState(state: Partial<ContextVector['networkState']>): void {
    this.context.networkState = { ...this.context.networkState, ...state };
  }

  addRecentQuery(query: string): void {
    this.context.recentQueries = [query, ...this.context.recentQueries].slice(0, 10);
  }

  addRecentApp(app: string): void {
    this.context.recentApps = [app, ...this.context.recentApps].slice(0, 5);
  }

  getContext(): ContextVector {
    return { ...this.context };
  }
}

// ─── Kamos Engine ───────────────────────────────────────────────

export class KamosEngine {
  private knowledgeManager: KnowledgeGraphManager;
  private patternManager: CollectivePatternManager;
  private contextManager: ContextManager;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.knowledgeManager = new KnowledgeGraphManager(userId);
    this.patternManager = new CollectivePatternManager();
    this.contextManager = new ContextManager();
  }

  /**
   * Main synthesis function
   * 1×1 = 1 + f(growth, replication, interaction, observation)
   */
  synthesize(
    query: string,
    intent: IntentResult,
    toolOutputs: ToolOutput[],
    searchResults: any[]
  ): SynthesizedResponse {
    // 1. Start with base truth (1×1 = 1)
    let response = this.buildFactualBase(toolOutputs, searchResults);

    // Calculate Kamos factors
    const factors = this.calculateFactors(query, intent, toolOutputs);

    // 2. Apply growth (user-specific knowledge)
    response = this.applyGrowth(response, query, intent);

    // 3. Apply replication (collective wisdom)
    response = this.applyReplication(response, intent);

    // 4. Apply interaction (current context)
    response = this.applyInteraction(response);

    // 5. Apply observation (what we just learned)
    this.updateKnowledgeGraph(query, intent, toolOutputs, response);

    // Calculate final confidence using Kamos math
    const kamosValue = calculateKamosValue(response.confidence, factors);
    response.confidence = Math.min(kamosValue, 1.0);

    return response;
  }

  /**
   * Build factual base from tool outputs
   */
  private buildFactualBase(toolOutputs: ToolOutput[], searchResults: any[]): SynthesizedResponse {
    const facts: string[] = [];
    const details: string[] = [];
    const sources: any[] = [];

    for (const output of toolOutputs) {
      if (output.success && output.data) {
        if (typeof output.data === 'string') {
          facts.push(output.data);
        } else if (typeof output.data === 'object') {
          facts.push(JSON.stringify(output.data, null, 2));
        }
      }
    }

    for (const result of searchResults.slice(0, 3)) {
      if (result.snippet) {
        facts.push(result.snippet);
      }
      if (result.title && result.url) {
        sources.push({
          title: result.title,
          url: result.url,
          source: result.source,
          relevance: result.relevance || 0.5,
        });
      }
    }

    return {
      text: facts.join('\n\n'),
      facts,
      details,
      followUpSuggestions: [],
      confidence: 0.5,
      sources,
    };
  }

  /**
   * Calculate Kamos factors for this query
   */
  private calculateFactors(query: string, intent: IntentResult, toolOutputs: ToolOutput[]): KamosFactors {
    // Growth: based on user knowledge depth for this intent
    const relevantFacts = this.knowledgeManager.getRelevantFacts(query);
    const growth = Math.min(relevantFacts.length / 10, 1.0);

    // Replication: based on collective pattern strength
    const patterns = this.patternManager.findPatterns(intent.category, query);
    const replication = patterns.length > 0 ? Math.max(...patterns.map(p => p.successRate)) : 0.3;

    // Interaction: based on context relevance
    const context = this.contextManager.getContext();
    const recentSimilar = context.recentQueries.filter(q =>
      this.calculateSimilarity(q, query) > 0.5
    ).length;
    const interaction = Math.min(recentSimilar / 3, 1.0);

    // Observation: based on tool output quality
    const successfulTools = toolOutputs.filter(t => t.success).length;
    const observation = toolOutputs.length > 0 ? successfulTools / toolOutputs.length : 0.5;

    return { growth, replication, interaction, observation };
  }

  /**
   * Apply user-specific knowledge (growth)
   */
  private applyGrowth(response: SynthesizedResponse, query: string, intent: IntentResult): SynthesizedResponse {
    const relevantFacts = this.knowledgeManager.getRelevantFacts(query);

    if (relevantFacts.length > 0) {
      const factText = relevantFacts
        .slice(0, 3)
        .map(f => `${f.subject} ${f.predicate} ${f.object}`)
        .join(', ');

      response.details.push(`Based on your history: ${factText}`);
    }

    // Add preference-based personalization
    const verbosityPref = this.knowledgeManager.getPreference('response', 'verbosity');
    if (verbosityPref) {
      if (verbosityPref.value === 'concise') {
        response.text = this.summarizeText(response.text, 100);
      }
    }

    return response;
  }

  /**
   * Apply collective wisdom (replication)
   */
  private applyReplication(response: SynthesizedResponse, intent: IntentResult): SynthesizedResponse {
    const patterns = this.patternManager.findPatterns(intent.category, '');

    if (patterns.length > 0 && patterns[0].successRate > 0.8) {
      // High-confidence collective pattern — enhance response
      const template = patterns[0].responseTemplate;
      if (template && response.text.length < 200) {
        response.text = template.replace('{{answer}}', response.text);
      }
    }

    return response;
  }

  /**
   * Apply current context (interaction)
   */
  private applyInteraction(response: SynthesizedResponse): SynthesizedResponse {
    const context = this.contextManager.getContext();

    // Time-appropriate greetings
    if (context.timeOfDay) {
      const timeGreetings: Record<string, string> = {
        morning: 'Good morning',
        afternoon: 'Good afternoon',
        evening: 'Good evening',
        night: 'Good evening',
      };

      // Only add greeting for conversational intents
      if (response.text.length < 500 && !response.text.startsWith('Good')) {
        // Don't prepend to factual responses
      }
    }

    // Location-aware suggestions
    if (context.location) {
      response.followUpSuggestions.push(`Find services near ${context.location.name || 'you'}`);
    }

    // App-aware suggestions
    if (context.activeApp) {
      response.followUpSuggestions.push(`More about ${context.activeApp}`);
    }

    return response;
  }

  /**
   * Update knowledge graph with new observation
   */
  private updateKnowledgeGraph(
    query: string,
    intent: IntentResult,
    toolOutputs: ToolOutput[],
    response: SynthesizedResponse
  ): void {
    // Record interaction
    this.knowledgeManager.addInteraction({
      query,
      intent: intent.category,
      satisfaction: 0.5, // Will be updated based on follow-up
    });

    // Extract facts from response
    for (const fact of response.facts) {
      if (fact.length > 10 && fact.length < 200) {
        this.knowledgeManager.addFact({
          subject: query,
          predicate: 'has_answer',
          object: fact,
          confidence: response.confidence,
          source: 'inferred',
        });
      }
    }

    // Update preferences based on intent
    this.knowledgeManager.addPreference({
      category: 'intent_frequency',
      key: intent.category,
      value: (this.knowledgeManager.getPreference('intent_frequency', intent.category)?.value || 0) + 1,
      weight: 0.3,
    });

    // Add to collective patterns if high confidence
    if (response.confidence > 0.8) {
      this.patternManager.addPattern({
        patternId: `${intent.category}_${Date.now()}`,
        intent: intent.category,
        queryPattern: query.substring(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\$&'),
        responseTemplate: response.text.substring(0, 200),
        successRate: response.confidence,
        usageCount: 1,
      });
    }

    // Update context
    this.contextManager.addRecentQuery(query);
  }

  /**
   * Update user feedback on last interaction
   */
  updateFeedback(satisfaction: number): void {
    const history = this.knowledgeManager.getRecentInteractions(1);
    if (history.length > 0) {
      history[0].satisfaction = satisfaction;
    }
  }

  /**
   * Get Kamos state snapshot
   */
  getKamosState(): KamosState {
    return {
      userKnowledgeGraph: this.knowledgeManager.getGraph(),
      collectivePatterns: this.patternManager.getTopPatterns(20),
      contextVector: this.contextManager.getContext(),
      newObservation: {
        query: '',
        parsedIntent: { category: 'unknown', confidence: 0, entities: [], urgency: 0, requiresTools: [], suggestedActions: [] },
        toolResults: [],
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Update context vector
   */
  updateContext(updates: Partial<ContextVector>): void {
    this.contextManager.updateContext(updates);
  }

  /**
   * Get user insights
   */
  getUserInsights(): {
    topIntents: string[];
    avgSatisfaction: number;
    totalInteractions: number;
    knownFacts: number;
    preferences: number;
  } {
    const stats = this.knowledgeManager.getInteractionStats();
    const graph = this.knowledgeManager.getGraph();

    return {
      topIntents: stats.topIntents,
      avgSatisfaction: stats.avgSatisfaction,
      totalInteractions: stats.total,
      knownFacts: graph.facts.length,
      preferences: graph.preferences.length,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private calculateSimilarity(a: string, b: string): number {
    const aWords = new Set(a.toLowerCase().split(/\s+/));
    const bWords = new Set(b.toLowerCase().split(/\s+/));
    const intersection = new Set([...aWords].filter(x => bWords.has(x)));
    const union = new Set([...aWords, ...bWords]);
    return intersection.size / union.size;
  }

  private summarizeText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }
}

// ─── Singleton Instance ─────────────────────────────────────────

const engineInstances = new Map<string, KamosEngine>();

export function getKamosEngine(userId: string): KamosEngine {
  if (!engineInstances.has(userId)) {
    engineInstances.set(userId, new KamosEngine(userId));
  }
  return engineInstances.get(userId)!;
}

// ─── Default Personality ────────────────────────────────────────

export const DEFAULT_PERSONALITY: ASISPersonality = {
  name: 'ASIS',
  greetingStyle: 'friendly',
  verbosity: 'balanced',
  humor: 0.3,
  empathy: 0.7,
  technicalDepth: 0.6,
  culturalAwareness: ['african', 'global'],
};
