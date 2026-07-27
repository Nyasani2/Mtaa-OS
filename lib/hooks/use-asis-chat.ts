/**
 * ASIS CSE v2 — React Hook for Chat Interface
 * Manages session state, message history, streaming responses, and engine status.
 * Wraps the service layer (asis-cse-service) for UI consumption.
 *
 * @module lib/hooks/use-asis-chat
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  processAsisQuery,
  streamAsisQuery,
  AsisQueryRequest,
  AsisQueryResponse,
} from '@/lib/services/asis-cse-service';
import {
  ChatEngine,
  AsisSession,
  AsisMessage,
} from '@/lib/asis-cse/asis-cse-chat';

// ============================================================================
// TYPES
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    intent?: string;
    engines?: string[];
    sources?: string[];
    toolCalls?: any[];
    reasoning?: string;
    processingTime?: number;
  };
}

export interface EngineStatus {
  name: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  output?: string;
  confidence?: number;
}

export interface UseAsisChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  engineStatus: EngineStatus[];
  currentConfidence: number;
  currentIntent: string;
  currentReasoning: string;
  sessionId: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  loadSession: (sessionId: string) => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAsisChat(): UseAsisChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [engineStatus, setEngineStatus] = useState<EngineStatus[]>([]);
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [currentIntent, setCurrentIntent] = useState('');
  const [currentReasoning, setCurrentReasoning] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(null);

  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;
    ChatEngine.createSession('ASIS Chat').then((session) => {
      if (mounted) {
        setSessionId(session.id);
        sessionRef.current = session.id;
      }
    });
    return () => { mounted = false; };
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !sessionRef.current) return;

    const sid = sessionRef.current;

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setEngineStatus([]);
    setCurrentConfidence(0);
    setCurrentIntent('');
    setCurrentReasoning('');

    try {
      // Use streaming for real-time engine updates
      const stream = streamAsisQuery({
        message: text.trim(),
        sessionId: sid,
      });

      let finalResponse = '';
      let finalConfidence = 0;
      let finalIntent = '';
      let finalReasoning = '';
      const engines: EngineStatus[] = [];
      const sources: string[] = [];
      let toolCalls: any[] = [];
      let processingTime = 0;

      for await (const chunk of stream) {
        switch (chunk.type) {
          case 'intent':
            if (chunk.data.intent) {
              finalIntent = chunk.data.intent;
              setCurrentIntent(chunk.data.intent);
            }
            break;

          case 'engine':
            if (Array.isArray(chunk.data.active)) {
              chunk.data.active.forEach((name: string) => {
                if (!engines.find((e) => e.name === name)) {
                  engines.push({
                    name,
                    status: chunk.data.status || 'running',
                    output: '',
                  });
                } else {
                  const e = engines.find((eng) => eng.name === name);
                  if (e) e.status = chunk.data.status || 'running';
                }
              });
              setEngineStatus([...engines]);
            } else if (chunk.data.active) {
              const name = chunk.data.active;
              if (!engines.find((e) => e.name === name)) {
                engines.push({
                  name,
                  status: chunk.data.status || 'running',
                  output: '',
                });
              }
              setEngineStatus([...engines]);
            }
            break;

          case 'reasoning':
            finalReasoning = chunk.data;
            setCurrentReasoning(chunk.data);
            break;

          case 'response':
            finalResponse = chunk.data.text;
            finalConfidence = chunk.data.confidence;
            setCurrentConfidence(chunk.data.confidence);
            break;

          case 'metadata':
            processingTime = chunk.data.processingTime;
            if (chunk.data.toolCalls) toolCalls = chunk.data.toolCalls;
            break;

          case 'error':
            finalResponse = `Error: ${chunk.data.message}`;
            finalConfidence = 0.1;
            break;
        }
      }

      // Add assistant message
      const assistantMsg: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: finalResponse || 'I am processing your request...',
        timestamp: new Date(),
        metadata: {
          confidence: finalConfidence,
          intent: finalIntent,
          engines: engines.map((e) => e.name),
          sources,
          toolCalls,
          reasoning: finalReasoning,
          processingTime,
        },
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Mark all engines complete
      setEngineStatus((prev) =>
        prev.map((e) => ({ ...e, status: 'complete' as const }))
      );
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: `Something went wrong: ${error.message || 'Unknown error'}`,
        timestamp: new Date(),
        metadata: { confidence: 0.05 },
      };
      setMessages((prev) => [...prev, errorMsg]);
      setEngineStatus((prev) =>
        prev.map((e) => ({ ...e, status: 'error' as const }))
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setEngineStatus([]);
    setCurrentConfidence(0);
    setCurrentIntent('');
    setCurrentReasoning('');
    // Create new session
    ChatEngine.createSession('ASIS Chat').then((session) => {
      setSessionId(session.id);
      sessionRef.current = session.id;
    });
  }, []);

  const loadSession = useCallback(async (sid: string) => {
    const session = await ChatEngine.getSession(sid);
    if (!session) return;

    setSessionId(sid);
    sessionRef.current = sid;

    const msgs = await ChatEngine.getMessages(sid, 50);
    const chatMsgs: ChatMessage[] = msgs.map((m) => ({
      id: m.id,
      role: m.role === 'system' ? 'system' : m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
      timestamp: new Date(m.created_at),
      metadata: m.metadata,
    }));
    setMessages(chatMsgs);
  }, []);

  return {
    messages,
    isLoading,
    engineStatus,
    currentConfidence,
    currentIntent,
    currentReasoning,
    sessionId,
    sendMessage,
    clearChat,
    loadSession,
  };
}

export default useAsisChat;
