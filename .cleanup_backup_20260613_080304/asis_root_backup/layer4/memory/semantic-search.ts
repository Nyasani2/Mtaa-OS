/**
 * ASIS Layer 4 — Semantic Search
 * Vector-based similarity search across memory layers
 */

import { SemanticSearchResult, ContextScope, MemoryQuery } from '../types';
import { MemoryEngine } from './memory-engine';
import { IEmbeddingProvider } from './providers/embedding-provider';
import { IVectorStoreProvider } from './providers/vector-store-provider';
import { MemoryLayer } from '../types/memory.types';
import { Text } from 'react-native';


export class SemanticSearch {
  private memoryEngine: MemoryEngine;
  private embeddingProvider: IEmbeddingProvider;
  private vectorStore: IVectorStoreProvider;

  constructor(
    memoryEngine: MemoryEngine,
    embeddingProvider: IEmbeddingProvider,
    vectorStore: IVectorStoreProvider
  ) {
    this.memoryEngine = memoryEngine;
    this.embeddingProvider = embeddingProvider;
    this.vectorStore = vectorStore;
  }

  /**
   * Search memory semantically
   */
  async search(
    query: string,
    scope?: ContextScope,
    topK: number = 10
  ): Promise<SemanticSearchResult[]> {
    // Generate query embedding
    const queryVector = await this.embeddingProvider.embed(query, scope || ContextScope.GLOBAL);

    // Search vector store
    const filter = scope ? { scope: scope.toString() } : undefined;
    const results = await this.vectorStore.query(queryVector, topK, filter);

    // Enrich with memory entries
    const enriched: SemanticSearchResult[] = [];
    for (const result of results) {
      const memoryEntry = await this.memoryEngine.get(
        MemoryLayer.SEMANTIC,
        (result.entry as any).metadata?.key || (result.entry as any).id,
        scope
      );

      if (memoryEntry) {
        enriched.push({
          entry: memoryEntry,
          score: result.score,
          matchedText: (result.entry as any).text,
        });
      }
    }

    return enriched;
  }

  /**
   * Index a memory entry for semantic search
   */
  async indexEntry(key: string, text: string, scope: ContextScope, metadata?: Record<string, unknown>): Promise<void> {
    const vector = await this.embeddingProvider.embed(text, scope);

    await this.vectorStore.upsert([{
      id: `semantic_${key}`,
      text,
      vector,
      metadata: { key, scope: scope.toString(), ...metadata },
      contextScope: scope,
      createdAt: new Date(),
    }]);
  }

  /**
   * Reindex all memories for a scope
   */
  async reindexScope(scope: ContextScope): Promise<number> {
    const memories = await this.memoryEngine.retrieve({
      contextScope: scope,
      limit: 1000,
    });

    const vectors = [];
    for (const mem of memories) {
      const text = `${mem.key}: ${JSON.stringify(mem.value)}`;
      const vector = await this.embeddingProvider.embed(text, scope);
      vectors.push({
        id: `semantic_${mem.id}`,
        text,
        vector,
        metadata: { key: mem.key, scope: scope.toString(), tags: mem.tags },
        contextScope: scope,
        createdAt: mem.createdAt,
      });
    }

    await this.vectorStore.upsert(vectors);
    return vectors.length;
  }

  /**
   * Health check
   */
  async health(): Promise<{ embedding: boolean; vectorStore: boolean; latency: number }> {
    const start = Date.now();
    const embedHealth = await this.embeddingProvider.health();
    const storeHealth = await this.vectorStore.health();

    return {
      embedding: embedHealth.available,
      vectorStore: storeHealth.available,
      latency: Date.now() - start,
    };
  }
}