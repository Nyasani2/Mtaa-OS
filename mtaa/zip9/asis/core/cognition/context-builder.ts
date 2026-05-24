// ============================================================
// CONTEXT BUILDER — Unified context from session, memory, state
// Token-budget aware, priority-weighted, noise-filtered
// ============================================================

import { IContextBuilder } from './interfaces';
import { UnifiedContext, PerceptionState, MemorySlice, RecentAction, ProfileSignal, EnvironmentState } from './types';

export class ContextBuilder implements IContextBuilder {
  private actionHistory: Map<string, RecentAction[]> = new Map();
  private profileSignals: Map<string, ProfileSignal[]> = new Map();
  private environmentCache: Map<string, EnvironmentState> = new Map();
  private readonly DEFAULT_TOKEN_BUDGET = 4000;

  async build(sessionId: string, userId: string, perception: PerceptionState): Promise<UnifiedContext> {
    const recentActions = this.actionHistory.get(sessionId) || [];
    const signals = this.profileSignals.get(userId) || [];
    const env = this.environmentCache.get(sessionId) || this.detectEnvironment();

    // Build memory slices placeholder — integrate with ZIP 4 memory system
    const memorySlices: MemorySlice[] = [];

    const context: UnifiedContext = {
      sessionId,
      userId,
      currentDomain: perception.detectedDomain,
      recentActions: recentActions.slice(-5), // last 5 actions
      userProfileSignals: signals,
      memorySlices,
      environmentState: env,
      tokenBudgetUsed: 0,
      tokenBudgetMax: this.DEFAULT_TOKEN_BUDGET,
    };

    // Calculate token usage estimate
    context.tokenBudgetUsed = this.estimateTokens(context);

    return context;
  }

  trim(context: UnifiedContext, budget: number): UnifiedContext {
    if (context.tokenBudgetUsed <= budget) return context;

    let trimmed = { ...context };
    const overflow = context.tokenBudgetUsed - budget;

    // Priority trimming order: memory → actions → signals → environment
    if (overflow > 0 && trimmed.memorySlices.length > 0) {
      trimmed.memorySlices = this.trimMemory(trimmed.memorySlices, overflow * 0.4);
    }
    if (overflow > 0 && trimmed.recentActions.length > 2) {
      trimmed.recentActions = trimmed.recentActions.slice(-2);
    }
    if (overflow > 0 && trimmed.userProfileSignals.length > 3) {
      trimmed.userProfileSignals = this.trimSignals(trimmed.userProfileSignals, 3);
    }

    trimmed.tokenBudgetUsed = this.estimateTokens(trimmed);
    return trimmed;
  }

  scoreRelevance(memory: MemorySlice, context: UnifiedContext): number {
    let score = memory.relevanceScore;
    // Boost if same domain
    if (memory.content.toLowerCase().includes(context.currentDomain)) score += 0.2;
    // Boost if recent
    const age = Date.now() - new Date(memory.timestamp).getTime();
    if (age < 3600000) score += 0.1; // within 1 hour
    // Penalize if privacy level conflicts
    if (memory.privacyLevel === 'restricted' && !memory.consentValid) score -= 0.5;
    return Math.max(0, Math.min(1, score));
  }

  filterNoise(context: UnifiedContext): UnifiedContext {
    // Remove duplicate signals
    const uniqueSignals = context.userProfileSignals.filter((signal, idx, arr) =>
      arr.findIndex(s => s.key === signal.key && s.type === signal.type) === idx
    );

    // Filter out low-confidence memory
    const validMemory = context.memorySlices.filter(m => m.relevanceScore > 0.3 && m.consentValid);

    // Filter out failed actions older than 24h
    const recentActions = context.recentActions.filter(a => {
      if (a.outcome === 'failure') {
        const age = Date.now() - new Date(a.timestamp).getTime();
        return age < 86400000;
      }
      return true;
    });

    return {
      ...context,
      userProfileSignals: uniqueSignals,
      memorySlices: validMemory,
      recentActions,
    };
  }

  recordAction(sessionId: string, action: RecentAction): void {
    const existing = this.actionHistory.get(sessionId) || [];
    existing.push(action);
    if (existing.length > 20) existing.shift(); // keep last 20
    this.actionHistory.set(sessionId, existing);
  }

  updateProfile(userId: string, signal: ProfileSignal): void {
    const existing = this.profileSignals.get(userId) || [];
    const idx = existing.findIndex(s => s.key === signal.key && s.type === signal.type);
    if (idx !== -1) existing[idx] = signal;
    else existing.push(signal);
    this.profileSignals.set(userId, existing);
  }

  private detectEnvironment(): EnvironmentState {
    const hour = new Date().getHours();
    const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

    return {
      networkStatus: typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline',
      deviceCapability: 'medium', // detect in production
      timeOfDay,
    };
  }

  private estimateTokens(context: UnifiedContext): number {
    // Rough estimate: 1 token ≈ 4 chars for English
    let chars = 0;
    context.memorySlices.forEach(m => chars += m.content.length);
    context.recentActions.forEach(a => chars += a.action.length);
    context.userProfileSignals.forEach(s => chars += s.key.length + JSON.stringify(s.value).length);
    return Math.ceil(chars / 4);
  }

  private trimMemory(slices: MemorySlice[], targetReduction: number): MemorySlice[] {
    // Sort by relevance, keep top N
    const sorted = [...slices].sort((a, b) => b.relevanceScore - a.relevanceScore);
    let currentTokens = 0;
    const kept: MemorySlice[] = [];
    for (const slice of sorted) {
      const sliceTokens = Math.ceil(slice.content.length / 4);
      if (currentTokens + sliceTokens <= targetReduction || kept.length < 2) {
        kept.push(slice);
        currentTokens += sliceTokens;
      }
    }
    return kept;
  }

  private trimSignals(signals: ProfileSignal[], maxCount: number): ProfileSignal[] {
    return signals
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxCount);
  }
}
