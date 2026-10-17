import { CognitiveKernel } from './asis-cse-kernel';
import { Platform } from 'react-native';
import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { initializeASIS, shutdownASIS, ASISSystem } from './asis-cse-init';
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

// SAFE STORAGE: Prevents window.localStorage crashes on React Native
function loadConversations(): ASISConversation[] {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.filter((conv: any) => isValidUUID(conv.id));
      }
    }
  } catch (err) {
    console.warn("Failed to load ASIS conversations:", err);
  }
  return [];
}

function saveConversations(convs: ASISConversation[]) {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
    }
  } catch (err) {
    console.warn("Failed to save ASIS conversations:", err);
  }
}

interface ASISCSEProviderProps {
  children: ReactNode;
  userId?: string;
  userName?: string;
  autoInitialize?: boolean;
}

export function ASISCSEProvider({
  children,
  userId: propUserId,
  userName: propUserName,
  autoInitialize = true,
}: ASISCSEProviderProps) {
  // Get real user from auth store, fallback to props, fallback to 'anonymous'
  const { user } = useAuthStore();
  const activeUserId = user?.id || propUserId || 'anonymous';
  const activeUserName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || propUserName || 'User';

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
    if (!systemRef.current || !isInitialized) return { score: 0, status: 'Offline' };
    return { score: 1.0, status: 'Healthy' };
  }, [isInitialized]);

  useEffect(() => {
    if (!autoInitialize || isInitialized) return;

    const init = async () => {
      try {
        setSystemStatus('Initializing...');
        systemRef.current = await initializeASIS();
        setIsInitialized(true);
        setSystemStatus('Online');
        setHealth(computeHealth());
        
        const existing = conversations[0];
        if (existing) {
          setCurrentConversation(existing);
        } else {
          const newConv: any = {
            id: generateUUID(),
            title: 'New Conversation',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          const updated = [...conversations, newConv];
          setConversations(updated);
          saveConversations(updated);
          setCurrentConversation(newConv);
        }
      } catch (err) {
        console.error("ASIS Initialization failed:", err);
        setSystemStatus('Error');
      }
    };

    init();

    return () => {
      if (systemRef.current) {
        shutdownASIS();
        systemRef.current = null;
      }
      if (healthIntervalRef.current) {
        clearInterval(healthIntervalRef.current);
      }
    };
  }, [autoInitialize, isInitialized]);

  const sendMessage = useCallback(async (content: string) => {
    if (!currentConversation || !systemRef.current || processingRef.current) return;
    
    processingRef.current = true;
    setIsProcessing(true);

    const userMsg: ASISMessage = {
      id: generateUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const updatedMessages = [...currentConversation.messages, userMsg];
    const updatedConv = { ...currentConversation, messages: updatedMessages, updatedAt: Date.now() };
    
    setCurrentConversation(updatedConv);
    
    const updatedConvs = conversations.map(c => c.id === updatedConv.id ? updatedConv : c);
    setConversations(updatedConvs);
    saveConversations(updatedConvs);

    try {
      // process expects a string based on existing types
      const response = await systemRef.current.process(content);

      const aiMsg: ASISMessage = {
        id: generateUUID(),
        role: 'asis',
        content: typeof response === 'string' ? response : (response?.response || "I'm sorry, I couldn't process that request."),
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, aiMsg];
      const finalConv = { ...updatedConv, messages: finalMessages, updatedAt: Date.now() };
      
      setCurrentConversation(finalConv);
      const finalConvs = conversations.map(c => c.id === finalConv.id ? finalConv : c);
      setConversations(finalConvs);
      saveConversations(finalConvs);

    } catch (err) {
      console.error("ASIS Processing error:", err);
      const errorMsg: ASISMessage = {
        id: generateUUID(),
        role: 'asis',
        content: "I encountered an error processing your request. Please try again.",
        timestamp: Date.now(),
      };
      const errorConvs = conversations.map(c => c.id === currentConversation.id ? { ...c, messages: [...c.messages, errorMsg] } : c);
      setConversations(errorConvs);
      saveConversations(errorConvs);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [currentConversation, conversations]);

  const newConversation = useCallback(() => {
    const newConv: any = {
      id: generateUUID(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newConv, ...conversations];
    setConversations(updated);
    saveConversations(updated);
    setCurrentConversation(newConv);
  }, [conversations]);

  const switchConversation = useCallback((id: string) => {
    const target = conversations.find(c => c.id === id);
    if (target) {
      setCurrentConversation(target);
    }
  }, [conversations]);

  const clearConversation = useCallback(() => {
    if (!currentConversation) return;
    const cleared = { ...currentConversation, messages: [], updatedAt: Date.now() };
    setCurrentConversation(cleared);
    const updated = conversations.map(c => c.id === cleared.id ? cleared : c);
    setConversations(updated);
    saveConversations(updated);
  }, [currentConversation, conversations]);

  const deleteConversation = useCallback((id: string) => {
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    saveConversations(updated);
    if (currentConversation?.id === id) {
      setCurrentConversation(updated[0] || null);
    }
  }, [conversations, currentConversation]);

  const value: ASISProviderValue = {
    isInitialized,
    isProcessing,
    systemStatus,
    activeEngines,
    toolHealth,
    health,
    conversations,
    currentConversation,
    sendMessage,
    newConversation,
    switchConversation,
    clearConversation,
    deleteConversation,
    getDiagnostics: () => 'Diagnostics not yet implemented',
    getMetrics: () => 'Metrics not yet implemented',
    getClockReport: () => 'Clock report not yet implemented',
    getToolHealth: () => toolHealth,
    shutdown: () => {
      if (systemRef.current) {
        shutdownASIS();
        systemRef.current = null;
        setIsInitialized(false);
      }
    },
  };

  return (
    <ASISContext.Provider value={value}>
      {children}
    </ASISContext.Provider>
  );
}
