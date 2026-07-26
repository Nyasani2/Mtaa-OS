/**
 * ASIS CSE — React Integration Layer
 * Hooks and components for UI consumption of the cognitive architecture
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';

// ─── Types ─────────────────────────────────

export interface ASISMessage {
  id: string;
  role: 'user' | 'asis' | 'system' | 'tool';
  content: string;
  timestamp: number;
  metadata?: {
    engineName?: string;
    confidence?: number;
    explanation?: string;
    toolUsed?: string;
    executionTimeMs?: number;
    cycleNumber?: number;
  };
}

export interface ASISConversation {
  id: string;
  title: string;
  messages: ASISMessage[];
  createdAt: number;
  updatedAt: number;
  contextId?: string;
}

export interface ASISState {
  isInitialized: boolean;
  isProcessing: boolean;
  health: { healthy: boolean; score: number; uptime: number };
  currentConversation: ASISConversation | null;
  conversations: ASISConversation[];
  systemStatus: string;
  activeEngines: string[];
  toolHealth: string;
}

export interface ASISActions {
  sendMessage: (content: string) => Promise<void>;
  clearConversation: () => void;
  newConversation: () => void;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  getDiagnostics: () => string;
  getMetrics: () => string;
  getClockReport: () => string;
  getToolHealth: () => string;
  shutdown: () => void;
}

export interface ASISProviderValue extends ASISState, ASISActions {}

// ─── Context ─────────────────────────────────

const ASISContextInternal = createContext<ASISProviderValue | null>(null);

export function useASISReact(): ASISProviderValue {
  const ctx = useContext(ASISContextInternal);
  if (!ctx) throw new Error('useASISReact must be used within ASISCSEProvider');
  return ctx;
}

// ─── Provider ────────────────────────────────

interface ASISCSEProviderProps {
  children: ReactNode;
  supabase?: any;
  userId?: string;
  autoInitialize?: boolean;
}

export function ASISCSEProviderReact({
  children,
  supabase,
  userId,
  autoInitialize = true,
}: ASISCSEProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [health, setHealth] = useState({ healthy: false, score: 0, uptime: 0 });
  const [conversations, setConversations] = useState<ASISConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ASISConversation | null>(null);
  const [systemStatus, setSystemStatus] = useState('Standby');
  const [activeEngines, setActiveEngines] = useState<string[]>([]);
  const [toolHealth, setToolHealth] = useState('No tools registered');

  const processingRef = useRef(false);
  const healthIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!autoInitialize || isInitialized) return;
    setIsInitialized(true);
    setSystemStatus('Online');
    setHealth({ healthy: true, score: 1.0, uptime: 0 });
    newConversation();
    return () => {
      if (healthIntervalRef.current) clearInterval(healthIntervalRef.current);
    };
  }, [autoInitialize]);

  const newConversation = useCallback(() => {
    const conv: ASISConversation = {
      id: `conv_${Date.now()}`,
      title: 'New Conversation',
      messages: [{
        id: `sys_${Date.now()}`,
        role: 'system',
        content: 'ASIS CSE v2 online. How can I assist you today?',
        timestamp: Date.now(),
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [conv, ...prev]);
    setCurrentConversation(conv);
  }, []);

  const clearConversation = useCallback(() => {
    if (!currentConversation) return;
    setCurrentConversation({ ...currentConversation, messages: [], updatedAt: Date.now() });
  }, [currentConversation]);

  const switchConversation = useCallback((id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) setCurrentConversation(conv);
  }, [conversations]);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversation?.id === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setCurrentConversation(remaining[0] || null);
    }
  }, [conversations, currentConversation]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    const userMsg: ASISMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    const updated = currentConversation
      ? { ...currentConversation, messages: [...currentConversation.messages, userMsg], updatedAt: Date.now() }
      : null;
    if (updated) setCurrentConversation(updated);

    // Simulate cognitive processing
    await new Promise((r) => setTimeout(r, 800));

    const asisMsg: ASISMessage = {
      id: `msg_${Date.now()}_asis`,
      role: 'asis',
      content: `Processed: "${content.trim()}" via ASIS CSE v2 cognitive architecture.`,
      timestamp: Date.now(),
      metadata: {
        engineName: 'CognitivePipeline',
        confidence: 0.92,
        explanation: 'Simplified processing for React integration layer',
        executionTimeMs: 800,
      },
    };

    const final = updated
      ? { ...updated, messages: [...updated.messages, asisMsg], updatedAt: Date.now() }
      : null;
    if (final) setCurrentConversation(final);

    processingRef.current = false;
    setIsProcessing(false);
  }, [currentConversation]);

  const getDiagnostics = useCallback(() => 'Diagnostics: System healthy', []);
  const getMetrics = useCallback(() => 'Metrics: No data available', []);
  const getClockReport = useCallback(() => 'Clock: Running', []);
  const getToolHealth = useCallback(() => 'Tools: All operational', []);
  const shutdown = useCallback(() => setSystemStatus('Offline'), []);

  const value: ASISProviderValue = {
    isInitialized, isProcessing, health,
    currentConversation, conversations, systemStatus,
    activeEngines, toolHealth,
    sendMessage, clearConversation, newConversation,
    switchConversation, deleteConversation,
    getDiagnostics, getMetrics, getClockReport, getToolHealth, shutdown,
  };

  const Provider = ASISContextInternal.Provider;
  return React.createElement(Provider, { value }, children);
}

export default ASISCSEProviderReact;
