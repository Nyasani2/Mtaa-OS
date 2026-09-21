// @ts-nocheck
import { supabase } from '@/lib/supabase';
import { ASIS_STRICT_SYSTEM_PROMPT } from './asis-cse-strict-prompt';

export interface ProcessResponseParams {
  query: string;
  conversationHistory?: string;
  systemPrompt?: string;
  userId?: string;
}

export async function processResponse(params: ProcessResponseParams): Promise<any> {
  const { query, conversationHistory = '', systemPrompt, userId } = params;

  // MERGE custom system prompt with strict prompt
  const finalSystemPrompt = systemPrompt 
    ? `${ASIS_STRICT_SYSTEM_PROMPT}\n\n[CUSTOM CONTEXT]:\n${systemPrompt}`
    : ASIS_STRICT_SYSTEM_PROMPT;

  try {
    // Call Supabase Edge Function 'asis-ai' with the system prompt
    const response = await supabase.functions.invoke('asis-ai', {
      body: {
        query,
        conversationHistory,
        systemPrompt: finalSystemPrompt, // <-- CRITICAL: Pass system prompt
        userId: userId || 'anonymous',
      },
    });

    if (response.error) throw response.error;

    return {
      text: response.data.response || response.data.answer || 'No response generated',
      sources: response.data.sources || [],
      confidence: response.data.confidence || 0.9,
      engine: 'ResponseEngineV2',
    };
  } catch (error: any) {
    console.error('ASIS Response Error:', error);
    return {
      text: `Error: ${error.message}`,
      sources: [],
      confidence: 0,
      engine: 'ResponseEngineV2',
    };
  }
}
