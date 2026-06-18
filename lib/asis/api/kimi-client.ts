// Kimi API Client for ASIS v3
// Connects to Moonshot AI (Kimi) for LLM capabilities

const KIMI_API_BASE = 'https://api.moonshot.cn/v1';
const KIMI_API_KEY = process.env.EXPO_PUBLIC_KIMI_API_KEY || '';

export interface KimiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface KimiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: KimiMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface KimiRequestOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

class KimiClient {
  private apiKey: string;
  private baseUrl: string;
  private requestCount = 0;
  private totalTokens = 0;
  private totalCost = 0;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || KIMI_API_KEY;
    this.baseUrl = KIMI_API_BASE;
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('sk-');
  }

  async chat(
    messages: KimiMessage[],
    options: KimiRequestOptions = {}
  ): Promise<KimiResponse> {
    if (!this.isAvailable()) {
      throw new Error('Kimi API key not configured. Set EXPO_PUBLIC_KIMI_API_KEY in .env');
    }

    const requestBody = {
      model: options.model || 'moonshot-v1-8k',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2048,
      top_p: options.top_p ?? 1,
      stream: options.stream ?? false,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Kimi API error: ${response.status} ${response.statusText} — ${errorData.error?.message || 'Unknown error'}`
        );
      }

      const data: KimiResponse = await response.json();

      // Track usage
      this.requestCount++;
      this.totalTokens += data.usage?.total_tokens || 0;
      this.totalCost += this.estimateCost(data.usage?.total_tokens || 0);

      return data;
    } catch (error) {
      console.error('Kimi API call failed:', error);
      throw error;
    }
  }

  async simpleChat(userMessage: string, systemPrompt?: string): Promise<string> {
    const messages: KimiMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: userMessage });

    const response = await this.chat(messages);
    return response.choices[0]?.message?.content || '';
  }

  private estimateCost(tokens: number): number {
    // Kimi pricing (approximate, check platform.moonshot.cn for current rates)
    // moonshot-v1-8k: ~0.012 CNY per 1K tokens
    const costPer1K = 0.012;
    return (tokens / 1000) * costPer1K;
  }

  getStats() {
    return {
      available: this.isAvailable(),
      requests: this.requestCount,
      totalTokens: this.totalTokens,
      totalCost: this.totalCost.toFixed(4),
    };
  }
}

export const kimiClient = new KimiClient();
export default KimiClient;
