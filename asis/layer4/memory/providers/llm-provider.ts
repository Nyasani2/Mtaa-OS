/**
 * ASIS Layer 4 — LLM Provider Abstraction
 * No hardcoded OpenAI — supports multiple providers
 */

import { ContextScope } from '../../types/memory.types';

export interface ILLMProvider {
  name: string;
  complete(prompt: string, options?: LLMOptions): Promise<string>;
  completeStream(prompt: string, options?: LLMOptions, onChunk?: (chunk: string) => void): Promise<string>;
  health(): Promise<{ available: boolean; latency: number }>;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  scope?: ContextScope;
  systemPrompt?: string;
  timeoutMs?: number;
}

export interface LLMProviderConfig {
  provider: 'openai' | 'anthropic' | 'cohere' | 'local' | 'custom';
  apiKey?: string;
  endpoint?: string;
  model?: string;
  timeoutMs?: number;
}

export function createLLMProvider(config: LLMProviderConfig): ILLMProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAILLMProvider(config);
    case 'anthropic':
      return new AnthropicLLMProvider(config);
    case 'cohere':
      return new CohereLLMProvider(config);
    case 'local':
      return new LocalLLMProvider(config);
    case 'custom':
      return new CustomLLMProvider(config);
    default:
      return new LocalLLMProvider(config);
  }
}

class OpenAILLMProvider implements ILLMProvider {
  name = 'openai';
  private config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  async complete(prompt: string, options: LLMOptions = {}): Promise<string> {
    const response = await fetch(this.config.endpoint || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o-mini',
        messages: [
          ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI completion failed: ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content;
  }

  async completeStream(prompt: string, options: LLMOptions = {}, onChunk?: (chunk: string) => void): Promise<string> {
    const response = await fetch(this.config.endpoint || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o-mini',
        messages: [
          ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500,
        stream: true,
      }),
    });

    const reader = response.body?.getReader();
    let fullText = '';

    if (reader && onChunk) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(l => l.trim());
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              fullText += content;
              onChunk(content);
            } catch {
              // Skip malformed chunks
            }
          }
        }
      }
    }

    return fullText;
  }

  async health(): Promise<{ available: boolean; latency: number }> {
    const start = Date.now();
    try {
      await this.complete('hi', { maxTokens: 1 });
      return { available: true, latency: Date.now() - start };
    } catch {
      return { available: false, latency: Date.now() - start };
    }
  }
}

class AnthropicLLMProvider implements ILLMProvider {
  name = 'anthropic';
  private config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  async complete(prompt: string, options: LLMOptions = {}): Promise<string> {
    const response = await fetch(this.config.endpoint || 'https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-haiku-20240307',
        max_tokens: options.maxTokens || 500,
        messages: [{ role: 'user', content: prompt }],
        system: options.systemPrompt,
        temperature: options.temperature || 0.7,
      }),
    });

    if (!response.ok) throw new Error(`Anthropic completion failed: ${response.status}`);
    const data = await response.json();
    return data.content[0].text;
  }

  async completeStream(prompt: string, options: LLMOptions = {}, onChunk?: (chunk: string) => void): Promise<string> {
    // Stream implementation similar to OpenAI
    const text = await this.complete(prompt, options);
    if (onChunk) onChunk(text);
    return text;
  }

  async health(): Promise<{ available: boolean; latency: number }> {
    const start = Date.now();
    try {
      await this.complete('hi', { maxTokens: 1 });
      return { available: true, latency: Date.now() - start };
    } catch {
      return { available: false, latency: Date.now() - start };
    }
  }
}

class CohereLLMProvider implements ILLMProvider {
  name = 'cohere';
  private config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  async complete(prompt: string, options: LLMOptions = {}): Promise<string> {
    const response = await fetch(this.config.endpoint || 'https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'command',
        prompt,
        max_tokens: options.maxTokens || 500,
        temperature: options.temperature || 0.7,
      }),
    });

    if (!response.ok) throw new Error(`Cohere completion failed: ${response.status}`);
    const data = await response.json();
    return data.generations[0].text;
  }

  async completeStream(prompt: string, options: LLMOptions = {}, onChunk?: (chunk: string) => void): Promise<string> {
    const text = await this.complete(prompt, options);
    if (onChunk) onChunk(text);
    return text;
  }

  async health(): Promise<{ available: boolean; latency: number }> {
    const start = Date.now();
    try {
      await this.complete('hi', { maxTokens: 1 });
      return { available: true, latency: Date.now() - start };
    } catch {
      return { available: false, latency: Date.now() - start };
    }
  }
}

class LocalLLMProvider implements ILLMProvider {
  name = 'local';
  private config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  async complete(prompt: string, options: LLMOptions = {}): Promise<string> {
    // Local LLM via WebLLM, llama.cpp, or similar
    // For MVP: return a placeholder that triggers offline mode
    throw new Error('Local LLM not configured. Set up WebLLM or llama.cpp runtime.');
  }

  async completeStream(prompt: string, options: LLMOptions = {}, onChunk?: (chunk: string) => void): Promise<string> {
    throw new Error('Local LLM not configured.');
  }

  async health(): Promise<{ available: boolean; latency: number }> {
    return { available: false, latency: 0 };
  }
}

class CustomLLMProvider implements ILLMProvider {
  name = 'custom';
  private config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  async complete(prompt: string, options: LLMOptions = {}): Promise<string> {
    const response = await fetch(this.config.endpoint!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, ...options }),
    });

    if (!response.ok) throw new Error(`Custom completion failed: ${response.status}`);
    const data = await response.json();
    return data.text || data.completion || data.response;
  }

  async completeStream(prompt: string, options: LLMOptions = {}, onChunk?: (chunk: string) => void): Promise<string> {
    const text = await this.complete(prompt, options);
    if (onChunk) onChunk(text);
    return text;
  }

  async health(): Promise<{ available: boolean; latency: number }> {
    const start = Date.now();
    try {
      await this.complete('hi', { maxTokens: 1 });
      return { available: true, latency: Date.now() - start };
    } catch {
      return { available: false, latency: Date.now() - start };
    }
  }
}
