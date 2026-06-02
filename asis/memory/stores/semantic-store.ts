/**
 * ASIS Layer 4 — Semantic Memory Store
 * Vector embeddings with provider-agnostic interface
 * Supports local fallback for offline operation
 */

import { MemoryEntry, MemoryQuery, ContextScope, EmbeddingVector, SemanticSearchResult } from '../../types/memory.types';
import { MemoryStore } from '../memory-engine';
import { IEmbeddingProvider } from '../providers/embedding-provider';

export class SemanticStore implements MemoryStore {
  private vectors: Map<string, EmbeddingVector> = new Map();
  private provider: IEmbeddingProvider;
  private maxVectors: number;
  private localDim: number = 384; // Lightweight local embedding dimension

  constructor(maxVectors: number, provider: IEmbeddingProvider) {
    this.maxVectors = maxVectors;
    this.provider = provider;
  }

  async set(entry: MemoryEntry): Promise<void> {
    // Generate embedding for the entry
    const text = `${entry.key}: ${JSON.stringify(entry.value)}`;
    const vector = await this.provider.embed(text, entry.contextScope);

    const embedding: EmbeddingVector = {
      id: entry.id,
      text,
      vector,
      metadata: {
        key: entry.key,
        layer: entry.layer,
        scope: entry.contextScope,
        tags: entry.tags,
      },
      contextScope: entry.contextScope,
      createdAt: entry.createdAt,
    };

    if (this.vectors.size >= this.maxVectors) {
      this.evictOldest();
    }

    this.vectors.set(entry.id, embedding);
  }

  async get(key: string, scope?: ContextScope): Promise<MemoryEntry | null> {
    // Semantic store doesn't support direct key lookup
    return null;
  }

  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    // Semantic search requires text query
    if (!query.key) return [];

    const queryVector = await this.provider.embed(query.key, query.contextScope as ContextScope || ContextScope.GLOBAL);
    const results: SemanticSearchResult[] = [];

    for (const vector of this.vectors.values()) {
      const score = this.cosineSimilarity(queryVector, vector.vector);
      if (score > (query.minConfidence || 0.7)) {
        results.push({ entry: vector, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, query.limit || 10).map(r => ({
      id: (r.entry as EmbeddingVector).id,
      layer: 'semantic' as any,
      key: (r.entry as EmbeddingVector).metadata.key as string,
      value: (r.entry as EmbeddingVector).metadata,
      priority: 3,
      contextScope: (r.entry as EmbeddingVector).contextScope,
      createdAt: (r.entry as EmbeddingVector).createdAt,
      updatedAt: (r.entry as EmbeddingVector).createdAt,
      source: { type: 'system' },
      confidence: r.score,
      tags: ((r.entry as EmbeddingVector).metadata.tags as string[]) || [],
      encrypted: false,
      version: 1,
    }));
  }

  async delete(key: string, scope?: ContextScope): Promise<void> {
    // Find by metadata key
    for (const [id, vector] of this.vectors) {
      if (vector.metadata.key === key && (!scope || vector.contextScope === scope)) {
        this.vectors.delete(id);
      }
    }
  }

  async deleteByScope(scopes: ContextScope[]): Promise<number> {
    let deleted = 0;
    for (const [id, vector] of this.vectors) {
      if (scopes.includes(vector.contextScope)) {
        this.vectors.delete(id);
        deleted++;
      }
    }
    return deleted;
  }

  async getStats(): Promise<{ count: number; bytes: number; oldest: Date; newest: Date }> {
    const all = Array.from(this.vectors.values());
    const bytes = all.reduce((sum, v) => sum + v.vector.length * 4 + v.text.length * 2, 0);

    return {
      count: all.length,
      bytes,
      oldest: all.length > 0 ? all.reduce((min, v) => v.createdAt < min ? v.createdAt : min, all[0].createdAt) : new Date(),
      newest: all.length > 0 ? all.reduce((max, v) => v.createdAt > max ? v.createdAt : max, all[0].createdAt) : new Date(),
    };
  }

  async export(scopes: ContextScope[]): Promise<MemoryEntry[]> {
    // Export as lightweight metadata, not full vectors
    return Array.from(this.vectors.values())
      .filter(v => scopes.includes(v.contextScope) || v.contextScope === ContextScope.GLOBAL)
      .map(v => ({
        id: v.id,
        layer: 'semantic' as any,
        key: v.metadata.key as string,
        value: { text: v.text, metadata: v.metadata },
        priority: 3,
        contextScope: v.contextScope,
        createdAt: v.createdAt,
        updatedAt: v.createdAt,
        source: { type: 'system' },
        confidence: 1,
        tags: (v.metadata.tags as string[]) || [],
        encrypted: false,
        version: 1,
      }));
  }

  async cleanup(): Promise<void> {
    // Semantic vectors don't expire, but we can deduplicate
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private evictOldest(): void {
    let oldest: { id: string; date: Date } | null = null;
    for (const [id, vector] of this.vectors) {
      if (!oldest || vector.createdAt < oldest.date) {
        oldest = { id, date: vector.createdAt };
      }
    }
    if (oldest) this.vectors.delete(oldest.id);
  }
}
