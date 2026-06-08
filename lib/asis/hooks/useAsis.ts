// ASIS v1 - React Hook
// Provides ASIS chat interface, session management, and action handling

import { useState, useCallback, useRef, useEffect } from 'react';
import { asisService } from '../services/asisService';
import {
  AsisMessage,
  AsisResponse,
  AsisDomain,
  AsisSession,
  AsisAction,
  AsisInsight,
} from '../types';

interface UseAsisOptions {
  userId: string;
  app: string;
  domain?: AsisDomain;
  onAction?: (action: AsisAction) => void;
  onInsight?: (insight: AsisInsight) => void;
  onError?: (error: Error) => void;
}

interface UseAsisReturn {
  messages: AsisMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: Error | null;
  session: AsisSession | null;
  sendMessage: (message: string, attachments?: any[]) => Promise<void>;
  clearChat: () => void;
  retryLastMessage: () => Promise<void>;
  sessionStats: {
    messageCount: number;
    domain: string;
    duration: number;
    lastActivity: string;
  };
  suggestions: string[];
}

export function useAsis(options: UseAsisOptions): UseAsisReturn {
  const { userId, app, domain = 'general', onAction, onInsight, onError } = options;

  const [messages, setMessages] = useState<AsisMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [session, setSession] = useState<AsisSession | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const lastMessageRef = useRef<string>('');
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  // Initialize session on mount
  useEffect(() => {
    initSession();
    return () => {
      asisService.clearSession();
    };
  }, [userId, app]);

  const initSession = useCallback(async () => {
    try {
      setError(null);
      const newSession = await asisService.initSession(userId, app);
      setSession(newSession);
      setMessages(newSession.messages);

      // Set domain-specific suggestions
      setSuggestions(getDomainSuggestions(domain));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize ASIS session');
      setError(error);
      onError?.(error);
    }
  }, [userId, app, domain, onError]);

  const sendMessage = useCallback(async (message: string, attachments?: any[]) => {
    if (!message.trim() || isLoading) return;

    try {
      setIsLoading(true);
      setIsTyping(true);
      setError(null);
      lastMessageRef.current = message;
      retryCountRef.current = 0;

      // Add user message immediately
      const userMessage: AsisMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        metadata: { attachments },
      };

      setMessages(prev => [...prev, userMessage]);

      // Send to ASIS
      const response = await asisService.sendMessage(message, domain, attachments);

      // Add ASIS response
      const asisMessage: AsisMessage = {
        role: 'asis',
        content: response.message,
        timestamp: new Date().toISOString(),
        metadata: {
          domain: response.domain,
          confidence: response.confidence,
          actions: response.actions,
          insights: response.insights,
          model: response.model,
          provider: response.provider,
          processingTime: response.processingTime,
        },
      };

      setMessages(prev => [...prev, asisMessage]);

      // Handle actions
      if (response.actions && response.actions.length > 0) {
        for (const action of response.actions) {
          onAction?.(action);
        }
      }

      // Handle insights
      if (response.insights && response.insights.length > 0) {
        for (const insight of response.insights) {
          onInsight?.(insight);
        }
      }

      // Update suggestions based on response
      updateSuggestions(response);

      // Update session
      setSession(asisService.getSession());

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message to ASIS');
      setError(error);
      onError?.(error);

      // Add error message
      const errorMessage: AsisMessage = {
        role: 'system',
        content: `I apologize, but I encountered an error: ${error.message}. Please try again or contact support if the issue persists.`,
        timestamp: new Date().toISOString(),
        metadata: { error: true },
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [isLoading, domain, onAction, onInsight, onError]);

  const retryLastMessage = useCallback(async () => {
    if (!lastMessageRef.current || retryCountRef.current >= MAX_RETRIES) return;

    retryCountRef.current++;
    await sendMessage(lastMessageRef.current);
  }, [sendMessage]);

  const clearChat = useCallback(() => {
    asisService.clearSession();
    setMessages([]);
    setError(null);
    setSuggestions(getDomainSuggestions(domain));
    initSession();
  }, [domain, initSession]);

  const updateSuggestions = useCallback((response: AsisResponse) => {
    // Generate follow-up suggestions based on response
    const newSuggestions: string[] = [];

    if (response.actions) {
      for (const action of response.actions) {
        if (action.type === 'suggest') {
          newSuggestions.push(action.description);
        }
      }
    }

    if (response.insights) {
      for (const insight of response.insights) {
        if (insight.type === 'recommendation') {
          newSuggestions.push(`Learn more about: ${insight.title}`);
        }
      }
    }

    // Add domain-specific defaults if few suggestions
    if (newSuggestions.length < 3) {
      newSuggestions.push(...getDomainSuggestions(domain));
    }

    setSuggestions(newSuggestions.slice(0, 5));
  }, [domain]);

  const sessionStats = session ? {
    messageCount: messages.length,
    domain: session.app,
    duration: Date.now() - new Date(session.createdAt).getTime(),
    lastActivity: session.updatedAt,
  } : {
    messageCount: 0,
    domain: 'none',
    duration: 0,
    lastActivity: '',
  };

  return {
    messages,
    isLoading,
    isTyping,
    error,
    session,
    sendMessage,
    clearChat,
    retryLastMessage,
    sessionStats,
    suggestions,
  };
}

/**
 * Get domain-specific suggestion prompts
 */
function getDomainSuggestions(domain: AsisDomain): string[] {
  const suggestions: Record<string, string[]> = {
    wallet: [
      'What is my current balance?',
      'Show my recent transactions',
      'Help me set a savings goal',
      'Is there any suspicious activity?',
      'What are the best FX rates today?',
    ],
    transport: [
      'Find me a ride to town',
      'What are the current fares?',
      'Is there traffic on my route?',
      'Book a truck for delivery',
      'Show me driver ratings',
    ],
    health: [
      'Find a doctor near me',
      'Help me book an appointment',
      'Explain my symptoms',
      'What vaccines do I need?',
      'Show my health records',
    ],
    jobs: [
      'Find jobs matching my skills',
      'Help me update my resume',
      'What skills are in demand?',
      'Prepare me for an interview',
      'Show my application status',
    ],
    civic: [
      'How do I register my business?',
      'What permits do I need?',
      'Show me local government services',
      'Help me file a complaint',
      'What are my tax obligations?',
    ],
    general: [
      'What can you help me with?',
      'Show me my MTAA dashboard',
      'Help me navigate the app',
      'What are the new features?',
      'How do I update my profile?',
    ],
  };

  return suggestions[domain] || suggestions['general'];
}

export default useAsis;
