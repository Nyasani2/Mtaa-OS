// ASIS v1 - Memory Engine
// Manages short-term (conversation) and long-term (facts, preferences, patterns) memory
// Uses Supabase vector store for semantic search

import { AsisRequest, AsisResponse, AsisMemory, MemoryEntry, AsisMessage } from '../types';

export class MemoryEngine {
  private readonly SHORT_TERM_LIMIT = 20;
  private readonly MEMORY_CONFIDENCE_THRESHOLD = 0.7;

  /**
   * Retrieve relevant memories for a user query
   * 1. Search short-term conversation history
   * 2. Search long-term vector store for semantic matches
   * 3. Rank by relevance and recency
   */
  async retrieve(userId: string, query: string, limit: number = 5): Promise<string[]> {
    const memories: string[] = [];

    // Get short-term context (last N messages)
    const shortTerm = await this.getShortTerm(userId);
    if (shortTerm.length > 0) {
      memories.push(`Recent conversation context: ${shortTerm.slice(-5).map(m => m.content).join(' | ')}`);
    }

    // Search long-term memory via vector store
    const longTerm = await this.searchLongTerm(userId, query, limit);
    if (longTerm.length > 0) {
      memories.push(...longTerm.map(entry => `${entry.type}: ${entry.content}`));
    }

    // Get high-confidence preferences
    const preferences = await this.getPreferences(userId);
    if (preferences.length > 0) {
      memories.push(`User preferences: ${preferences.join(', ')}`);
    }

    return memories;
  }

  /**
   * Store interaction in memory
   * 1. Add to short-term conversation history
   * 2. Extract facts/preferences for long-term storage
   * 3. Update vector embeddings
   */
  async store(request: AsisRequest, response: AsisResponse): Promise<void> {
    const userId = request.context.userId;

    // Store in short-term
    await this.addToShortTerm(userId, {
      role: 'user',
      content: request.message,
      timestamp: new Date().toISOString(),
    });

    await this.addToShortTerm(userId, {
      role: 'asis',
      content: response.message,
      timestamp: new Date().toISOString(),
      metadata: {
        domain: response.domain,
        confidence: response.confidence,
        actions: response.actions?.map(a => a.type),
      },
    });

    // Extract and store long-term memories
    const extracted = this.extractMemories(request, response);
    for (const entry of extracted) {
      await this.addToLongTerm(userId, entry);
    }

    // Update access patterns
    await this.updateAccessPatterns(userId, request.domain);
  }

  /**
   * Get short-term conversation history
   */
  private async getShortTerm(userId: string): Promise<AsisMessage[]> {
    // Delegated to edge function: queries asis_sessions table
    // Returns last SHORT_TERM_LIMIT messages for this user
    return [];
  }

  /**
   * Add message to short-term history
   */
  private async addToShortTerm(userId: string, message: AsisMessage): Promise<void> {
    // Edge function: INSERT into asis_sessions, prune old messages
  }

  /**
   * Search long-term memory via vector similarity
   */
  private async searchLongTerm(userId: string, query: string, limit: number): Promise<MemoryEntry[]> {
    // Edge function:
    // 1. Generate embedding for query (via edge function or pgvector)
    // 2. Search asis_memory table with vector similarity
    // 3. Filter by user_id and confidence threshold
    // 4. Return top N results
    return [];
  }

  /**
   * Add entry to long-term memory
   */
  private async addToLongTerm(userId: string, entry: MemoryEntry): Promise<void> {
    // Edge function:
    // 1. Generate embedding for entry.content
    // 2. INSERT into asis_memory with embedding vector
    // 3. Update user memory summary
  }

  /**
   * Extract memories from an interaction
   */
  private extractMemories(request: AsisRequest, response: AsisResponse): MemoryEntry[] {
    const entries: MemoryEntry[] = [];
    const message = request.message.toLowerCase();

    // Extract preferences
    if (message.includes('prefer') || message.includes('like') || message.includes('want')) {
      entries.push({
        id: this.generateId(),
        type: 'preference',
        content: `User expressed preference: "${request.message}"`,
        confidence: 0.6,
        source: 'explicit_statement',
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        accessCount: 1,
      });
    }

    // Extract goals
    if (message.includes('goal') || message.includes('want to save') || message.includes('plan to')) {
      entries.push({
        id: this.generateId(),
        type: 'goal',
        content: `User goal: "${request.message}"`,
        confidence: 0.7,
        source: 'explicit_statement',
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        accessCount: 1,
      });
    }

    // Extract facts from ASIS insights
    if (response.insights) {
      for (const insight of response.insights) {
        if (insight.type === 'pattern' || insight.type === 'recommendation') {
          entries.push({
            id: this.generateId(),
            type: 'fact',
            content: `ASIS insight: ${insight.title} — ${insight.description}`,
            confidence: insight.severity === 'high' ? 0.8 : 0.6,
            source: 'asis_analysis',
            createdAt: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            accessCount: 1,
          });
        }
      }
    }

    // Extract patterns from actions
    if (response.actions) {
      for (const action of response.actions) {
        entries.push({
          id: this.generateId(),
          type: 'pattern',
          content: `User action pattern: ${action.type} → ${action.target}`,
          confidence: 0.5,
          source: 'user_action',
          createdAt: new Date().toISOString(),
          lastAccessed: new Date().toISOString(),
          accessCount: 1,
        });
      }
    }

    return entries.filter(e => e.confidence >= this.MEMORY_CONFIDENCE_THRESHOLD);
  }

  /**
   * Get user preferences from long-term memory
   */
  private async getPreferences(userId: string): Promise<string[]> {
    // Edge function: SELECT content FROM asis_memory WHERE type = 'preference' AND user_id = $1
    return [];
  }

  /**
   * Update access patterns for user
   */
  private async updateAccessPatterns(userId: string, domain: string): Promise<void> {
    // Edge function: Update asis_user_stats with domain access counts
  }

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get memory statistics for a user
   */
  async getStats(userId: string): Promise<{
    shortTermCount: number;
    longTermCount: number;
    topDomains: string[];
    lastActive: string;
  }> {
    // Edge function aggregation
    return {
      shortTermCount: 0,
      longTermCount: 0,
      topDomains: [],
      lastActive: new Date().toISOString(),
    };
  }
}

export default MemoryEngine;
