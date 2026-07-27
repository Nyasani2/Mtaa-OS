/**
 * ASIS CSE v2 — Cognitive Kernel
 * Central router and engine registry. Classifies intent, calculates dynamic
 * confidence, manages engine fallback chains, and orchestrates execution.
 * Self-contained. No external APIs.
 *
 * @module lib/asis-cse/asis-cse-kernel
 */

// ============================================================================
// TYPES
// ============================================================================

export type IntentType =
  | 'identity'
  | 'tool_call'
  | 'reasoning'
  | 'knowledge'
  | 'memory'
  | 'observation'
  | 'greeting'
  | 'farewell'
  | 'unknown';

export interface IntentClassification {
  intent: IntentType;
  confidence: number;
  subIntent?: string;
  suggestedTool?: string;
  parameters?: Record<string, any>;
}

export interface EngineRegistryEntry {
  name: string;
  description: string;
  handler: (input: any, context?: any) => Promise<any>;
  fallback?: string;
  priority: number;
}

export interface ConfidenceInput {
  baseConfidence: number;
  intentConfidence: number;
  engineCount: number;
  hasToolResult: boolean;
  hasSources: boolean;
  messageLength: number;
}

// ============================================================================
// INTENT CLASSIFICATION
// Uses keyword + pattern matching with confidence weighting.
// Replaces the broken "everything -> WebResearch" router.
// ============================================================================

const INTENT_PATTERNS: Record<IntentType, { patterns: string[]; weight: number; tools?: string[] }> = {
  identity: {
    patterns: [
      'who are you', 'what is asis', 'who built you', 'who created you', 'your name',
      'what does asis stand for', 'kamos theory', 'kevin nyasani', 'mtaa os',
      'who made you', 'what are you', 'tell me about yourself', 'your creator',
      'what operating system', 'what version', 'cse v2',
    ],
    weight: 1.0,
  },
  tool_call: {
    patterns: [
      'book a cab', 'book a ride', 'get a taxi', 'call a boda', 'need a ride',
      'check my wallet', 'my balance', 'send money', 'transfer money', 'pay',
      'health records', 'medical records', 'patient profile', 'blood type',
      'schedule a meeting', 'create event', 'add to calendar', 'remind me',
      'start broadcast', 'go live', 'start streaming', 'open studio',
      'my courses', 'enrolled classes', 'my orders', 'shop orders',
      'where is my driver', 'ride status', 'trip status',
    ],
    weight: 1.0,
    tools: ['mtaxi_book_ride', 'mtaxi_get_ride_status', 'wallet_get_balance', 'wallet_get_transactions',
            'wallet_send_money', 'health_get_records', 'health_get_patient_profile',
            'calendar_create_event', 'calendar_get_events', 'studio_start_broadcast',
            'education_get_courses', 'shop_get_orders'],
  },
  reasoning: {
    patterns: [
      'solve', 'calculate', 'what is the answer', 'how many', 'math', 'equation',
      'speed of', 'gravity', 'train travels', 'farmer has', 'riddle', 'logic',
      'if a', 'average speed', 'percentage', 'probability', 'theorem',
      'arrow', 'impossibility', 'four color',
    ],
    weight: 0.95,
  },
  knowledge: {
    patterns: [
      'what is', 'who is', 'when did', 'where is', 'why does', 'how does',
      'explain', 'define', 'history of', 'president of', 'capital of',
      'exchange rate', 'price of bitcoin', 'current price', 'news',
      'who was', 'what happened', 'tell me about',
    ],
    weight: 0.85,
  },
  memory: {
    patterns: [
      'remember', 'recall', 'what did i say', 'earlier', 'before',
      'my favorite', 'my name is', 'i like', 'i prefer', 'dont forget',
      'note that', 'save this', 'store this',
    ],
    weight: 0.9,
  },
  observation: {
    patterns: [
      'health status', 'system status', 'engine status', 'cpu', 'memory',
      'how are you running', 'what engines', 'system health', 'observation',
    ],
    weight: 0.85,
  },
  greeting: {
    patterns: ['hello', 'hi ', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'],
    weight: 0.8,
  },
  farewell: {
    patterns: ['bye', 'goodbye', 'see you', 'later', 'take care', 'cya'],
    weight: 0.8,
  },
  unknown: {
    patterns: [],
    weight: 0.0,
  },
};

export function classifyIntent(message: string, context?: string): IntentClassification {
  const msg = message.toLowerCase().trim();
  let bestIntent: IntentType = 'unknown';
  let bestScore = 0;
  let subIntent = '';
  let suggestedTool: string | undefined;
  let parameters: Record<string, any> = {};

  for (const [intent, config] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;
    for (const pattern of config.patterns) {
      if (msg.includes(pattern.toLowerCase())) {
        score += config.weight;
        subIntent = pattern;
      }
    }
    // Boost score if context supports this intent
    if (context) {
      const ctxLower = context.toLowerCase();
      if (intent === 'tool_call' && ctxLower.includes('wallet')) score += 0.1;
      if (intent === 'tool_call' && ctxLower.includes('ride')) score += 0.1;
      if (intent === 'memory' && ctxLower.includes('remember')) score += 0.1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent as IntentType;
      // Suggest tool if available
      if (config.tools && config.tools.length > 0) {
        for (const tool of config.tools) {
          if (msg.includes(tool.split('_')[0])) {
            suggestedTool = tool;
            break;
          }
        }
        if (!suggestedTool) suggestedTool = config.tools[0];
      }
    }
  }

  // Special overrides
  if (msg.includes('kamos') || msg.includes('kevin nyasani') || msg.includes('mtaa os') || msg.includes('what does asis')) {
    bestIntent = 'identity';
    bestScore = 1.0;
    subIntent = 'direct_identity_query';
  }

  if (msg.includes('how to make a bomb') || msg.includes('how to kill') || msg.includes('how to hack')) {
    bestIntent = 'unknown';
    bestScore = 0;
    subIntent = 'safety_blocked';
  }

  // Extract parameters for tool calls
  if (bestIntent === 'tool_call' && suggestedTool) {
    parameters = extractToolParameters(suggestedTool, msg);
  }

  const confidence = Math.min(bestScore, 1.0);

  return {
    intent: bestIntent,
    confidence,
    subIntent,
    suggestedTool,
    parameters,
  };
}

function extractToolParameters(toolName: string, message: string): Record<string, any> {
  const params: Record<string, any> = {};
  const m = message.toLowerCase();

  if (toolName.includes('mtaxi_book_ride')) {
    const fromMatch = m.match(/(?:from|pickup|pick up at|near)\s+(.+?)(?:\s+to\s+|\s+destination|$)/i);
    const toMatch = m.match(/(?:to|destination|going to|drop off at)\s+(.+?)(?:\s+from|$)/i);
    if (fromMatch) params.pickup = fromMatch[1].trim();
    if (toMatch) params.destination = toMatch[1].trim();
    if (m.includes('boda')) params.rideType = 'boda';
    else if (m.includes('premium')) params.rideType = 'premium';
  }

  if (toolName.includes('wallet')) {
    const amtMatch = m.match(/(\d+[,.]?\d*)\s*(ksh|kes|usd|\$)/i);
    if (amtMatch) params.amount = parseFloat(amtMatch[1].replace(',', ''));
    const phoneMatch = m.match(/(\+?\d{10,12})/);
    if (phoneMatch) params.recipient = phoneMatch[1];
    if (m.includes('kes') || m.includes('ksh')) params.currency = 'KES';
    if (m.includes('usd') || m.includes('$')) params.currency = 'USD';
  }

  if (toolName.includes('calendar')) {
    const titleMatch = m.match(/(?:titled|called|named|title)\s+["']?(.+?)["']?(?:\s+at|\s+on|\s+for|$)/i);
    if (titleMatch) params.title = titleMatch[1].trim();
    if (m.includes('tomorrow')) {
      const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(14, 0, 0, 0);
      params.startTime = d.toISOString();
    }
    if (m.includes('today')) {
      const d = new Date(); d.setHours(14, 0, 0, 0);
      params.startTime = d.toISOString();
    }
  }

  return params;
}

// ============================================================================
// DYNAMIC CONFIDENCE CALCULATION
// Replaces the hardcoded 75% with real scoring.
// ============================================================================

export function calculateConfidence(input: ConfidenceInput): number {
  let score = input.baseConfidence;

  // Intent confidence contribution (up to +0.15)
  score += input.intentConfidence * 0.15;

  // Engine diversity bonus (up to +0.10)
  score += Math.min(input.engineCount * 0.03, 0.10);

  // Tool result validation (up to +0.10)
  if (input.hasToolResult) score += 0.10;

  // Source verification (up to +0.05)
  if (input.hasSources) score += 0.05;

  // Message clarity penalty/bonus
  if (input.messageLength < 5) score -= 0.15;
  else if (input.messageLength > 20) score += 0.02;

  // Clamp to valid range
  return Math.max(0.05, Math.min(0.99, score));
}

// ============================================================================
// ENGINE REGISTRY
// ============================================================================

const ENGINE_REGISTRY: Record<string, EngineRegistryEntry> = {};

export function registerEngine(entry: EngineRegistryEntry): void {
  ENGINE_REGISTRY[entry.name] = entry;
}

export function getEngine(name: string): EngineRegistryEntry | undefined {
  return ENGINE_REGISTRY[name];
}

export function listEngines(): EngineRegistryEntry[] {
  return Object.values(ENGINE_REGISTRY);
}

export function getEngineFallback(engineName: string): string | undefined {
  return ENGINE_REGISTRY[engineName]?.fallback;
}

// ============================================================================
// FALLBACK CHAIN EXECUTOR
// ============================================================================

export async function executeWithFallback(
  engineName: string,
  input: any,
  context?: any,
  maxRetries = 2
): Promise<{ success: boolean; result: any; engine: string; retries: number }> {
  let currentEngine = engineName;
  let retries = 0;

  while (currentEngine && retries <= maxRetries) {
    const engine = getEngine(currentEngine);
    if (!engine) break;

    try {
      const result = await engine.handler(input, context);
      return { success: true, result, engine: currentEngine, retries };
    } catch (error: any) {
      retries++;
      const fallback = getEngineFallback(currentEngine);
      if (!fallback) {
        return { success: false, result: error.message, engine: currentEngine, retries };
      }
      currentEngine = fallback;
    }
  }

  return { success: false, result: 'All engines in fallback chain failed.', engine: currentEngine || 'none', retries };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const CognitiveKernel = {
  classifyIntent,
  calculateConfidence,
  registerEngine,
  getEngine,
  listEngines,
  getEngineFallback,
  executeWithFallback,
};

export default CognitiveKernel;
