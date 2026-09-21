// @ts-nocheck
/**
 * ASIS CSE — Synthesis Engine v3.0 (Qwen Integrated)
 * Uses local Ollama Qwen for intelligent synthesis, with local fallback.
 */
import { ReasoningChain } from './asis-cse-types';

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
  
  const context = reasoning?.keyFacts?.map((f: any) => f.text).join('\n') || '';
  const sources = reasoning?.keyFacts?.map((f: any) => f.source).filter(Boolean) || [];
  
  try {
    // Call local Ollama Qwen model for intelligent synthesis
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:7b',
        messages: [
          {
            role: 'system',
            content: "You are ASIS, a helpful AI assistant. Answer the user's query based *ONLY* on the provided context and conversation history. If the context is empty, use your general knowledge to answer helpfully. Be concise and direct."
          },
          {
            role: 'user',
            content: `Context:\n${context}\n\nQuery: ${originalQuery}`
          }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.message?.content || "I processed your request but couldn't generate a response.";

    return {
      text: answer,
      confidence: reasoning?.confidence || 0.85,
      sources,
      tone: 'confident',
      latencyMs: Date.now() - startTime,
    };
  } catch (error: any) {
    console.warn('[Synthesis] Ollama failed, falling back to local extraction:', error.message);
    
    if (!context) {
      return {
        text: `I couldn't find information about "${originalQuery}" from my search sources. Try rephrasing.`,
        confidence: 0,
        sources: [],
        tone: 'uncertain',
        latencyMs: Date.now() - startTime,
      };
    }
    
    return {
      text: context + `\n\n*(Note: Local AI synthesis is offline, showing raw research data)*`,
      confidence: 0.5,
      sources,
      tone: 'informative',
      latencyMs: Date.now() - startTime,
    };
  }
}

export async function generateError(input?: any): Promise<SynthesisResult> {
  let query = 'your query';
  let errorMessage = 'An unknown error occurred';
  
  if (input !== undefined && input !== null) {
    if (typeof input === 'string') errorMessage = input;
    else if (input instanceof Error) errorMessage = input.message || 'Unknown error';
    else if (typeof input === 'object') {
      query = input.query || input.q || 'your query';
      errorMessage = input.error || input.message || 'Unknown error';
    }
  }
  
  return {
    text: `I encountered a processing error: ${errorMessage}. Please try rephrasing your question.`,
    confidence: 0,
    sources: [],
    tone: 'uncertain',
    latencyMs: 0,
  };
}
