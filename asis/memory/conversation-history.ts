/**
 * ASIS Layer 4 — Conversation History Manager
 * Stores and retrieves conversation turns with semantic indexing
 */

import { ConversationTurn, ConversationSession, ExtractedEntity, ContextScope } from '../types';
import { MemoryEngine } from './memory-engine';
import { MemoryLayer, MemoryPriority } from '../types/memory.types';

export class ConversationHistory {
  private memoryEngine: MemoryEngine;
  private activeSessions: Map<string, ConversationSession> = new Map();

  constructor(memoryEngine: MemoryEngine) {
    this.memoryEngine = memoryEngine;
  }

  /**
   * Start a new conversation session
   */
  async startSession(userId: string, sessionId: string): Promise<ConversationSession> {
    const session: ConversationSession = {
      id: sessionId,
      userId,
      startedAt: new Date(),
      turns: [],
      topics: [],
      activeScopes: [ContextScope.GLOBAL],
      totalTurns: 0,
    };

    this.activeSessions.set(sessionId, session);
    return session;
  }

  /**
   * Add a turn to the conversation
   */
  async addTurn(
    sessionId: string,
    role: 'user' | 'asis' | 'system' | 'agent',
    content: string,
    options: {
      agentId?: string;
      intent?: string;
      entities?: ExtractedEntity[];
      sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed';
      scope?: ContextScope;
    } = {}
  ): Promise<ConversationTurn> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const turn: ConversationTurn = {
      id: `turn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sessionId,
      timestamp: new Date(),
      role,
      agentId: options.agentId,
      content,
      intent: options.intent,
      entities: options.entities || [],
      sentiment: options.sentiment,
      contextScope: options.scope || ContextScope.GLOBAL,
      metadata: {
        language: this.detectLanguage(content),
        confidence: 1.0,
      },
    };

    session.turns.push(turn);
    session.totalTurns++;

    // Update active scopes
    if (options.scope && !session.activeScopes.includes(options.scope)) {
      session.activeScopes.push(options.scope);
    }

    // Store in short-term memory
    await this.memoryEngine.store(
      MemoryLayer.SHORT_TERM,
      `conversation:${sessionId}:${turn.id}`,
      turn,
      {
        priority: MemoryPriority.NORMAL,
        scope: options.scope || ContextScope.GLOBAL,
        ttl: 60, // 1 hour session
        source: { type: 'conversation', sessionId, conversationId: sessionId },
        tags: ['conversation', role, options.intent || 'unknown'].filter(Boolean),
      }
    );

    // Extract and store entities as long-term memory
    for (const entity of turn.entities) {
      await this.memoryEngine.store(
        MemoryLayer.LONG_TERM,
        `entity:${entity.type}:${entity.value}`,
        entity,
        {
          priority: MemoryPriority.HIGH,
          scope: options.scope || ContextScope.GLOBAL,
          source: { type: 'conversation', sessionId },
          tags: ['entity', entity.type],
          confidence: entity.confidence,
        }
      );
    }

    return turn;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ConversationSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get recent turns from session
   */
  getRecentTurns(sessionId: string, limit: number = 10): ConversationTurn[] {
    const session = this.activeSessions.get(sessionId);
    if (!session) return [];
    return session.turns.slice(-limit);
  }

  /**
   * End session and summarize
   */
  async endSession(sessionId: string): Promise<ConversationSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.endedAt = new Date();

    // Generate summary (simplified)
    session.summary = this.generateSummary(session);
    session.topics = this.extractTopics(session);

    // Store session summary in long-term memory
    await this.memoryEngine.store(
      MemoryLayer.LONG_TERM,
      `session_summary:${sessionId}`,
      {
        summary: session.summary,
        topics: session.topics,
        totalTurns: session.totalTurns,
        scopes: session.activeScopes,
      },
      {
        priority: MemoryPriority.NORMAL,
        scope: ContextScope.GLOBAL,
        source: { type: 'conversation', sessionId },
        tags: ['session_summary', ...session.topics],
      }
    );

    this.activeSessions.delete(sessionId);
    return session;
  }

  /**
   * Search conversation history
   */
  async searchHistory(query: string, limit: number = 10): Promise<ConversationTurn[]> {
    const results = await this.memoryEngine.retrieve({
      layer: MemoryLayer.SHORT_TERM,
      tags: ['conversation'],
      limit: limit * 2,
    });

    // Simple text matching (semantic search would be better)
    const queryLower = query.toLowerCase();
    const matches = results
      .map(r => r.value as ConversationTurn)
      .filter(t => t && t.content.toLowerCase().includes(queryLower))
      .slice(0, limit);

    return matches;
  }

  private detectLanguage(text: string): string {
    // Simplified language detection
    // In production: use franc or similar library
    if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(text)) return 'fr';
    if (/[áéíóúüñ¿¡]/.test(text)) return 'es';
    if (/[äöüß]/.test(text)) return 'de';
    if (/[àèéìòù]/.test(text)) return 'it';
    if (/[ąćęłńóśźż]/.test(text)) return 'pl';
    if (/[áéíóúýčďěňřšťůž]/.test(text)) return 'cs';
    if (/[ăâîșț]/.test(text)) return 'ro';
    if (/[æøå]/.test(text)) return 'da';
    if (/[äöå]/.test(text)) return 'sv';
    if (/[áéíóúýðþæö]/.test(text)) return 'is';
    if (/[αβγδεζηθικλμνξοπρστυφχψω]/.test(text)) return 'el';
    if (/[а-яА-Я]/.test(text)) return 'ru';
    if (/[א-ת]/.test(text)) return 'he';
    if (/[الابتثجحخدذرزسشصضطظعغفقكلمنهوي]/.test(text)) return 'ar';
    if (/[अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह]/.test(text)) return 'hi';
    if (/[가-힣]/.test(text)) return 'ko';
    if (/[あ-んア-ン]/.test(text)) return 'ja';
    if (/[一-龯]/.test(text)) return 'zh';
    return 'en';
  }

  private generateSummary(session: ConversationSession): string {
    const turns = session.turns;
    if (turns.length === 0) return 'Empty session';

    const userTurns = turns.filter(t => t.role === 'user');
    const intents = new Set(userTurns.map(t => t.intent).filter(Boolean));
    const topics = Array.from(intents).slice(0, 5);

    return `Session with ${turns.length} turns. Topics: ${topics.join(', ') || 'general'}.`;
  }

  private extractTopics(session: ConversationSession): string[] {
    const topics = new Set<string>();
    for (const turn of session.turns) {
      if (turn.intent) topics.add(turn.intent);
      for (const entity of turn.entities) {
        topics.add(entity.type);
      }
    }
    return Array.from(topics).slice(0, 10);
  }
}