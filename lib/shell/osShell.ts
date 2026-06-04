// lib/shell/osShell.ts
// OS Shell — global app shell provider, navigation guards, OS-level state

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface OSNotification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'error' | 'success';
  app: string;
  read: boolean;
  created_at: string;
}

export interface OSShellContextType {
  isReady: boolean;
  isLocked: boolean;
  currentApp: string | null;
  previousApp: string | null;
  notifications: OSNotification[];
  systemAlert: string | null;
  navigateTo: (route: string, params?: Record<string, any>) => void;
  goBack: () => void;
  lock: () => void;
  unlock: () => void;
  pushNotification: (notif: Omit<OSNotification, 'id' | 'created_at'>) => void;
  dismissNotification: (id: string) => void;
  markRead: (id: string) => void;
  showAlert: (message: string) => void;
  dismissAlert: () => void;
  switchApp: (app: string) => void;
}

const OSShellContext = createContext<OSShellContextType | null>(null);

export function useOSShell(): OSShellContextType {
  const ctx = useContext(OSShellContext);
  if (!ctx) {
    throw new Error('useOSShell must be used within OSShellProvider');
  }
  return ctx;
}

export function OSShellProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { user, isAuthenticated } = useAuthStore();

  const [isReady, setIsReady] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [currentApp, setCurrentApp] = useState<string | null>(null);
  const [previousApp, setPreviousApp] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<OSNotification[]>([]);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);

  useEffect(() => {
    const boot = async () => {
      await new Promise(r => setTimeout(r, 500));
      setIsReady(true);
    };
    boot();
  }, []);

  useEffect(() => {
    if (segments.length > 0) {
      const app = segments[0] === '(os)' ? segments[1] || 'home' : segments[0];
      setPreviousApp(currentApp);
      setCurrentApp(app);
    }
  }, [segments]);

  const navigateTo = useCallback((route: string, params?: Record<string, any>) => {
    if (isLocked) return;
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    router.push(route + query as any);
  }, [router, isLocked]);

  const goBack = useCallback(() => {
    if (isLocked) return;
    router.back();
  }, [router, isLocked]);

  const lock = useCallback(() => setIsLocked(true), []);
  const unlock = useCallback(() => setIsLocked(false), []);

  const pushNotification = useCallback((notif: Omit<OSNotification, 'id' | 'created_at'>) => {
    const full: OSNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [full, ...prev].slice(0, 50));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const showAlert = useCallback((message: string) => {
    setSystemAlert(message);
    setTimeout(() => setSystemAlert(null), 5000);
  }, []);

  const dismissAlert = useCallback(() => setSystemAlert(null), []);

  const switchApp = useCallback((app: string) => {
    setPreviousApp(currentApp);
    setCurrentApp(app);
    router.push(`/(os)/${app}` as any);
  }, [router, currentApp]);

  const value: OSShellContextType = {
    isReady,
    isLocked,
    currentApp,
    previousApp,
    notifications,
    systemAlert,
    navigateTo,
    goBack,
    lock,
    unlock,
    pushNotification,
    dismissNotification,
    markRead,
    showAlert,
    dismissAlert,
    switchApp,
  };

  return React.createElement(OSShellContext.Provider, { value }, children);
}

let _shellInstance: OSShellContextType | null = null;

export const osShell = {
  get instance() {
    if (!_shellInstance) {
      console.warn('[osShell] accessed before provider mount');
      return {
        isReady: false, isLocked: false, currentApp: null, previousApp: null,
        notifications: [], systemAlert: null,
        navigateTo: () => {}, goBack: () => {}, lock: () => {}, unlock: () => {},
        pushNotification: () => {}, dismissNotification: () => {}, markRead: () => {},
        showAlert: () => {}, dismissAlert: () => {}, switchApp: () => {},
      } as OSShellContextType;
    }
    return _shellInstance;
  },
  setInstance(ctx: OSShellContextType) {
    _shellInstance = ctx;
  },
};
