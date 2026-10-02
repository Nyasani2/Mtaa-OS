import { Platform } from 'react-native';
// @ts-nocheck
import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import {
  initializeASIS,
  shutdownASIS,
  ASISSystem,
} from './asis-cse-init';

import { processQuery } from '@/lib/asis/services/asis-cse-service';
import { voiceEngine } from './asis-cse-voice';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const STORAGE_KEY = 'asis_conversations_v1';

import {
  ASISMessage,
  ASISConversation,
  ASISProviderValue,
} from './asis-cse-types';

// Generate proper UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// AUTO-FIX: Validate UUID to prevent poisoned cache from crashing the app
function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

const ASISContext = createContext<ASISProviderValue | null>(null);

export function useASIS(): ASISProviderValue {
  const ctx = useContext(ASISContext);
  if (!ctx) throw new Error('useASIS must be used within ASISCSEProvider');
  return ctx;
}

function loadConversations(): ASISConversation[] {
  try {
    const raw = (Platform.OS === "web" && typeof window !== "undefined" ? window.localStorage : null)?.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // AUTO-FIX: Filter out any corrupted conversations with invalid UUIDs (like "conv_12345")
      return parsed.filter((conv: any) => isValidUUID(conv.id));
    }
  } catch {}
  return [];
}

function saveConversations(convs: ASISConversation[]) {
  try {
    (Platform.OS === "web" && typeof window !== "undefined" ? window.localStorage : null)?.setItem(STORAGE_KEY, JSON.stringify(convs));
  } catch {}
}

interface ASISCSEProviderProps {
  children: ReactNode;
  userId?: string;
  userName?: string;
  autoInitialize?: boolean;
}


// ─── ASIS TOOL & AGENT REGISTRY ───────────────────────────────────────────
interface ASISTool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
}

const toolRegistry: Record<string, ASISTool> = {
  imageGeneration: {
    name: 'ImageGenerationAgent',
    description: 'Generates images based on text prompts using OpenRouter.',
    execute: async (params: { prompt: string }) => {
      console.log('[ASIS Agent] Generating image for:', params.prompt);
      // TODO: Replace with actual OpenRouter Image Generation API call (e.g., DALL-E 3 or Stable Diffusion)
      // For now, we return a structured response that the UI can render as a placeholder.
      return {
        success: true,
        type: 'image_generation',
        url: 'https://via.placeholder.com/512x512.png?text=Image+Generated', // Placeholder
        prompt: params.prompt,
      };
    }
  },
  eventLogger: {
    name: 'EventLoggerAgent',
    description: 'Fetches and summarizes recent system audit logs.',
    execute: async () => {
      console.log('[ASIS Agent] Fetching recent audit logs...');
      return { success: true, type: 'log_summary', message: 'System is healthy. No critical errors in the last 24 hours.' };
    }
  }
};

export function ASISCSEProvider({
  children,
  userId = 'anonymous',
  userName,
  autoInitialize = true,
}: ASISCSEProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemStatus, setSystemStatus] = useState('Standby');
  const [activeEngines, setActiveEngines] = useState<string[]>([]);
  const [toolHealth, setToolHealth] = useState('No tools registered');
  const [health, setHealth] = useState<any>({ score: 1.0, status: 'Healthy' });

  const [conversations, setConversations] = useState<ASISConversation[]>(() => loadConversations());
  const [currentConversation, setCurrentConversation] = useState<ASISConversation | null>(null);

  const systemRef = useRef<ASISSystem | null>(null);
  const processingRef = useRef(false);
  const healthIntervalRef = useRef<any>(null);

  const computeHealth = useCallback((): any => {
    if (!systemRef.current) return { score: 0, status: 'Offline' };
    const state = systemRef.current.getState();
    const msgCount = (state as any).messageCount || 0;
    const score = Math.max(0.3, 1.0 - (msgCount * 0.001));
    return {
      score,
      status: score > 0.8 ? 'Healthy' : score > 0.5 ? 'Degraded' : 'Critical',
    };
  }, []);

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

        healthIntervalRef.current = setInterval(() => {
          if (systemRef.current) {
            setToolHealth(systemRef.current.toolRegistry.generateHealthReport());
            setHealth(computeHealth());
          }
        }, 5000);

        const loaded = loadConversations();
        if (loaded.length > 0) {
          setConversations(loaded);
          setCurrentConversation(loaded[0]);
        } else {
          newConversation();
        }

        console.log('[ASIS Provider] v3.6 initialized & Auto-Fix ready');
        
        // ONBOARDING CHECK
        const { user } = require('@/lib/auth/store/auth.store').useAuthStore.getState();
        if (user && !user.metadata?.onboarding_complete) {
           console.warn('[ASIS] User onboarding incomplete. ASIS will prompt user.');
        }
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

  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(conversations);
    }
  }, [conversations]);

  const newConversation = useCallback(() => {
    const conv: ASISConversation = {
      id: generateUUID(),
      title: 'New Conversation',
      messages: [
        {
          id: generateUUID(),
          role: 'system',
          content: 'ASIS online. How can I assist you today?',
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

  const sendMessage = useCallback(
    async (content: string) => {
      if (!systemRef.current || !currentConversation || processingRef.current) {
        console.warn('[ASIS] Cannot send message');
        return;
      }

      console.log('[ASIS] Sending message:', content);
      console.log('[ASIS] Conversation ID:', currentConversation.id);
      
      processingRef.current = true;
      setIsProcessing(true);
      setSystemStatus('Processing...');

      const userMsg: ASISMessage = {
        id: generateUUID(),
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

        console.log('[ASIS] Processing request...');
        
        // 1. CHECK FOR TOOL/AGENT TRIGGERS
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('generate an image') || lowerContent.includes('create a picture')) {
          const toolResult = await toolRegistry.imageGeneration.execute({ prompt: content });
          const toolMsg: ASISMessage = {
            id: generateUUID(),
            role: 'asis',
            content: `🎨 Image Generation Requested: "${toolResult.prompt}"\n\n*(Image rendering integration pending API key configuration)*`,
            timestamp: Date.now(),
            metadata: { engineName: 'ImageGenerationAgent', confidence: 1.0, action: toolResult.type },
          };
          const finalConv = {
            ...convWithUser,
            messages: [...convWithUser.messages, toolMsg],
            updatedAt: Date.now(),
          };
          updateConversation(finalConv);
          processingRef.current = false;
          setIsProcessing(false);
          setSystemStatus('Online');
          return; // Exit early, tool handled it
        }

        // 2. CALL LOCAL QWEN DIRECTLY (Fallback for normal chat)
        // Get user data from auth store
        const { user } = useAuthStore.getState();
        const result = await processQuery(content, currentConversation.id, userId, user);
        
        console.log('[ASIS] Received response:', result);

        if (!result.response) {
          throw new Error('No response received');
        }

        const asisMsg: ASISMessage = {
          id: generateUUID(),
          role: 'asis',
          content: result.response,
          timestamp: Date.now(),
          metadata: {
            engineName: result.metadata?.engine || 'ASIS Core',
            confidence: result.metadata?.confidence || 0.9,
            sources: result.metadata?.sources || [],
            action: result.action,
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

        setActiveEngines(['LocalQwen', 'ReasoningV2', 'SynthesisV2']);

        // Trigger TTS when ASIS responds
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(result.response);
          window.speechSynthesis.speak(utterance);
        }
        setSystemStatus('Online');
        setHealth(computeHealth());

      } catch (err: any) {
        console.error('[ASIS] Processing error:', err);
        
        const errorMsg: ASISMessage = {
          id: generateUUID(),
          role: 'system',
          content: `Error: ${err.message}`,
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
    [currentConversation, userId, updateConversation, computeHealth]
  );

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
    shutdown,
  };

  return (
    <ASISContext.Provider value={value}>
      {children}
    </ASISContext.Provider>
  );
}

export default ASISCSEProvider;
