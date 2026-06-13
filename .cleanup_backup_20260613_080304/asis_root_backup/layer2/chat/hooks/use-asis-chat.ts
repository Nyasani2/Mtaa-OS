/**
 * useASISChat Hook
 * Primary React hook for integrating ASIS chat into components
 * Manages chat engine lifecycle, state, and actions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ASISChatEngine } from '../chat-engine';
import { ChatSessionState, ChatMessage, ChatAction } from '../types';

export interface UseASISChatOptions {
  engine: ASISChatEngine;
  autoFocus?: boolean;
}

export interface UseASISChatReturn {
  state: ChatSessionState;
  sendMessage: (message: string) => Promise<void>;
  executeAction: (action: ChatAction) => void;
  clearHistory: () => void;
  isReady: boolean;
  error: string | null;
}

export function useASISChat(options: UseASISChatOptions): UseASISChatReturn {
  const { engine } = options;
  const [state, setState] = useState<ChatSessionState>(engine.state);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Subscribe to engine state changes
    unsubscribeRef.current = engine.subscribe((newState) => {
      setState(newState);
    });

    setIsReady(true);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [engine]);

  const sendMessage = useCallback(
    async (message: string) => {
      try {
        setError(null);
        await engine.sendMessage(message);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setError(message);
        console.error('[useASISChat] Send error:', err);
      }
    },
    [engine]
  );

  const executeAction = useCallback(
    (action: ChatAction) => {
      try {
        engine.executeAction(action);
      } catch (err) {
        console.error('[useASISChat] Action error:', err);
      }
    },
    [engine]
  );

  const clearHistory = useCallback(() => {
    engine.clearHistory();
  }, [engine]);

  return {
    state,
    sendMessage,
    executeAction,
    clearHistory,
    isReady,
    error,
  };
}
