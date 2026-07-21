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
      // FIXED 2026-07-20: getPinState().isLocked means "rate-limited from
      // failed PIN attempts" (see lib/security/pin-engine.ts) — it is NOT
      // the same thing as "this session requires PIN re-entry." These were
      // being conflated, meaning a fully killed-and-reopened app would NOT
      // show the lock screen on cold start (isLocked would be false unless
      // the user happened to be rate-limited), even though a fresh app
      // launch should always require the PIN if one is set. Cold start now
      // always locks when a PIN exists; only an in-session unlock() call
      // (after the user enters a correct PIN) clears it.
      if (state.isSet) {
        setIsLocked(true);
      }
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
