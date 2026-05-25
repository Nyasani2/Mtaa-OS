// lib/kernel/ai/asis-provider.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

interface ASISMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface ASISContextValue {
  messages: ASISMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

const ASISContext = createContext<ASISContextValue | undefined>(undefined);

export function ASISProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ASISMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: ASISMessage = {
      id: Math.random().toString(36).slice(2),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // In production, call ASIS AI API
    await new Promise(r => setTimeout(r, 1000));

    const assistantMsg: ASISMessage = {
      id: Math.random().toString(36).slice(2),
      role: 'assistant',
      content: 'This is a placeholder ASIS response. Connect to your AI backend.',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, assistantMsg]);
    setIsLoading(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <ASISContext.Provider value={{ messages, isLoading, sendMessage, clearMessages }}>
      {children}
    </ASISContext.Provider>
  );
}

export function useASIS(): ASISContextValue {
  const context = useContext(ASISContext);
  if (!context) throw new Error('useASIS must be used within ASISProvider');
  return context;
}
