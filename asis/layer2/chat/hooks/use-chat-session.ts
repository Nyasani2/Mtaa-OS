/**
 * useChatSession Hook
 * Manages chat session lifecycle, persistence, and restoration
 */

import { useState, useEffect, useCallback } from 'react';
import { ASISChatSession } from '../chat-session';
import { ChatSessionConfig, ChatSessionState } from '../types';

export interface UseChatSessionOptions {
  config?: Partial<ChatSessionConfig>;
  sessionId?: string;
}

export interface UseChatSessionReturn {
  session: ASISChatSession | null;
  state: ChatSessionState | null;
  createSession: () => void;
  loadSession: (id: string) => void;
  clearSession: () => void;
}

export function useChatSession(options: UseChatSessionOptions = {}): UseChatSessionReturn {
  const [session, setSession] = useState<ASISChatSession | null>(null);
  const [state, setState] = useState<ChatSessionState | null>(null);

  const createSession = useCallback(() => {
    const config: ChatSessionConfig = {
      maxHistory: 50,
      autoSave: true,
      persistAcrossSessions: true,
      typingIndicatorDelay: 500,
      streamChunkDelay: 30,
      enableSuggestions: true,
      enableVoice: false,
      theme: 'system',
      ...options.config,
    };

    const newSession = new ASISChatSession(config);
    newSession.initialize().then(() => {
      setSession(newSession);
      setState(newSession.state);
    });
  }, [options.config]);

  const loadSession = useCallback((id: string) => {
    // In production, load from persistent storage
    console.log(`[useChatSession] Loading session: ${id}`);
    createSession();
  }, [createSession]);

  const clearSession = useCallback(() => {
    if (session) {
      session.clear();
      setState(session.state);
    }
  }, [session]);

  useEffect(() => {
    createSession();
  }, [createSession]);

  return {
    session,
    state,
    createSession,
    loadSession,
    clearSession,
  };
}
