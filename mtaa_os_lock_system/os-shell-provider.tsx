import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getPinState, hasPin } from '@/lib/security/pin-engine';
import { useIdentity } from '@/lib/auth/use-identity';

interface OSShellContextType {
  isBooting: boolean;
  isAuthenticated: boolean;
  isPinSet: boolean;
  isLocked: boolean;
  isUnlocked: boolean;
  bootError: string | null;
  unlock: () => void;
  lock: () => void;
  refreshPinState: () => Promise<void>;
}

const OSShellContext = createContext<OSShellContextType | null>(null);

export function useOSShell(): OSShellContextType {
  const context = useContext(OSShellContext);
  if (!context) {
    throw new Error('useOSShell must be used within an OSShellProvider');
  }
  return context;
}

export function OSShellProvider({ children }: { children: React.ReactNode }) {
  const { session, isLoading: authLoading } = useIdentity();
  const [isBooting, setIsBooting] = useState(true);
  const [isPinSet, setIsPinSet] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  const refreshPinState = useCallback(async () => {
    try {
      const state = await getPinState();
      setIsPinSet(state.isSet);
      setIsLocked(state.isLocked || (state.isSet && !state.isLocked ? false : state.isLocked));
    } catch (e) {
      console.error('[OSShell] Pin state refresh failed:', e);
    }
  }, []);

  // Boot sequence
  useEffect(() => {
    if (authLoading) return;

    const boot = async () => {
      try {
        await refreshPinState();
        setIsBooting(false);
      } catch (e) {
        setBootError('Failed to initialize OS shell');
        setIsBooting(false);
      }
    };

    boot();
  }, [authLoading, refreshPinState]);

  // Auto-lock on app background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Lock when app goes to background (if PIN is set)
        if (isPinSet) {
          setIsLocked(true);
        }
      }
    });

    return () => subscription.remove();
  }, [isPinSet]);

  const unlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  const lock = useCallback(() => {
    if (isPinSet) {
      setIsLocked(true);
    }
  }, [isPinSet]);

  const isAuthenticated = !!session;
  const isUnlocked = isAuthenticated && isPinSet && !isLocked;

  return (
    <OSShellContext.Provider
      value={{
        isBooting,
        isAuthenticated,
        isPinSet,
        isLocked,
        isUnlocked,
        bootError,
        unlock,
        lock,
        refreshPinState,
      }}
    >
      {children}
    </OSShellContext.Provider>
  );
}
