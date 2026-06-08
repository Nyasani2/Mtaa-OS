// ASIS v1 - Edge Function: asis-proxy
// Single secure backend for all AI calls
// Handles: auth, rate limiting, provider routing, context injection, streaming, safety

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Provider configurations (loaded from Supabase secrets)
const PROVIDERS = {
  kimi: {
    baseURL: 'https://api.moonshot.cn/v1',
    model: 'kimi-latest',
    headers: (key: string) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
  },
  openai: {
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    headers: (key: string) => ({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
  },
  claude: {
    baseURL: 'https://api.anthropic.com/v1',
    model: 'claude-3-sonnet-20240229',
    headers: (key: string) => ({
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    }),
  },
};

// Rate limiting: 50 requests/minute per user
const RATE_LIMIT = 50;
const RATE_WINDOW = 60; // seconds

// Cost tracking per user (daily)
const DAILY_COST_LIMIT = 5.0; // USD equivalent

interface AsisRequest {
  message: string;
  context: {
    userId: string;
    userName: string;
    language: string;
    region: string;
    currentApp: string;
    sessionId: string;
  };
  domain: string;
  history: Array<{
    role: 'user' | 'asis' | 'system';
    content: string;
    timestamp: string;
  }>;
  systemPrompt: string;
  stream?: boolean;
}

interface AsisResponse {
  message: string;
  actions?: Array<{
    type: string;
    target: string;
    description: string;
    requiresConfirmation: boolean;
    payload?: Record<string, any>;
  }>;
  insights?: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
    data?: Record<string, any>;
  }>;
  confidence: number;
  model: string;
  provider: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
}

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // 1. Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 2. Parse request
    const body: AsisRequest = await req.json();
    const { message, context, domain, systemPrompt, stream = false } = body;
    const userId = context.userId;

    // 3. Rate limit check
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const { data: rateData, error: rateError } = await supabase
      .from('asis_rate_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (rateError && rateError.code !== 'PGRST116') {
      throw rateError;
    }

    const now = Math.floor(Date.now() / 1000);
    const windowStart = Math.floor(now / RATE_WINDOW) * RATE_WINDOW;

    if (rateData && rateData.window_start === windowStart && rateData.count >= RATE_LIMIT) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: RATE_WINDOW - (now - windowStart),
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Retry-After': String(RATE_WINDOW - (now - windowStart)),
        },
      });
    }

    // 4. Cost limit check
    const { data: costData } = await supabase
      .from('asis_usage')
      .select('cost')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 86400000).toISOString())
      .maybeSingle();

    const dailyCost = costData?.cost || 0;
    if (dailyCost >= DAILY_COST_LIMIT) {
      return new Response(JSON.stringify({
        error: 'Daily cost limit exceeded',
        limit: DAILY_COST_LIMIT,
        current: dailyCost,
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 5. Fetch user context from MTAA tables
    const enrichedContext = await enrichContext(supabase, userId, domain, context);

    // 6. Build full prompt with context injection
    const fullPrompt = buildFullPrompt(systemPrompt, enrichedContext, body.history);

    // 7. Select provider (Kimi primary, fallback to OpenAI/Claude)
    const provider = await selectProvider(supabase);
    const providerConfig = PROVIDERS[provider as keyof typeof PROVIDERS];
    const apiKey = getProviderKey(provider);

    if (!providerConfig || !apiKey) {
      return new Response(JSON.stringify({ error: 'AI provider unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 8. Call AI provider
    const aiResponse = await callAIProvider(provider, providerConfig, apiKey, fullPrompt, stream);

    // 9. Parse and validate response
    const parsedResponse = parseAIResponse(aiResponse, provider);

    // 10. Update rate limit
    await updateRateLimit(supabase, userId, windowStart, rateData);

    // 11. Log usage
    await logUsage(supabase, userId, domain, parsedResponse.usage, provider);

    // 12. Store in session history
    await storeSession(supabase, userId, context.sessionId, message, parsedResponse);

    // 13. Return response
    return new Response(JSON.stringify(parsedResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('ASIS proxy error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});

/**
 * Enrich context with MTAA data
 */
async function enrichContext(supabase: any, userId: string, domain: string, baseContext: any) {
  const enriched = { ...baseContext };

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, kyc_status, preferred_language, region')
    .eq('id', userId)
    .single();

  if (profile) {
    enriched.profile = profile;
  }

  // Fetch wallet data if domain is wallet or wallet-related
  if (domain === 'wallet' || ['marketplace', 'appstore', 'jobs', 'transport'].includes(domain)) {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance, currency, wallet_id, fraud_score, monthly_spend, monthly_income, savings_goal')
      .eq('user_id', userId)
      .single();

    if (wallet) {
      enriched.wallet = wallet;

      // Recent transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, type, amount, currency, counterparty, status, created_at, category')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      enriched.wallet.recentTransactions = transactions || [];

      // Payment methods
      const { data: methods } = await supabase
        .from('payment_methods')
        .select('id, type, provider, last4, is_default, status')
        .eq('user_id', userId)
        .eq('status', 'active');

      enriched.wallet.paymentMethods = methods || [];
    }
  }

  // Fetch community context
  const { data: communities } = await supabase
    .from('user_communities')
    .select('community_id, communities(name, region)')
    .eq('user_id', userId);

  if (communities && communities.length > 0) {
    enriched.communities = communities.map((c: any) => ({
      id: c.community_id,
      name: c.communities?.name,
      region: c.communities?.region,
    }));
  }

  return enriched;
}

/**
 * Build full prompt with context
 */
function buildFullPrompt(
  systemPrompt: string,
  context: any,
  history: Array<{ role: string; content: string }>
) {
  const messages = [
    { role: 'system', content: systemPrompt },
  ];

  // Add context as system message
  const contextStr = JSON.stringify(context, null, 2);
  messages.push({
    role: 'system',
    content: `Current MTAA context: ${contextStr}`,
  });

  // Add history
  for (const h of history.slice(-10)) {
    messages.push({
      role: h.role === 'asis' ? 'assistant' : h.role,
      content: h.content,
    });
  }

  return messages;
}

/**
 * Select AI provider with fallback logic
 */
async function selectProvider(supabase: any): Promise<string> {
  // Check provider health from asis_provider_status table
  const { data: providers } = await supabase
    .from('asis_provider_status')
    .select('provider, status, latency_ms')
    .eq('status', 'healthy')
    .order('latency_ms', { ascending: true });

  if (providers && providers.length > 0) {
    return providers[0].provider;
  }

  // Default to kimi
  return 'kimi';
}

/**
 * Get provider API key from environment
 */
function getProviderKey(provider: string): string | undefined {
  const envMap: Record<string, string> = {
    kimi: 'KIMI_API_KEY',
    openai: 'OPENAI_API_KEY',
    claude: 'ANTHROPIC_API_KEY',
  };

  return Deno.env.get(envMap[provider]);
}

/**
 * Call AI provider
 */
async function callAIProvider(
  provider: string,
  config: any,
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  stream: boolean
): Promise<any> {
  const url = `${config.baseURL}/chat/completions`;

  const body = {
    model: config.model,
    messages,
    temperature: 0.7,
    max_tokens: 2000,
    stream,
    response_format: { type: 'json_object' },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: config.headers(apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI provider error (${provider}): ${error}`);
  }

  return await response.json();
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(aiResponse: any, provider: string): AsisResponse {
  const choice = aiResponse.choices?.[0];
  const content = choice?.message?.content || choice?.text || '{}';

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    // If not valid JSON, wrap in message field
    parsed = { message: content };
  }

  const usage = aiResponse.usage || {};

  // Calculate cost (approximate)
  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || promptTokens + completionTokens;

  // Kimi pricing: ~$0.60 per 1M tokens (input + output)
  const cost = (totalTokens / 1000000) * 0.60;

  return {
    message: parsed.message || 'I apologize, but I could not process your request properly.',
    actions: parsed.actions || [],
    insights: parsed.insights || [],
    confidence: parsed.confidence || 0.5,
    model: aiResponse.model || 'unknown',
    provider,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
    },
  };
}

/**
 * Update rate limit counter
 */
async function updateRateLimit(supabase: any, userId: string, windowStart: number, existing: any) {
  if (existing && existing.window_start === windowStart) {
    await supabase
      .from('asis_rate_limits')
      .update({ count: existing.count + 1, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('asis_rate_limits')
      .upsert({
        user_id: userId,
        window_start: windowStart,
        count: 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
  }
}

/**
 * Log usage for billing and analytics
 */
async function logUsage(
  supabase: any,
  userId: string,
  domain: string,
  usage: AsisResponse['usage'],
  provider: string
) {
  await supabase.from('asis_usage').insert({
    user_id: userId,
    domain,
    provider,
    prompt_tokens: usage.promptTokens,
    completion_tokens: usage.completionTokens,
    total_tokens: usage.totalTokens,
    cost: usage.cost,
    created_at: new Date().toISOString(),
  });
}

/**
 * Store session interaction
 */
async function storeSession(
  supabase: any,
  userId: string,
  sessionId: string,
  message: string,
  response: AsisResponse
) {
  await supabase.from('asis_sessions').insert({
    user_id: userId,
    session_id: sessionId,
    role: 'user',
    content: message,
    domain: response.domain || 'general',
    created_at: new Date().toISOString(),
  });

  await supabase.from('asis_sessions').insert({
    user_id: userId,
    session_id: sessionId,
    role: 'asis',
    content: response.message,
    domain: response.domain || 'general',
    metadata: {
      actions: response.actions,
      insights: response.insights,
      confidence: response.confidence,
      model: response.model,
      provider: response.provider,
    },
    created_at: new Date().toISOString(),
  });
}
