// lib/asis/services/asis-cse-service.ts
// ASIS CSE (Conversational Search Engine) Service
// Imported by: app/(os)/asis/chat.tsx

import { supabase } from '@/lib/supabase';

export interface CSEMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    sources?: string[];
    confidence?: number;
    intent?: string;
  };
}

export interface CSESession {
  id: string;
  user_id: string;
  title: string;
  messages: CSEMessage[];
  created_at: string;
  updated_at: string;
}

export interface CSEQueryResult {
  answer: string;
  sources: string[];
  confidence: number;
  relatedQuestions: string[];
}

/**
 * Send a message to ASIS CSE and get a response
 */
export async function sendCSEMessage(
  sessionId: string,
  message: string,
  context?: string[]
): Promise<CSEMessage | null> {
  try {
    // Store user message
    const userMsg: CSEMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    await supabase.from('asis_chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: message,
    });

    // Call ASIS CSE edge function
    const { data, error } = await supabase.functions.invoke('asis-cse', {
      body: { message, context, sessionId },
    });

    if (error) throw error;

    const assistantMsg: CSEMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: data?.answer || 'I am processing your request.',
      timestamp: new Date().toISOString(),
      metadata: {
        sources: data?.sources || [],
        confidence: data?.confidence || 0,
        intent: data?.intent,
      },
    };

    await supabase.from('asis_chat_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: assistantMsg.content,
      metadata: assistantMsg.metadata,
    });

    return assistantMsg;
  } catch (e: any) {
    console.error('[CSEService]', e);
    return null;
  }
}

/**
 * Create a new CSE session
 */
export async function createCSESession(userId: string, title?: string): Promise<CSESession | null> {
  try {
    const { data, error } = await supabase
      .from('asis_chat_sessions')
      .insert({
        user_id: userId,
        title: title || 'New Chat',
      })
      .select()
      .single();

    if (error) throw error;
    return data as CSESession;
  } catch (e: any) {
    console.error('[CSEService]', e);
    return null;
  }
}

/**
 * Get session messages
 */
export async function getCSESessionMessages(sessionId: string): Promise<CSEMessage[]> {
  try {
    const { data, error } = await supabase
      .from('asis_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.created_at,
      metadata: m.metadata,
    }));
  } catch (e: any) {
    console.error('[CSEService]', e);
    return [];
  }
}

/**
 * Get user's CSE sessions
 */
export async function getCSESessions(userId: string): Promise<CSESession[]> {
  try {
    const { data, error } = await supabase
      .from('asis_chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CSESession[];
  } catch (e: any) {
    console.error('[CSEService]', e);
    return [];
  }
}

/**
 * Search knowledge base
 */
export async function searchKnowledgeBase(query: string): Promise<CSEQueryResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke('asis-kb-search', {
      body: { query },
    });

    if (error) throw error;
    return data as CSEQueryResult;
  } catch (e: any) {
    console.error('[CSEService]', e);
    return null;
  }
}

export default {
  sendCSEMessage,
  createCSESession,
  getCSESessionMessages,
  getCSESessions,
  searchKnowledgeBase,
};
