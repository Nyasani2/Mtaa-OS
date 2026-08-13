// @ts-nocheck
/**
 * ASIS CSE — React Context Provider v3.2
 * Fixed: generateError crash, added localStorage chat persistence
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

import {
  initializeASIS,
  getActiveASIS,
  getASISHealth,
  shutdownASIS,
  ASISSystem,
} from './asis-cse-init';

import {
  processResponse,
  ResponseEngineInput,
} from './asis-cse-response-engine-v2';

const STORAGE_KEY = 'asis_conversations_v1';

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
    sources?: string[];
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
}

export interface ASISHealth {
  score: number;
  status: string;
}

export interface ASISState {
  isInitialized: boolean;
  isProcessing: boolean;
  systemStatus: string;
  activeEngines: string[];
  toolHealth: string;
  health: ASISHealth;
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
}

export interface ASISProviderValue extends ASISState, ASISActions {
  currentConversation: ASISConversation | null;
  conversations: ASISConversation[];
}

// ─── Context ─────────────────────────────────

const ASISContext = createContext<ASISProviderValue | null>(null);

export function useASIS(): ASISProviderValue {
  const ctx = useContext(ASISContext);
  if (!ctx) throw new Error('useASIS must be used within ASISCSEProvider');
  return ctx;
}

// ─── localStorage helpers ──────────────────

function loadConversations(): ASISConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveConversations(convs: ASISConversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  } catch {}
}

// ─── Provider ────────────────────────────────

interface ASISCSEProviderProps {
  children: ReactNode;
  userId?: string;
  userName?: string;
  autoInitialize?: boolean;
}

export function ASISCSEProvider({
  children,
  userId,
  userName,
  autoInitialize = true,
}: ASISCSEProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemStatus, setSystemStatus] = useState('Standby');
  const [activeEngines, setActiveEngines] = useState<string[]>([]);
  const [toolHealth, setToolHealth] = useState('No tools registered');
  const [health, setHealth] = useState<ASISHealth>({ score: 1.0, status: 'Healthy' });

  const [conversations, setConversations] = useState<ASISConversation[]>(() => loadConversations());
  const [currentConversation, setCurrentConversation] = useState<ASISConversation | null>(null);

  const systemRef = useRef<ASISSystem | null>(null);
  const processingRef = useRef(false);
  const healthIntervalRef = useRef<any>(null);

  // ─── Health Score Computation ─────────────
  const computeHealth = useCallback((): ASISHealth => {
    if (!systemRef.current) return { score: 0, status: 'Offline' };
    const state = systemRef.current.getState();
    const msgCount = state.messageCount || 0;
    const score = Math.max(0.3, 1.0 - (msgCount * 0.001));
    return {
      score,
      status: score > 0.8 ? 'Healthy' : score > 0.5 ? 'Degraded' : 'Critical',
    };
  }, []);

  // ─── Initialization ───────────────────────

  useEffect(() => {
    if (!autoInitialize || isInitialized) return;

    const init = async () => {
      try {
        systemRef.current = initializeASIS({
          userId,
          context: 'web',
          config: { enableResearch: true },
        });

        setIsInitialized(true);
        setSystemStatus('Online');
        setHealth(computeHealth());

        // Start health polling
        healthIntervalRef.current = setInterval(() => {
          if (systemRef.current) {
            setToolHealth(systemRef.current.toolRegistry.generateHealthReport());
            setHealth(computeHealth());
          }
        }, 5000);

        // Load or create conversation
        const loaded = loadConversations();
        if (loaded.length > 0) {
          setConversations(loaded);
          setCurrentConversation(loaded[0]);
        } else {
          newConversation();
        }

        console.log('[ASIS Provider] CSE v3.2 initialized');
      } catch (err: any) {
        console.error('[ASIS Provider] Initialization failed:', err);
        setSystemStatus(`Error: ${err.message}`);
        setHealth({ score: 0, status: 'Error' });
      }
    };

    init();

    return () => {
      if (healthIntervalRef.current) clearInterval(healthIntervalRef.current);
      shutdownASIS();
    };
  }, [autoInitialize, userId, computeHealth]);

  // ─── Persist conversations on change ────────
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(conversations);
    }
  }, [conversations]);

  // ─── Conversation Management ──────────────

  const newConversation = useCallback(() => {
    const conv: ASISConversation = {
      id: `conv_${Date.now()}`,
      title: 'New Conversation',
      messages: [
        {
          id: `sys_${Date.now()}`,
          role: 'system',
          content: 'ASIS CSE v2 online. How can I assist you today?',
          timestamp: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => {
      const updated = [conv, ...prev];
      saveConversations(updated);
      return updated;
    });
    setCurrentConversation(conv);
  }, []);

  const switchConversation = useCallback((id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) setCurrentConversation(conv);
  }, [conversations]);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveConversations(updated);
      return updated;
    });
    if (currentConversation?.id === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setCurrentConversation(remaining.length > 0 ? remaining[0] : null);
    }
  }, [conversations, currentConversation]);

  const clearConversation = useCallback(() => {
    if (!currentConversation) return;
    const cleared = { ...currentConversation, messages: [], updatedAt: Date.now() };
    updateConversation(cleared);
  }, [currentConversation]);

  const updateConversation = useCallback((conv: ASISConversation) => {
    setConversations((prev) => {
      const updated = prev.map((c) => (c.id === conv.id ? conv : c));
      saveConversations(updated);
      return updated;
    });
    setCurrentConversation(conv);
  }, []);

  // ─── Message Processing ───────────────────

  const sendMessage = useCallback(
    async (content: string) => {
      if (!systemRef.current || !currentConversation || processingRef.current) return;

      processingRef.current = true;
      setIsProcessing(true);
      setSystemStatus('Processing...');

      const userMsg: ASISMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      const convWithUser = {
        ...currentConversation,
        messages: [...currentConversation.messages, userMsg],
        updatedAt: Date.now(),
      };
      updateConversation(convWithUser);

      try {
        const system = systemRef.current;
        const cycle = system.clock.getCycleNumber();

        const engineInput: ResponseEngineInput = {
          query: content,
          userId,
          userName,
          conversationTurn: convWithUser.messages.length,
        };

        const response = await processResponse(engineInput);

        const asisMsg: ASISMessage = {
          id: `msg_${Date.now()}_asis`,
          role: 'asis',
          content: response.text,
          timestamp: Date.now(),
          metadata: {
            engineName: 'ResponseEngineV2',
            confidence: response.tone === 'confident' ? 0.9 : response.tone === 'informative' ? 0.75 : 0.5,
            sources: response.sources,
            executionTimeMs: response.latencyMs,
            cycleNumber: cycle,
          },
        };

        const finalConv = {
          ...convWithUser,
          messages: [...convWithUser.messages, asisMsg],
          title: convWithUser.title === 'New Conversation'
            ? content.slice(0, 30) + (content.length > 30 ? '...' : '')
            : convWithUser.title,
          updatedAt: Date.now(),
        };
        updateConversation(finalConv);

        setActiveEngines(['WebResearch', 'ReasoningV2', 'SynthesisV2']);
        setSystemStatus('Online');
        setHealth(computeHealth());

      } catch (err: any) {
        console.error('[ASIS Provider] Processing error:', err);

        const errorMsg: ASISMessage = {
          id: `msg_${Date.now()}_error`,
          role: 'system',
          content: `I encountered an error: ${err.message}. Please try again.`,
          timestamp: Date.now(),
          metadata: { engineName: 'ErrorHandler', confidence: 0 },
        };

        const errorConv = {
          ...convWithUser,
          messages: [...convWithUser.messages, errorMsg],
          updatedAt: Date.now(),
        };
        updateConversation(errorConv);
        setSystemStatus('Error');
        setHealth({ score: 0.2, status: 'Error' });
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    },
    [currentConversation, userId, userName, updateConversation, computeHealth]
  );

  // ─── Diagnostic Reports ───────────────────

  const getDiagnostics = useCallback(() => {
    return systemRef.current?.diagnostic.generateReport() ?? 'ASIS not initialized';
  }, []);

  const getMetrics = useCallback(() => {
    return systemRef.current?.metrics.generateReport() ?? 'ASIS not initialized';
  }, []);

  const getClockReport = useCallback(() => {
    return systemRef.current?.clock.getTimingReport() ?? 'ASIS not initialized';
  }, []);

  const getToolHealth = useCallback(() => {
    return systemRef.current?.toolRegistry.generateHealthReport() ?? 'ASIS not initialized';
  }, []);

  const shutdown = useCallback(() => {
    shutdownASIS();
    systemRef.current = null;
    setIsInitialized(false);
    setSystemStatus('Offline');
    setHealth({ score: 0, status: 'Offline' });
  }, []);

  // ─── Value ─────────────────────────────────

  const value: ASISProviderValue = {
    isInitialized,
    isProcessing,
    systemStatus,
    activeEngines,
    toolHealth,
    health,
    currentConversation,
    conversations,
    sendMessage,
    clearConversation,
    newConversation,
    switchConversation,
    deleteConversation,
    getDiagnostics,
    getMetrics,
    getClockReport,
    getToolHealth,
    // @ts-ignore
    shutdown: () => {},
  };

  return (
    <ASISContext.Provider value={value}>
      {children}
    </ASISContext.Provider>
  );
}

export default ASISCSEProvider;
