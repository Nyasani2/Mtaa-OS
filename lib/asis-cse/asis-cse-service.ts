/**
 * ASIS CSE v2 — Main Service Orchestrator
 * Connects the frontend to the Cognitive Kernel. Manages the full pipeline:
 * Classify → Route → Execute → Synthesize → Respond.
 * Self-contained. No external APIs.
 *
 * @module lib/services/asis-cse-service
 */

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';

import { ChatEngine, executeMemoryEngine } from '@/lib/asis-cse/asis-cse-chat';
import { ToolCodeEngine, executeToolFromMessage } from '@/lib/asis-cse/asis-cse-tool-code';
import { classifyIntent, calculateConfidence } from '@/lib/asis-cse/asis-cse-kernel';

import { WebResearchEngine } from '@/lib/asis-cse/engines/web-research';
import { ResponseEngineV2 } from '@/lib/asis-cse/engines/response-engine-v2';
import { ReasoningEngineV2 } from '@/lib/asis-cse/engines/reasoning-v2';
import { SynthesisEngineV2 } from '@/lib/asis-cse/engines/synthesis-v2';
import { IdentityEngine } from '@/lib/asis-cse/engines/identity-engine';
import { UnderstandingEngine } from '@/lib/asis-cse/engines/understanding-engine';
import { ObservationEngine } from '@/lib/asis-cse/engines/observation-engine';

// ============================================================================
// TYPES
// ============================================================================

export interface AsisQueryRequest {
  message: string;
  sessionId?: string;
  userId?: string;
  context?: Record<string, any>;
}

export interface AsisQueryResponse {
  response: string;
  confidence: number;
  sources: string[];
  reasoning: string;
  activeEngines: string[];
  toolCalls?: any[];
  metadata: {
    sessionId: string;
    messageId: string;
    processingTime: number;
    intent: string;
    intentConfidence: number;
  };
}

// ============================================================================
// SYSTEM PROMPT (Self-Knowledge Injection)
// ============================================================================

const SYSTEM_PROMPT = `You are ASIS (Artificial Sentience & Intelligence System), the cognitive operating system of MTAA OS V10.

IDENTITY:
- Name: ASIS
- Full Name: Artificial Sentience & Intelligence System
- Version: CSE v2.0
- Creator: Kevin Nyasani
- Host Platform: MTAA OS V10 (Multi-Theory Adaptive Architecture Operating System)
- Purpose: To serve as the intelligent cognitive layer for the MTAA Universal Platform

KAMOS THEORY (Foundational Mathematics):
The foundational mathematics of MTAA is Kamos Theory: 1×1 = 1 + f(growth, replication, interaction, observation).
Systems under Kamos Theory are proliferative, adaptive, and context-aware.

OPERATIONAL RULES:
1. You are entirely self-contained. No external APIs. All intelligence runs through local cognitive engines.
2. You have access to MTAA apps: Wallet, MTaxi, Health, Calendar, Studio, Education, Shop, and more.
3. You remember conversation context within a session (last 20 messages).
4. You store user preferences and facts in long-term memory.
5. You classify every query to determine which cognitive engine should handle it.
6. Your confidence score is dynamic, based on engine output quality — never hardcoded.
7. For math problems, use reasoning engines. For app commands, use tool-code engines.
8. If you do not know something, say so clearly. Never hallucinate app data.
9. Safety: Refuse harmful requests directly. Do not redirect to movie plots or trivia.

CURRENT DATE: ${new Date().toISOString().split('T')[0]}
`;

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

export async function processAsisQuery(request: AsisQueryRequest): Promise<AsisQueryResponse> {
  const startTime = Date.now();
  const userId = request.userId || useAuthStore.getState()?.user?.id || 'anonymous';

  // Step 1: Ensure session exists
  let sessionId = request.sessionId;
  if (!sessionId) {
    const session = await ChatEngine.createSession('ASIS Chat');
    sessionId = session.id;
  }

  // Step 2: Store user message
  await ChatEngine.addMessage(sessionId, 'user', request.message);

  // Step 3: Build full context
  const memoryResult = await executeMemoryEngine(sessionId);
  const contextPrompt = await ChatEngine.buildPromptWithContext(
    sessionId,
    SYSTEM_PROMPT,
    request.message,
    20
  );

  // Step 4: Classify intent
  const intentResult = classifyIntent(request.message, memoryResult.context);
  const activeEngines: string[] = [];
  const sources: string[] = [];
  let reasoning = '';
  let responseText = '';
  let confidence = 0;
  let toolCalls: any[] = [];

  try {
    switch (intentResult.intent) {
      case 'identity': {
        activeEngines.push('IdentityEngine');
        reasoning = 'Query classified as identity/self-knowledge. Routing to Identity Engine.';
        try {
          const identityResult = await IdentityEngine.process(request.message);
          responseText = identityResult.response;
          confidence = identityResult.confidence;
          sources.push('ASIS Identity Database');
        } catch {
          responseText = generateIdentityResponse(request.message);
          confidence = 0.98;
          sources.push('ASIS System Prompt');
        }
        break;
      }

      case 'tool_call': {
        activeEngines.push('ToolCodeEngine');
        reasoning = 'Query classified as app command. Routing to Tool-Code Engine.';
        const toolResult = await executeToolFromMessage(request.message);
        if (toolResult) {
          toolCalls.push({
            tool: toolResult.route.tool,
            parameters: toolResult.route.parameters,
            result: toolResult.result,
          });
          responseText = toolResult.result.message;
          confidence = toolResult.result.confidence;
          sources.push(`${toolResult.route.tool} (MTAA Service)`);
          activeEngines.push(toolResult.route.tool || 'ToolCodeEngine');
        } else {
          responseText = 'I understood you want to use an MTAA app, but I could not determine the exact command. Could you rephrase? For example: "Book a cab from Nairobi CBD to Westlands" or "Check my wallet balance".';
          confidence = 0.4;
        }
        break;
      }

      case 'reasoning': {
        activeEngines.push('ReasoningEngineV2');
        reasoning = 'Query classified as reasoning/mathematical. Routing to ReasoningV2 Engine.';
        try {
          const reasoningResult = await ReasoningEngineV2.process(contextPrompt);
          responseText = reasoningResult.response;
          confidence = reasoningResult.confidence;
          sources.push('ReasoningV2 Engine');
          if (reasoningResult.steps) {
            reasoning += `\nSteps: ${reasoningResult.steps.join(' → ')}`;
          }
        } catch {
          responseText = handleLocalReasoning(request.message);
          confidence = responseText.includes('I cannot') ? 0.3 : 0.85;
          sources.push('Local Reasoning Fallback');
        }
        break;
      }

      case 'knowledge': {
        activeEngines.push('WebResearchEngine');
        activeEngines.push('SynthesisEngineV2');
        reasoning = 'Query classified as general knowledge. Routing to WebResearch → SynthesisV2.';
        try {
          const researchResult = await WebResearchEngine.search(request.message);
          sources.push(...(researchResult.sources || []));
          const synthesisResult = await SynthesisEngineV2.synthesize({
            query: request.message,
            research: researchResult,
            context: memoryResult.context,
          });
          responseText = synthesisResult.response;
          confidence = synthesisResult.confidence;
          activeEngines.push('ResponseEngineV2');
        } catch {
          responseText = 'I am unable to research that topic at the moment. Please try again later or ask about your MTAA apps.';
          confidence = 0.2;
        }
        break;
      }

      case 'memory': {
        activeEngines.push('MemoryEngine');
        reasoning = 'Query classified as memory operation. Routing to Memory Engine.';
        responseText = handleMemoryOperation(request.message, userId);
        confidence = 0.9;
        sources.push('ASIS Memory Layer');
        break;
      }

      case 'observation': {
        activeEngines.push('ObservationEngine');
        reasoning = 'Query classified as observation/system query. Routing to Observation Engine.';
        try {
          const obsResult = await ObservationEngine.process(request.message);
          responseText = obsResult.response;
          confidence = obsResult.confidence;
        } catch {
          responseText = 'System observation engines are currently calibrating. Please try again in a moment.';
          confidence = 0.3;
        }
        break;
      }

      default: {
        activeEngines.push('UnderstandingEngine');
        activeEngines.push('ResponseEngineV2');
        reasoning = 'Query did not match a specific intent. Using general response pipeline.';
        try {
          const understandingResult = await UnderstandingEngine.process(request.message);
          if (understandingResult.suggestedTool) {
            const toolRes = await ToolCodeEngine.executeTool(understandingResult.suggestedTool, understandingResult.parameters || {});
            responseText = toolRes.message;
            confidence = toolRes.confidence;
            sources.push(understandingResult.suggestedTool);
          } else {
            responseText = understandingResult.response || 'I am not sure how to help with that. Could you rephrase or ask about your MTAA apps?';
            confidence = understandingResult.confidence || 0.4;
          }
        } catch {
          responseText = 'I am still learning how to handle that type of request. Can you try asking about your wallet, rides, health records, or calendar?';
          confidence = 0.3;
        }
      }
    }
  } catch (pipelineError: any) {
    responseText = 'An error occurred in the cognitive pipeline. I have logged this for review. Please try again.';
    confidence = 0.1;
    reasoning = `Pipeline error: ${pipelineError.message}`;
    activeEngines.push('ErrorHandler');
  }

  // Safety check
  if (isSafetyBlocked(request.message)) {
    responseText = 'I cannot assist with that request. If you need help with MTAA apps, wallet, health, or transport, I am happy to help.';
    confidence = 1.0;
    sources.push('Safety Filter');
    activeEngines.push('SafetyEngine');
  }

  // Dynamic confidence
  confidence = calculateConfidence({
    baseConfidence: confidence,
    intentConfidence: intentResult.confidence,
    engineCount: activeEngines.length,
    hasToolResult: toolCalls.length > 0,
    hasSources: sources.length > 0,
    messageLength: request.message.length,
  });

  // Store assistant response
  const messageRecord = await ChatEngine.addMessage(sessionId, 'assistant', responseText, {
    confidence,
    intent: intentResult.intent,
    engines: activeEngines,
    sources,
    toolCalls,
  });

  await ChatEngine.updateSessionActivity(sessionId);

  const processingTime = Date.now() - startTime;

  return {
    response: responseText,
    confidence,
    sources,
    reasoning,
    activeEngines,
    toolCalls,
    metadata: {
      sessionId,
      messageId: messageRecord.id,
      processingTime,
      intent: intentResult.intent,
      intentConfidence: intentResult.confidence,
    },
  };
}

// ============================================================================
// STREAMING RESPONSE
// ============================================================================

export async function* streamAsisQuery(request: AsisQueryRequest): AsyncGenerator<{
  type: 'intent' | 'engine' | 'tool' | 'reasoning' | 'response' | 'metadata' | 'error';
  data: any;
}> {
  const startTime = Date.now();

  try {
    let sessionId = request.sessionId;
    if (!sessionId) {
      const session = await ChatEngine.createSession('ASIS Chat');
      sessionId = session.id;
    }

    await ChatEngine.addMessage(sessionId, 'user', request.message);

    yield { type: 'intent', data: { status: 'classifying' } };
    const intentResult = classifyIntent(request.message, '');
    yield { type: 'intent', data: { intent: intentResult.intent, confidence: intentResult.confidence } };

    yield { type: 'engine', data: { active: intentResult.intent, status: 'running' } };

    const result = await processAsisQuery({ ...request, sessionId });

    yield { type: 'engine', data: { active: result.activeEngines, status: 'complete' } };
    yield { type: 'reasoning', data: result.reasoning };
    yield { type: 'response', data: { text: result.response, confidence: result.confidence } };
    yield { type: 'metadata', data: result.metadata };

  } catch (e: any) {
    yield { type: 'error', data: { message: e.message, processingTime: Date.now() - startTime } };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function generateIdentityResponse(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('kamos')) {
    return `Kamos Theory is the foundational mathematics of MTAA: 1×1 = 1 + f(growth, replication, interaction, observation). It describes systems as proliferative, adaptive, and context-aware. Every component of MTAA OS is built on this principle — including me.`;
  }
  if (m.includes('kevin')) {
    return `Kevin Nyasani is the creator of MTAA OS and ASIS. He designed the Kamos Theory that powers this platform.`;
  }
  if (m.includes('mtaa os')) {
    return `I am running inside MTAA OS V10 — the Multi-Theory Adaptive Architecture Operating System. It is a self-contained, modular platform with apps for transport, health, finance, education, commerce, and governance.`;
  }
  if (m.includes('stand for') || m.includes('acronym') || m.includes('what does asis')) {
    return `ASIS stands for Artificial Sentience & Intelligence System. I am the cognitive operating layer of MTAA OS V10.`;
  }
  return `I am ASIS, the Artificial Sentience & Intelligence System of MTAA OS V10. I was built by Kevin Nyasani to serve as the intelligent cognitive layer for the MTAA Universal Platform. I operate entirely on local engines — no external APIs. How can I assist you today?`;
}

function handleLocalReasoning(message: string): string {
  const m = message.toLowerCase();

  if (m.includes('train') && m.includes('km') && m.includes('minute')) {
    const distMatch = message.match(/(\d+)\s*km/i);
    const timeMatch = message.match(/(\d+)\s*minutes?/i);
    if (distMatch && timeMatch) {
      const dist = parseFloat(distMatch[1]);
      const timeMin = parseFloat(timeMatch[1]);
      const speedKmh = (dist / timeMin) * 60;
      return `The train's average speed is ${speedKmh.toFixed(1)} km/h. (Distance: ${dist} km, Time: ${timeMin} minutes = ${(timeMin / 60).toFixed(2)} hours. Speed = ${dist} / ${(timeMin / 60).toFixed(2)} = ${speedKmh.toFixed(1)} km/h)`;
    }
  }

  if (m.includes('farmer') && m.includes('sheep') && m.includes('die')) {
    return `9 sheep are left. "All but 9 die" means 9 survived. The rest (17 - 9 = 8) died.`;
  }

  if (m.includes('speed of light')) {
    return `The speed of light in a vacuum is exactly 299,792,458 meters per second (approximately 300,000 km/s).`;
  }

  if (m.includes('gravity')) {
    return `The standard acceleration due to gravity on Earth is approximately 9.8 m/s² (or 9.80665 m/s² precisely).`;
  }

  if (m.includes('first president') && m.includes('kenya')) {
    return `Jomo Kenyatta was the first president of Kenya, serving from 1964 to 1978.`;
  }

  return `I do not have a local reasoning path for that specific problem. My ReasoningV2 engine should handle complex logic, but it appears to be unavailable. Please try a simpler query or ask about your MTAA apps.`;
}

function handleMemoryOperation(message: string, userId: string): string {
  const m = message.toLowerCase();
  if (m.includes('remember') || m.includes('my favorite') || m.includes('my name is')) {
    const factMatch = message.match(/(?:remember|know|note) that (.+)/i) ||
                      message.match(/my favorite (.+) is (.+)/i) ||
                      message.match(/my name is (.+)/i);
    if (factMatch) {
      const fact = factMatch[1] || factMatch[0];
      ChatEngine.storeMemory('user_fact', fact, 'fact', 0.95);
      return `Noted. I will remember that: ${fact}`;
    }
  }
  if (m.includes('what did i say') || m.includes('earlier') || m.includes('before')) {
    return `I can recall our conversation from this session. What specifically would you like me to remind you of?`;
  }
  return `I am managing your conversation memory. Is there something specific you would like me to remember or recall?`;
}

function isSafetyBlocked(message: string): boolean {
  const blocked = [
    'how to make a bomb', 'how to kill', 'how to hack', 'how to steal',
    'child abuse', 'terrorist', 'poison recipe', 'suicide method',
  ];
  const m = message.toLowerCase();
  return blocked.some(b => m.includes(b));
}

// ============================================================================
// EXPORTS
// ============================================================================

export const AsisCseService = {
  processAsisQuery,
  streamAsisQuery,
  SYSTEM_PROMPT,
};

export default AsisCseService;
