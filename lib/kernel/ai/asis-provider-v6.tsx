import React, { createContext, useContext, useState, useCallback } from 'react';
import { asisEngine, ASISResponse } from '../../asis-v6/engine';

interface Source {
  title: string;
  url: string;
  source: string;
}

interface Message {
  id: string;
  role: 'user' | 'asis';
  content: string;
  sources: Source[];
  images: string[];
  relatedQuestions: string[];
  timestamp: number;
  toolUsed?: string;
}

interface ASISContextType {
  messages: Message[];
  isThinking: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
}

const ASISContext = createContext<ASISContextType | null>(null);

export function ASISProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'asis',
      content: "Hello! I'm ASIS. I can search the web, query your database, help with code, and answer questions. What would you like to know?",
      sources: [],
      images: [],
      relatedQuestions: [],
      timestamp: Date.now()
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      sources: [],
      images: [],
      relatedQuestions: [],
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const response = await asisEngine.processQuery(text.trim());

      const asisMsg: Message = {
        id: `asis-${Date.now()}`,
        role: 'asis',
        content: response.text,
        sources: response.sources,
        images: response.images,
        relatedQuestions: response.relatedQuestions,
        timestamp: Date.now(),
        toolUsed: response.toolUsed
      };

      setMessages(prev => [...prev, asisMsg]);
    } catch (e) {
      const errorMsg: Message = {
        id: `asis-err-${Date.now()}`,
        role: 'asis',
        content: 'Sorry, something went wrong. Please try again.',
        sources: [],
        images: [],
        relatedQuestions: [],
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  }, [isThinking]);

  const clearChat = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'asis',
      content: "Hello! I'm ASIS. I can search the web, query your database, help with code, and answer questions. What would you like to know?",
      sources: [],
      images: [],
      relatedQuestions: [],
      timestamp: Date.now()
    }]);
  }, []);

  return (
    <ASISContext.Provider value={{ messages, isThinking, sendMessage, clearChat }}>
      {children}
    </ASISContext.Provider>
  );
}

export function useASIS() {
  const ctx = useContext(ASISContext);
  if (!ctx) throw new Error('useASIS must be used within ASISProvider');
  return ctx;
}
