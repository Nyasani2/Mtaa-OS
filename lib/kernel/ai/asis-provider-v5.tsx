import React, { createContext, useContext, useState, useCallback } from 'react';
import { asisEngine, ASISResponse, ASISState } from '../../asis-v5/engine';

interface Message {
  id: string;
  role: 'user' | 'asis';
  content: string;
  sources?: string[];
  timestamp: number;
  toolUsed?: string;
}

interface ASISContextType {
  messages: Message[];
  isThinking: boolean;
  activeTool: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  graphStats: { totalNodes: number; verifiedNodes: number };
}

const ASISContext = createContext<ASISContextType | null>(null);

export function ASISProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'asis',
      content: 'Hello! I am ASIS. How can I help you today?',
      timestamp: Date.now()
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [graphStats, setGraphStats] = useState({ totalNodes: 0, verifiedNodes: 0 });

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const response = await asisEngine.processQuery(text);

      const asisMsg: Message = {
        id: `asis-${Date.now()}`,
        role: 'asis',
        content: response.text,
        sources: response.sources,
        timestamp: Date.now(),
        toolUsed: response.toolUsed
      };

      setMessages(prev => [...prev, asisMsg]);
      setActiveTool(response.toolUsed);

      // Update stats
      const stats = asisEngine.getGraphStats();
      setGraphStats({
        totalNodes: stats.totalNodes,
        verifiedNodes: stats.verifiedNodes
      });
    } catch (e) {
      const errorMsg: Message = {
        id: `asis-err-${Date.now()}`,
        role: 'asis',
        content: 'I encountered an unexpected error. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'asis',
      content: 'Hello! I am ASIS. How can I help you today?',
      timestamp: Date.now()
    }]);
  }, []);

  return (
    <ASISContext.Provider value={{
      messages,
      isThinking,
      activeTool,
      sendMessage,
      clearChat,
      graphStats
    }}>
      {children}
    </ASISContext.Provider>
  );
}

export function useASIS() {
  const ctx = useContext(ASISContext);
  if (!ctx) throw new Error('useASIS must be used within ASISProvider');
  return ctx;
}
