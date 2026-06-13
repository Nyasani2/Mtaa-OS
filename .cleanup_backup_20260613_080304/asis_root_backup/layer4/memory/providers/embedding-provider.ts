/**
 * ASIS Layer 4 — Embedding Provider Abstraction
 * Provider-agnostic embeddings with local fallback
 * Supports: OpenAI, Cohere, local ONNX, or custom
 */

import { ContextScope } from '../../types/memory.types';

export interface IEmbeddingProvider {
  name: string;
  dimension: number;
  embed(text: string, scope: ContextScope): Promise<number[]>;
  embedBatch(texts: string[], scope: ContextScope): Promise<number[][]>;
  health(): Promise<{ available: boolean; latency: number }>;
}

export interface EmbeddingProviderConfig {
  provider: 'openai' | 'cohere' | 'local' | 'custom';
  apiKey?: string;
  endpoint?: string;
  model?: string;
  dimension?: number;
  timeoutMs?: number;
  fallbackToLocal: boolean;
}

/**
 * Factory — creates provider without hardcoding
 */
export function createEmbeddingProvider(config: EmbeddingProviderConfig): IEmbeddingProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAIEmbeddingProvider(config);
    case 'cohere':
      return new CohereEmbeddingProvider(config);
    case 'local':
      return new LocalEmbeddingProvider(config);
    case 'custom':
      return new CustomEmbeddingProvider(config);
    default:
      return new LocalEmbeddingProvider(config);
  }
}

/**
 * OpenAI Provider
 */
class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  name = 'openai';
  dimension = 1536;
  private config: EmbeddingProviderConfig;

  constructor(config: EmbeddingProviderConfig) {
    this.config = config;
  }

  async embed(text: string, scope: ContextScope): Promise<number[]> {
    const response = await fetch(this.config.endpoint || 'https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI embed failed: ${response.status}`);
    const data = await response.json();
    return data.data[0].embedding;
  }

  async embedBatch(texts: string[], scope: ContextScope): Promise<number[][]> {
    const response = await fetch(this.config.endpoint || 'https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'text-embedding-3-small',
        input: texts,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI batch embed failed: ${response.status}`);
    const data = await response.json();
    return data.data.map((d: any) => d.embedding);
  }

  async health(): Promise<{ available: boolean; latency: number }> {
    const start = Date.now();
    try {
      await this.embed('test', ContextScope.GLOBAL);
      return { available: true, latency: Date.now() - start };
    } catch {
      return { available: false, latency: Date.now() - start };
    }
  }
}

/**
 * Cohere Provider
 */
class CohereEmbeddingProvider implements IEmbeddingProvider {
  name = 'cohere';
  dimension = 1024;
  private config: EmbeddingProviderConfig;

  constructor(config: EmbeddingProviderConfig) {
    this.config = config;
  }

  async embed(text: string, scope: ContextScope): Promise<number[]> {
    const response = await fetch(this.config.endpoint || 'https://api.cohere.ai/v1/embed', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'embed-english-v3.0',
        texts: [text],
        input_type: 'search_document',
      }),
    });

    if (!response.ok) throw new Error(`Cohere embed failed: ${response.status}`);
    const data = await response.json();
    return data.embeddings[0];
  }

  async embedBatch(texts: string[], scope: ContextScope): Promise<number[][]> {
    const response = await fetch(this.config.endpoint || 'https://api.cohere.ai/v1/embed', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'embed-english-v3.0',
        texts,
        input_type: 'search_document',
      }),
    });

    if (!response.ok) throw new Error(`Cohere batch embed failed: ${response.status}`);
    const data = await response.json();
    return data.embeddings;
  }

  async health(): Promise<{ available: boolean; latency: number }> {
    const start = Date.now();
    try {
      await this.embed('test', ContextScope.GLOBAL);
      return { available: true, latency: Date.now() - start };
    } catch {
      return { available: false, latency: Date.now() - start };
    }
  }
}

/**
 * Local Provider — lightweight, offline-capable
 * Uses simple hash-based embeddings for MVP
 * Replace with ONNX runtime for production
 */
class LocalEmbeddingProvider implements IEmbeddingProvider {
  name = 'local';
  dimension = 384;
  private config: EmbeddingProviderConfig;

  constructor(config: EmbeddingProviderConfig) {
    this.config = config;
    if (config.dimension) this.dimension = config.dimension;
  }

  async embed(text: string, scope: ContextScope): Promise<number[]> {
    // Deterministic hash-based embedding for offline operation
    // In production, load a small ONNX model (e.g., all-MiniLM-L6-v2 quantized)
    return this.hashEmbed(text);
  }

  async embedBatch(texts: string[], scope: ContextScope): Promise<number[][]> {
    return texts.map(t => this.hashEmbed(t));
  }

  async health(): Promise<{ available: boolean; latency: number }> {
    const start = Date.now();
    this.hashEmbed('test');
    return { available: true, latency: Date.now() - start };
  }

  private hashEmbed(text: string): number[] {
    // Simple but deterministic embedding for offline fallback
    // Uses multiple hash functions to create vector
    const vector = new Array(this.dimension).fill(0);
    const seeds = [0x811c9dc5, 0xcbf29ce4, 0x9e3779b9, 0x6c078965];

    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      for (let s = 0; s < seeds.length; s++) {
        seeds[s] = ((seeds[s] ^ char) * 0x01000193) >>> 0;
        const idx = (seeds[s] % this.dimension);
        vector[idx] += (seeds[s] % 1000) / 1000;
      }
    }

    // Normalize
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return norm > 0 ? vector.map(v => v / norm) : vector;
  }
}

/**
 * Custom Provider — user-defined endpoint
 */
class CustomEmbeddingProvider implements IEmbeddingProvider {
  name = 'custom';
  dimension = 768;
  private config: EmbeddingProviderConfig;

  constructor(config: EmbeddingProviderConfig) {
    this.config = config;
    if (config.dimension) this.dimension = config.dimension;
  }

  async embed(text: string, scope: ContextScope): Promise<number[]> {
    const response = await fetch(this.config.endpoint!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, scope }),
    });

    if (!response.ok) throw new Error(`Custom embed failed: ${response.status}`);
    const data = await response.json();
    return data.embedding;
  }

  async embedBatch(texts: string[], scope: ContextScope): Promise<number[][]> {
    const response = await fetch(this.config.endpoint!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ texts, scope }),
    });

    if (!response.ok) throw new Error(`Custom batch embed failed: ${response.status}`);
    const data = await response.json();
    return data.embeddings;
  }

  async health(): Promise<{ available: boolean; latency: number }> {
    const start = Date.now();
    try {
      await this.embed('test', ContextScope.GLOBAL);
      return { available: true, latency: Date.now() - start };
    } catch {
      return { available: false, latency: Date.now() - start };
    }
  }
}
