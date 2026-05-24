/**
 * ASIS Layer 4 — Vector Store Provider Abstraction
 * No hardcoded Pinecone — supports multiple backends
 */

import { EmbeddingVector, SemanticSearchResult } from '../../types/memory.types';

export interface IVectorStoreProvider {
  name: string;
  upsert(vectors: EmbeddingVector[]): Promise<void>;
  query(vector: number[], topK: number, filter?: Record<string, unknown>): Promise<SemanticSearchResult[]>;
  delete(ids: string[]): Promise<void>;
  health(): Promise<{ available: boolean; latency: number; count: number }>;
}

export interface VectorStoreConfig {
  provider: 'pinecone' | 'weaviate' | 'qdrant' | 'local' | 'custom';
  apiKey?: string;
  endpoint?: string;
  indexName?: string;
  dimension?: number;
  namespace?: string;
}

export function createVectorStoreProvider(config: VectorStoreConfig): IVectorStoreProvider {
  switch (config.provider) {
    case 'pinecone':
      return new PineconeVectorStore(config);
    case 'weaviate':
      return new WeaviateVectorStore(config);
    case 'qdrant':
      return new QdrantVectorStore(config);
    case 'local':
      return new LocalVectorStore(config);
    case 'custom':
      return new CustomVectorStore(config);
    default:
      return new LocalVectorStore(config);
  }
}

class PineconeVectorStore implements IVectorStoreProvider {
  name = 'pinecone';
  private config: VectorStoreConfig;

  constructor(config: VectorStoreConfig) {
    this.config = config;
  }

  async upsert(vectors: EmbeddingVector[]): Promise<void> {
    const response = await fetch(`${this.config.endpoint}/vectors/upsert`, {
      method: 'POST',
      headers: {
        'Api-Key': this.config.apiKey!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vectors: vectors.map(v => ({
          id: v.id,
          values: v.vector,
          metadata: v.metadata,
        })),
        namespace: this.config.namespace,
      }),
    });

    if (!response.ok) throw new Error(`Pinecone upsert failed: ${response.status}`);
  }

  async query(vector: number[], topK: number, filter?: Record<string, unknown>): Promise<SemanticSearchResult[]> {
    const response = await fetch(`${this.config.endpoint}/query`, {
      method: 'POST',
      headers: {
        'Api-Key': this.config.apiKey!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector,
        topK,
        filter,
        namespace: this.config.namespace,
        includeMetadata: true,
      }),
    });

    if (!response.ok) throw new Error(`Pinecone query failed: ${response.status}`);
    const data = await response.json();
    return data.matches.map((m: any) => ({
      entry: { id: m.id, vector: m.values, metadata: m.metadata } as EmbeddingVector,
      score: m.score,
    }));
  }

  async delete(ids: string[]): Promise<void> {
    const response = await fetch(`${this.config.endpoint}/vectors/delete`, {
      method: 'POST',
      headers: {
        'Api-Key': this.config.apiKey!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids, namespace: this.config.namespace }),
    });

    if (!response.ok) throw new Error(`Pinecone delete failed: ${response.status}`);
  }

  async health(): Promise<{ available: boolean; latency: number; count: number }> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.config.endpoint}/describe_index_stats`, {
        headers: { 'Api-Key': this.config.apiKey! },
      });
      const data = await response.json();
      return { available: true, latency: Date.now() - start, count: data.totalVectorCount || 0 };
    } catch {
      return { available: false, latency: Date.now() - start, count: 0 };
    }
  }
}

class WeaviateVectorStore implements IVectorStoreProvider {
  name = 'weaviate';
  private config: VectorStoreConfig;

  constructor(config: VectorStoreConfig) {
    this.config = config;
  }

  async upsert(vectors: EmbeddingVector[]): Promise<void> {
    // Weaviate batch import
    for (const v of vectors) {
      await fetch(`${this.config.endpoint}/v1/objects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          class: this.config.indexName,
          properties: { ...v.metadata, text: v.text },
          vector: v.vector,
        }),
      });
    }
  }

  async query(vector: number[], topK: number, filter?: Record<string, unknown>): Promise<SemanticSearchResult[]> {
    const response = await fetch(`${this.config.endpoint}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `{
          Get {
            ${this.config.indexName}(
              nearVector: { vector: [${vector.join(',')}] }
              limit: ${topK}
            ) {
              text
              _additional { id certainty }
            }
          }
        }`,
      }),
    });

    const data = await response.json();
    return data.data.Get[this.config.indexName!].map((m: any) => ({
      entry: { id: m._additional.id, metadata: { text: m.text } } as EmbeddingVector,
      score: m._additional.certainty,
    }));
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      await fetch(`${this.config.endpoint}/v1/objects/${this.config.indexName}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
      });
    }
  }

  async health(): Promise<{ available: boolean; latency: number; count: number }> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.config.endpoint}/v1/.well-known/live`);
      return { available: response.ok, latency: Date.now() - start, count: 0 };
    } catch {
      return { available: false, latency: Date.now() - start, count: 0 };
    }
  }
}

class QdrantVectorStore implements IVectorStoreProvider {
  name = 'qdrant';
  private config: VectorStoreConfig;

  constructor(config: VectorStoreConfig) {
    this.config = config;
  }

  async upsert(vectors: EmbeddingVector[]): Promise<void> {
    const response = await fetch(`${this.config.endpoint}/collections/${this.config.indexName}/points`, {
      method: 'PUT',
      headers: {
        'api-key': this.config.apiKey || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        points: vectors.map(v => ({
          id: v.id,
          vector: v.vector,
          payload: v.metadata,
        })),
      }),
    });

    if (!response.ok) throw new Error(`Qdrant upsert failed: ${response.status}`);
  }

  async query(vector: number[], topK: number, filter?: Record<string, unknown>): Promise<SemanticSearchResult[]> {
    const response = await fetch(`${this.config.endpoint}/collections/${this.config.indexName}/points/search`, {
      method: 'POST',
      headers: {
        'api-key': this.config.apiKey || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector,
        limit: topK,
        filter,
        with_payload: true,
      }),
    });

    if (!response.ok) throw new Error(`Qdrant query failed: ${response.status}`);
    const data = await response.json();
    return data.result.map((r: any) => ({
      entry: { id: r.id, metadata: r.payload } as EmbeddingVector,
      score: r.score,
    }));
  }

  async delete(ids: string[]): Promise<void> {
    const response = await fetch(`${this.config.endpoint}/collections/${this.config.indexName}/points/delete`, {
      method: 'POST',
      headers: {
        'api-key': this.config.apiKey || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ points: ids }),
    });

    if (!response.ok) throw new Error(`Qdrant delete failed: ${response.status}`);
  }

  async health(): Promise<{ available: boolean; latency: number; count: number }> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.config.endpoint}/collections/${this.config.indexName}`);
      const data = await response.json();
      return { available: true, latency: Date.now() - start, count: data.result?.points_count || 0 };
    } catch {
      return { available: false, latency: Date.now() - start, count: 0 };
    }
  }
}

class LocalVectorStore implements IVectorStoreProvider {
  name = 'local';
  private vectors: Map<string, EmbeddingVector> = new Map();
  private config: VectorStoreConfig;

  constructor(config: VectorStoreConfig) {
    this.config = config;
  }

  async upsert(vectors: EmbeddingVector[]): Promise<void> {
    for (const v of vectors) {
      this.vectors.set(v.id, v);
    }
  }

  async query(vector: number[], topK: number, filter?: Record<string, unknown>): Promise<SemanticSearchResult[]> {
    const results: SemanticSearchResult[] = [];

    for (const v of this.vectors.values()) {
      if (filter && !this.matchesFilter(v, filter)) continue;
      const score = this.cosineSimilarity(vector, v.vector);
      results.push({ entry: v, score });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.vectors.delete(id);
    }
  }

  async health(): Promise<{ available: boolean; latency: number; count: number }> {
    return { available: true, latency: 0, count: this.vectors.size };
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

  private matchesFilter(vector: EmbeddingVector, filter: Record<string, unknown>): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (vector.metadata[key] !== value) return false;
    }
    return true;
  }
}

class CustomVectorStore implements IVectorStoreProvider {
  name = 'custom';
  private config: VectorStoreConfig;

  constructor(config: VectorStoreConfig) {
    this.config = config;
  }

  async upsert(vectors: EmbeddingVector[]): Promise<void> {
    const response = await fetch(`${this.config.endpoint}/upsert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vectors }),
    });

    if (!response.ok) throw new Error(`Custom upsert failed: ${response.status}`);
  }

  async query(vector: number[], topK: number, filter?: Record<string, unknown>): Promise<SemanticSearchResult[]> {
    const response = await fetch(`${this.config.endpoint}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vector, topK, filter }),
    });

    if (!response.ok) throw new Error(`Custom query failed: ${response.status}`);
    return await response.json();
  }

  async delete(ids: string[]): Promise<void> {
    const response = await fetch(`${this.config.endpoint}/delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) throw new Error(`Custom delete failed: ${response.status}`);
  }

  async health(): Promise<{ available: boolean; latency: number; count: number }> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.config.endpoint}/health`);
      const data = await response.json();
      return { available: true, latency: Date.now() - start, count: data.count || 0 };
    } catch {
      return { available: false, latency: Date.now() - start, count: 0 };
    }
  }
}
