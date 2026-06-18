import Constants from 'expo-constants';

// ASIS v3 — Groq API Client
const GROQ_API_KEY = Constants.expoConfig?.extra?.groqApiKey ||
  process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

const MODELS = {
  fast: 'llama-3.1-8b-instant',
  smart: 'llama-3.3-70b-versatile',
  vision: 'llama-3.2-11b-vision-preview',
};

const PRICING = {
  'llama-3.1-8b-instant': { input: 0.05 / 1e6, output: 0.08 / 1e6 },
  'llama-3.3-70b-versatile': { input: 0.59 / 1e6, output: 0.79 / 1e6 },
  'llama-3.2-11b-vision-preview': { input: 0.18 / 1e6, output: 0.18 / 1e6 },
};

class GroqClient {
  constructor() {
    this.apiKey = GROQ_API_KEY;
    this.requestCount = 0;
    this.lastReset = Date.now();
  }

  isConfigured() {
    return this.apiKey.length > 0 && this.apiKey.startsWith('gsk_');
  }

  canRequest() {
    const now = Date.now();
    if (now - this.lastReset > 60000) {
      this.requestCount = 0;
      this.lastReset = now;
    }
    return this.requestCount < 30;
  }

  async chat(messages, options) {
    options = options || {};
    if (!this.isConfigured()) {
      return { text: '', cost: { tokens: 0, costUsd: 0, model: '' }, error: 'Groq API key not configured' };
    }

    if (!this.canRequest()) {
      return { text: '', cost: { tokens: 0, costUsd: 0, model: '' }, error: 'Groq rate limit: 30 req/min exceeded. Try again in 60 seconds.' };
    }

    const modelName = MODELS[options.model || 'fast'];
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;
    const maxTokens = options.maxTokens !== undefined ? options.maxTokens : 1024;

    try {
      const response = await fetch(GROQ_BASE_URL + '/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
      });

      this.requestCount++;

      if (!response.ok) {
        const errorText = await response.text();
        return { text: '', cost: { tokens: 0, costUsd: 0, model: modelName }, error: 'Groq HTTP ' + response.status + ': ' + errorText };
      }

      const data = await response.json();
      const text = data.choices[0]?.message?.content || '';
      const tokens = data.usage?.total_tokens || 0;

      const pricing = PRICING[modelName] || { input: 0, output: 0 };
      const costUsd = (data.usage?.prompt_tokens || 0) * pricing.input +
                      (data.usage?.completion_tokens || 0) * pricing.output;

      return {
        text: text,
        cost: { tokens: tokens, costUsd: costUsd, model: modelName },
      };
    } catch (err) {
      return { text: '', cost: { tokens: 0, costUsd: 0, model: modelName }, error: err.message };
    }
  }

  async healthCheck() {
    if (!this.isConfigured()) {
      return { ok: false, latency: 0, error: 'No API key' };
    }

    const start = Date.now();
    const result = await this.chat(
      [{ role: 'user', content: 'Say "Groq is ready" in 3 words.' }],
      { maxTokens: 10, temperature: 0 }
    );
    const latency = Date.now() - start;

    if (result.error) {
      return { ok: false, latency: latency, error: result.error };
    }
    return { ok: true, latency: latency };
  }
}

export const groqClient = new GroqClient();
export { MODELS, PRICING };
