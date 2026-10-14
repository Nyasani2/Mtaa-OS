import { CognitiveKernel } from './asis-cse-kernel';
import { Platform } from 'react-native';
import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { initializeASIS, shutdownASIS, ASISSystem } from './asis-cse-init';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { ASISMessage, ASISConversation, ASISProviderValue } from './asis-cse-types';

const STORAGE_KEY = 'asis_conversations_v1';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
    return { score: 1.0, status: 'Healthy' };
  }, []);

  useEffect(() => {
    if (!autoInitialize || isInitialized) return;
    const init = async () => {
      try {
        systemRef.current = initializeASIS({ userId, context: 'web', config: { enableResearch: true } });
        
        // Initialize and start the Cognitive Kernel
        try {
          const kernel = new (await import('./asis-cse-kernel')).CognitiveKernel();
          (globalThis as any).__asisKernelInstance = kernel;
          await kernel.initialize();
          kernel.start();
          console.log('[ASIS Provider] Cognitive Kernel started.');
        } catch (err) {
          console.warn('[ASIS Provider] Kernel start failed:', err);
        }

        setIsInitialized(true);
        setSystemStatus('Online');
        setHealth(computeHealth());
        const loaded = loadConversations();
        if (loaded.length > 0) {
          setConversations(loaded);
          setCurrentConversation(loaded[0]);
        } else {
          const conv: ASISConversation = { id: generateUUID(), title: 'New Conversation', messages: [{ id: generateUUID(), role: 'system', content: 'ASIS online.', timestamp: Date.now() }], createdAt: Date.now(), updatedAt: Date.now() };
          setConversations([conv]);
          setCurrentConversation(conv);
        }
      } catch (err: any) {
        console.error('[ASIS Provider] Initialization failed:', err);
        setSystemStatus(`Error: ${err.message}`);
      }
    };
    init();
    return () => {
      if (healthIntervalRef.current) clearInterval(healthIntervalRef.current);
      shutdownASIS();
    };
  }, [autoInitialize, userId, computeHealth]);

  useEffect(() => { if (conversations.length > 0) saveConversations(conversations); }, [conversations]);

  const updateConversation = useCallback((conv: ASISConversation) => {
    setConversations((prev) => {
      const updated = prev.map((c) => (c.id === conv.id ? conv : c));
      saveConversations(updated);
      return updated;
    });
    setCurrentConversation(conv);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!systemRef.current || !currentConversation || processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    setSystemStatus('Processing...');

    const userMsg: ASISMessage = { id: generateUUID(), role: 'user', content, timestamp: Date.now() };
    const convWithUser = { ...currentConversation, messages: [...currentConversation.messages, userMsg], updatedAt: Date.now() };
    updateConversation(convWithUser);

    try {
      let result: any;
        try {
          // Timeout wrapper to prevent UI freeze
          const kernelPromise = CognitiveKernel.execute({
            identity: userId,
            purpose: 'user_query',
            query: content,
            context: { 
              conversationId: currentConversation?.id,
              // PASS FULL HISTORY FOR MEMORY RETRIEVAL
              history: currentConversation.messages.map(m => ({ role: m.role, content: m.content }))
            }
          });
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000));
          result = await Promise.race([kernelPromise, timeoutPromise]);
        } catch (err) {
          console.warn('[ASIS] Kernel timeout or error, using fallback:', err);
          result = { response: "ASIS Cognitive Kernel is currently initializing. Please try again in a moment.", metadata: { engine: 'Fallback', confidence: 0.5 } };
        }
      
      const asisMsg: ASISMessage = {
        id: generateUUID(), role: 'asis', content: result.response, timestamp: Date.now(),
        metadata: { engineName: result.metadata?.engine, confidence: result.metadata?.confidence }
      };

      const finalConv = {
        ...convWithUser,
        messages: [...convWithUser.messages, asisMsg],
        title: convWithUser.title === 'New Conversation' ? content.slice(0, 30) + '...' : convWithUser.title,
        updatedAt: Date.now(),
      };
      updateConversation(finalConv);
      setActiveEngines(['LocalQwen', 'ReasoningV2']);
      setSystemStatus('Online');
    } catch (err: any) {
      console.error('[ASIS] Processing error:', err);
      setSystemStatus('Error');
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [currentConversation, updateConversation]);

  const value: ASISProviderValue = {
    isInitialized, isProcessing, systemStatus, activeEngines, toolHealth, health,
    currentConversation, conversations, sendMessage,
    clearConversation: () => {}, newConversation: () => {}, switchConversation: () => {},
    deleteConversation: () => {}, getDiagnostics: () => 'OK', getMetrics: () => 'OK',
    getClockReport: () => 'OK', getToolHealth: () => 'OK', shutdown: () => {},
  };

  return <ASISContext.Provider value={value}>{children}</ASISContext.Provider>;
}

export default ASISCSEProvider;
