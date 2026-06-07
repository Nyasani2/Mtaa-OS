/**
 * ASIS Layer 4 — Context Builder
 * Assembles enriched context from memory layers
 * Injects conversation history, preferences, behavior patterns
 */

import {
  EnrichedContext,
  ContextSlice,
  ConversationTurn,
  BehaviorPattern,
  SuggestedAction,
  ContextBuilderConfig,
  MemoryLayer,
  ContextScope,
  MemoryQuery,
} from '../types';
import { MemoryEngine } from './memory-engine';
import { SemanticSearch } from './semantic-search';
import { Text } from 'react-native';


export class ContextBuilder {
  private memoryEngine: MemoryEngine;
  private semanticSearch: SemanticSearch;
  private config: ContextBuilderConfig;

  constructor(
    memoryEngine: MemoryEngine,
    semanticSearch: SemanticSearch,
    config: Partial<ContextBuilderConfig> = {}
  ) {
    this.memoryEngine = memoryEngine;
    this.semanticSearch = semanticSearch;
    this.config = {
      maxConversationHistory: 20,
      maxMemoryEntries: 50,
      maxBehaviorPatterns: 10,
      relevanceThreshold: 0.6,
      scopeTimeoutMs: 300000, // 5 minutes
      enableSemanticSearch: true,
      enableBehaviorInference: true,
      ...config,
    };
  }

  /**
   * Build enriched context for current session
   */
  async buildContext(
    userId: string,
    sessionId: string,
    currentInput: string,
    activeScopes: ContextScope[]
  ): Promise<EnrichedContext> {
    const timestamp = new Date();

    // 1. Build global slice
    const globalSlice = await this.buildGlobalSlice();

    // 2. Build scope-specific slices
    const slices: ContextSlice[] = [];
    for (const scope of activeScopes) {
      const slice = await this.buildScopeSlice(scope, currentInput);
      if (slice.relevance > this.config.relevanceThreshold) {
        slices.push(slice);
      }
    }

    // 3. Get conversation history
    const conversation = await this.getConversationHistory(sessionId);

    // 4. Get user preferences
    const preferences = await this.getPreferences();

    // 5. Get behavior patterns
    const behaviorPatterns = this.config.enableBehaviorInference
      ? await this.getBehaviorPatterns()
      : [];

    // 6. Generate suggested actions
    const suggestedActions = await this.generateSuggestions(
      currentInput,
      slices,
      behaviorPatterns
    );

    return {
      userId,
      sessionId,
      timestamp,
      global: globalSlice,
      slices,
      conversation,
      preferences,
      behaviorPatterns,
      availableAgents: this.getAvailableAgents(activeScopes),
      suggestedActions,
    };
  }

  private async buildGlobalSlice(): Promise<ContextSlice> {
    const query: MemoryQuery = {
      layer: [MemoryLayer.LONG_TERM, MemoryLayer.PREFERENCE],
      contextScope: ContextScope.GLOBAL,
      limit: this.config.maxMemoryEntries,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    };

    const memories = await this.memoryEngine.retrieve(query);

    return {
      scope: ContextScope.GLOBAL,
      relevance: 1.0,
      data: this.aggregateMemoryData(memories),
      memory: memories,
      expiresAt: new Date(Date.now() + this.config.scopeTimeoutMs),
    };
  }

  private async buildScopeSlice(scope: ContextScope, currentInput: string): Promise<ContextSlice> {
    // Get explicit memories for this scope
    const explicitQuery: MemoryQuery = {
      layer: [MemoryLayer.LONG_TERM, MemoryLayer.SHORT_TERM, MemoryLayer.PREFERENCE],
      contextScope: scope,
      limit: this.config.maxMemoryEntries / 2,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    };

    const explicitMemories = await this.memoryEngine.retrieve(explicitQuery);

    // Get semantic matches
    let semanticMemories = [];
    if (this.config.enableSemanticSearch) {
      semanticMemories = await this.semanticSearch.search(currentInput, scope, 10);
    }

    // Combine and deduplicate
    const allMemories = [...explicitMemories];
    for (const sem of semanticMemories) {
      if (!allMemories.some(m => m.id === (sem.entry as any).id)) {
        allMemories.push(sem.entry as any);
      }
    }

    // Calculate relevance score
    const relevance = this.calculateRelevance(scope, currentInput, allMemories);

    return {
      scope,
      relevance,
      data: this.aggregateMemoryData(allMemories),
      memory: allMemories.slice(0, this.config.maxMemoryEntries),
      expiresAt: new Date(Date.now() + this.config.scopeTimeoutMs),
    };
  }

  private async getConversationHistory(sessionId: string): Promise<ConversationTurn[]> {
    const query: MemoryQuery = {
      layer: MemoryLayer.SHORT_TERM,
      keyPattern: `conversation:${sessionId}:*`,
      limit: this.config.maxConversationHistory,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    const memories = await this.memoryEngine.retrieve(query);
    return memories
      .map(m => m.value as ConversationTurn)
      .filter(Boolean)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private async getPreferences(): Promise<any[]> {
    const query: MemoryQuery = {
      layer: MemoryLayer.PREFERENCE,
      limit: 100,
      sortBy: 'confidence',
      sortOrder: 'desc',
    };

    const memories = await this.memoryEngine.retrieve(query);
    return memories.map(m => ({
      key: m.key,
      value: m.value,
      confidence: m.confidence,
      source: m.source.type,
    }));
  }

  private async getBehaviorPatterns(): Promise<BehaviorPattern[]> {
    const query: MemoryQuery = {
      layer: MemoryLayer.LONG_TERM,
      tags: ['behavior_pattern'],
      limit: this.config.maxBehaviorPatterns,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    };

    const memories = await this.memoryEngine.retrieve(query);
    return memories.map(m => m.value as BehaviorPattern).filter(Boolean);
  }

  private async generateSuggestions(
    input: string,
    slices: ContextSlice[],
    patterns: BehaviorPattern[]
  ): Promise<SuggestedAction[]> {
    const suggestions: SuggestedAction[] = [];

    // Pattern-based suggestions
    for (const pattern of patterns) {
      if (pattern.pattern.includes(input.toLowerCase()) || input.toLowerCase().includes(pattern.pattern)) {
        suggestions.push({
          action: `repeat_${pattern.pattern}`,
          agent: this.inferAgent(pattern.pattern),
          confidence: pattern.confidence,
          reason: `You've done this ${pattern.frequency} times before`,
        });
      }
    }

    // Context-based suggestions
    for (const slice of slices) {
      if (slice.scope === ContextScope.WALLET && input.includes('pay')) {
        suggestions.push({
          action: 'quick_pay',
          agent: 'wallet_agent',
          confidence: 0.8,
          reason: 'Based on your payment history',
        });
      }
      if (slice.scope === ContextScope.TRANSPORT && input.includes('ride')) {
        suggestions.push({
          action: 'book_ride',
          agent: 'mtaxi_agent',
          confidence: 0.85,
          reason: 'Frequent ride to this destination',
        });
      }
    }

    // Sort by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);
    return suggestions.slice(0, 5);
  }

  private calculateRelevance(scope: ContextScope, input: string, memories: any[]): number {
    if (memories.length === 0) return 0;

    // Simple relevance: keyword overlap + recency + confidence
    const keywords = input.toLowerCase().split(/\s+/);
    let score = 0;

    for (const mem of memories) {
      const memText = JSON.stringify(mem).toLowerCase();
      const keywordMatches = keywords.filter(k => memText.includes(k)).length;
      score += (keywordMatches / keywords.length) * mem.confidence;
    }

    return Math.min(score / memories.length, 1.0);
  }

  private aggregateMemoryData(memories: any[]): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const mem of memories) {
      data[mem.key] = mem.value;
    }
    return data;
  }

  private inferAgent(pattern: string): string {
    if (pattern.includes('ride') || pattern.includes('taxi')) return 'mtaxi_agent';
    if (pattern.includes('pay') || pattern.includes('transfer')) return 'wallet_agent';
    if (pattern.includes('shop') || pattern.includes('buy')) return 'shop_agent';
    if (pattern.includes('health') || pattern.includes('doctor')) return 'health_agent';
    if (pattern.includes('job') || pattern.includes('work')) return 'jobs_agent';
    return 'general_agent';
  }

  private getAvailableAgents(scopes: ContextScope[]): string[] {
    const agents: Record<ContextScope, string[]> = {
      [ContextScope.GLOBAL]: ['general_agent'],
      [ContextScope.WALLET]: ['wallet_agent'],
      [ContextScope.HEALTH]: ['health_agent'],
      [ContextScope.TRANSPORT]: ['mtaxi_agent', 'mtruck_agent'],
      [ContextScope.CIVIC]: ['civic_agent'],
      [ContextScope.SHOP]: ['shop_agent'],
      [ContextScope.MARKETPLACE]: ['marketplace_agent'],
      [ContextScope.EDUCATION]: ['education_agent'],
      [ContextScope.JOBS]: ['jobs_agent'],
      [ContextScope.TRIBES]: ['tribes_agent'],
      [ContextScope.ENGINEERING]: ['engineering_agent'],
      [ContextScope.ADMIN]: ['admin_agent'],
    };

    const available = new Set<string>();
    for (const scope of scopes) {
      (agents[scope] || []).forEach(a => available.add(a));
    }
    return Array.from(available);
  }
}