// ============================================================
// MEMORY INJECTION — Relevant slices only. No full dump ever.
// Relevance scoring, privacy filtering, consent validation.
// ============================================================

import { IMemoryInjection } from './interfaces';
import { UnifiedContext, MemorySlice } from './types';

export class MemoryInjection implements IMemoryInjection {
  private memoryStore: Map<string, MemorySlice[]> = new Map(); // userId -> slices
  private consentCache: Map<string, boolean> = new Map(); // sliceId -> consentValid

  async inject(context: UnifiedContext, domain: string, limit: number = 5): Promise<MemorySlice[]> {
    const allMemory = this.memoryStore.get(context.userId) || [];

    // Score relevance for each slice
    const scored = allMemory.map(m => ({
      slice: m,
      score: this.scoreRelevance(m, context),
    }));

    // Sort by relevance, filter by consent
    const relevant = scored
      .filter(s => s.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.slice);

    // Validate consent for each
    const consented: MemorySlice[] = [];
    for (const slice of relevant) {
      const valid = await this.validateConsent(slice, context.userId);
      if (valid) {
        consented.push({ ...slice, consentValid: true });
      }
    }

    // Privacy filter
    return this.filterByPrivacy(consented, true);
  }

  scoreRelevance(memory: MemorySlice, context: UnifiedContext): number {
    let score = memory.relevanceScore;

    // Domain match boost
    const domainKeywords: Record<string, string[]> = {
      health: ['doctor', 'hospital', 'prescription', 'medical', 'appointment'],
      wallet: ['balance', 'payment', 'transfer', 'money', 'wallet'],
      transport: ['ride', 'taxi', 'pickup', 'delivery', 'truck'],
      cash: ['points', 'redeem', 'reward', 'earn', 'convert'],
    };

    const keywords = domainKeywords[context.currentDomain] || [];
    if (keywords.some(kw => memory.content.toLowerCase().includes(kw))) {
      score += 0.25;
    }

    // Recency boost
    const age = Date.now() - new Date(memory.timestamp).getTime();
    if (age < 3600000) score += 0.15;      // < 1 hour
    else if (age < 86400000) score += 0.1;  // < 1 day
    else if (age < 604800000) score += 0.05; // < 1 week

    // Preference signals boost
    if (memory.type === 'preference') score += 0.1;

    // Semantic memory for general context
    if (memory.type === 'semantic' && context.currentDomain === 'general') score += 0.1;

    return Math.max(0, Math.min(1, score));
  }

  filterByPrivacy(memory: MemorySlice[], userConsent: boolean): MemorySlice[] {
    return memory.filter(m => {
      if (m.privacyLevel === 'public') return true;
      if (m.privacyLevel === 'sensitive' && userConsent) return true;
      if (m.privacyLevel === 'restricted' && userConsent && m.consentValid) return true;
      return false;
    });
  }

  async validateConsent(memory: MemorySlice, userId: string): Promise<boolean> {
    const cacheKey = `${userId}_${memory.id}`;
    const cached = this.consentCache.get(cacheKey);
    if (cached !== undefined) return cached;

    // In production: check against ASISConsentManager
    const valid = memory.consentValid; // simplified
    this.consentCache.set(cacheKey, valid);
    return valid;
  }

  // Integration point with ZIP 4 memory system
  loadFromMemorySystem(userId: string, slices: MemorySlice[]): void {
    const existing = this.memoryStore.get(userId) || [];
    this.memoryStore.set(userId, [...existing, ...slices]);
  }

  clearUserMemory(userId: string): void {
    this.memoryStore.delete(userId);
    // Clear consent cache for user
    for (const key of this.consentCache.keys()) {
      if (key.startsWith(`${userId}_`)) this.consentCache.delete(key);
    }
  }

  addSlice(userId: string, slice: MemorySlice): void {
    const existing = this.memoryStore.get(userId) || [];
    existing.push(slice);
    this.memoryStore.set(userId, existing);
  }
}
