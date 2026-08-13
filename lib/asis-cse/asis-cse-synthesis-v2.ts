// @ts-nocheck
/**
 * ASIS CSE — Synthesis Engine v2.3
 * BULLETPROOF: generateError handles ANY input. Never returns empty text.
 */

import { ResearchResult, ReasoningChain } from './asis-cse-types';

export interface SynthesisResult {
  text: string;
  confidence: number;
  sources: string[];
  tone: 'confident' | 'informative' | 'speculative' | 'uncertain';
  latencyMs: number;
}

export async function synthesizeResponse(
  reasoning: ReasoningChain | null,
  originalQuery: string
): Promise<SynthesisResult> {
  const startTime = Date.now();

  if (!reasoning) {
    return {
      text: `I don't have enough information to answer "${originalQuery}" confidently.`,
      confidence: 0,
      sources: [],
      tone: 'uncertain',
      latencyMs: Date.now() - startTime,
    };
  }

  const conclusion = reasoning.conclusion || '';
  const confidence = reasoning.confidence || 0;
  const sources = reasoning.sources || [];

  if (conclusion.trim().length === 0) {
    return {
      text: `I found some information about "${originalQuery}" but couldn't form a complete answer.`,
      confidence: 0,
      sources: [],
      tone: 'uncertain',
      latencyMs: Date.now() - startTime,
    };
  }

  const sourceNames = sources.map((s) => s.name).filter(Boolean);
  const sourceAttribution = sourceNames.length > 0
    ? `\n\n*(Sources: ${sourceNames.join(', ')})*`
    : '';

  let tone: SynthesisResult['tone'];
  if (confidence >= 0.8) tone = 'confident';
  else if (confidence >= 0.5) tone = 'informative';
  else if (confidence >= 0.3) tone = 'speculative';
  else tone = 'uncertain';

  return {
    text: conclusion.trim() + sourceAttribution,
    confidence,
    sources: sourceNames,
    tone,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * DEFENSIVE error handler — accepts ANY input format.
 */
export async function generateError(input?: any): Promise<SynthesisResult> {
  let query = 'your query';
  let errorMessage = 'An unknown error occurred';

  if (input !== undefined && input !== null) {
    if (typeof input === 'string') {
      errorMessage = input;
    } else if (input instanceof Error) {
      errorMessage = input.message || 'Unknown error';
    } else if (typeof input === 'object') {
      query = input.query || input.q || input.queryText || input.message || 'your query';
      errorMessage = input.error || input.err || input.message || input.text || 'Unknown error';
    }
  }

  const isNetworkError = /network|fetch|cors|failed to fetch|TypeError/i.test(errorMessage);

  let text: string;
  if (isNetworkError) {
    text = `I couldn't reach my search sources right now (${errorMessage}). Let me try my local knowledge instead.\n\nFor "${query}": I may have limited information without internet access.`;
  } else {
    text = `I encountered a processing error: ${errorMessage}. Please try rephrasing your question.`;
  }

  return {
    text,
    confidence: 0,
    sources: [],
    tone: 'uncertain',
    latencyMs: 0,
  };
}

export async function quickSynthesize(
  research: ResearchResult,
  query: string
): Promise<SynthesisResult> {
  const startTime = Date.now();

  if (!research || !research.text || research.text.includes('No results found')) {
    return {
      text: `I couldn't find specific information about "${query}" from my search sources.`,
      confidence: 0,
      sources: [],
      tone: 'uncertain',
      latencyMs: Date.now() - startTime,
    };
  }

  const sourceNames = (research.sources || []).map((s) => s.name).filter(Boolean);
  const tone: SynthesisResult['tone'] = (research.confidence || 0) >= 0.8 ? 'confident' : 'informative';

  return {
    text: research.text + (sourceNames.length > 0 ? `\n\n*(Sources: ${sourceNames.join(', ')})*` : ''),
    confidence: research.confidence || 0.5,
    sources: sourceNames,
    tone,
    latencyMs: Date.now() - startTime,
  };
}
