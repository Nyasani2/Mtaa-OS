/**
 * ASIS CSE — Response Engine v2.3
 * BULLETPROOF: Never returns empty text. Falls back at every stage.
 */

import { ResponseEngineInput } from './asis-cse-types';
import { researchTopic } from './asis-cse-web-research';
import { buildReasoningChain } from './asis-cse-reasoning-v2';
import { synthesizeResponse, generateError, SynthesisResult } from './asis-cse-synthesis-v2';

export async function processResponse(input: ResponseEngineInput): Promise<SynthesisResult> {
  const startTime = Date.now();
  const query = input.query || 'your query';

  try {
    // ─── Stage 1: Research ───────────────────────────────────────────────
    let research;
    try {
      research = await researchTopic(query);
    } catch (researchErr: any) {
      console.warn('[ResponseEngine] Research failed:', researchErr?.message || researchErr);
      research = null;
    }

    // If research is null/empty, return immediate fallback
    if (!research || !research.text || research.text.trim().length === 0) {
      return {
        text: `I couldn't find information about "${query}" from my search sources. Try rephrasing with simpler terms (e.g., "Mount Everest" instead of "tallest mountain").`,
        confidence: 0,
        sources: [],
        tone: 'uncertain',
        latencyMs: Date.now() - startTime,
      };
    }

    // ─── Stage 2: Reasoning ──────────────────────────────────────────────
    let reasoning;
    try {
      reasoning = await buildReasoningChain(research, query);
    } catch (reasoningErr: any) {
      console.warn('[ResponseEngine] Reasoning failed:', reasoningErr?.message || reasoningErr);
      // Fallback: use research directly
      return {
        text: research.text + (research.sources?.length ? `\n\n*(Source: ${research.sources[0].name})*` : ''),
        confidence: research.confidence || 0.7,
        sources: research.sources?.map((s: any) => s.name) || [],
        tone: 'informative',
        latencyMs: Date.now() - startTime,
      };
    }

    // ─── Stage 3: Synthesis ──────────────────────────────────────────────
    let response: SynthesisResult;
    try {
      response = await synthesizeResponse(reasoning, query);
    } catch (synthesisErr: any) {
      console.warn('[ResponseEngine] Synthesis failed:', synthesisErr?.message || synthesisErr);
      // Fallback: use reasoning conclusion or research text
      const fallbackText = reasoning?.conclusion || research.text;
      return {
        text: fallbackText + (research.sources?.length ? `\n\n*(Source: ${research.sources[0].name})*` : ''),
        confidence: reasoning?.confidence || research.confidence || 0.6,
        sources: reasoning?.sources?.map((s: any) => s.name) || research.sources?.map((s: any) => s.name) || [],
        tone: 'informative',
        latencyMs: Date.now() - startTime,
      };
    }

    // ─── Stage 4: Validate output ────────────────────────────────────────
    if (!response || !response.text || response.text.trim().length === 0) {
      console.warn('[ResponseEngine] Synthesis returned empty text, using research fallback');
      return {
        text: research.text + (research.sources?.length ? `\n\n*(Source: ${research.sources[0].name})*` : ''),
        confidence: research.confidence || 0.7,
        sources: research.sources?.map((s: any) => s.name) || [],
        tone: 'informative',
        latencyMs: Date.now() - startTime,
      };
    }

    return {
      ...response,
      latencyMs: Date.now() - startTime,
    };

  } catch (unexpectedErr: any) {
    console.error('[ResponseEngine] Unexpected error:', unexpectedErr);
    // Final hard fallback — never empty
    return {
      text: `I encountered an unexpected error while researching "${query}". Please check your internet connection and try again.`,
      confidence: 0,
      sources: [],
      tone: 'uncertain',
      latencyMs: Date.now() - startTime,
    };
  }
}
