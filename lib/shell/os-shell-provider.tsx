import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getPinState } from '@/lib/security/pin-engine';
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
  const hasBooted = useRef(false);

  const refreshPinState = useCallback(async () => {
    try {
      const state = await getPinState();
      setIsPinSet(state.isSet);
      setIsLocked(state.isLocked);
      console.log('[OSShell] PIN state:', state);
    } catch (err) {
      console.warn('[OSShell] PIN check failed:', err);
      setIsPinSet(false);
      setIsLocked(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      console.log('[OSShell] Waiting for identity...');
      return;
    }
    if (hasBooted.current) {
      console.log('[OSShell] Already booted, skipping');
      return;
    }

    hasBooted.current = true;
    console.log('[OSShell] Starting boot sequence...');

    const boot = async () => {
      try {
        await refreshPinState();
        console.log('[OSShell] Boot complete');
      } catch (err) {
        console.error('[OSShell] Boot error:', err);
        setBootError(String(err));
      } finally {
        setIsBooting(false);
      }
    };

    const safetyTimeout = setTimeout(() => {
      console.warn('[OSShell] Boot safety timeout - forcing isBooting=false');
      setIsBooting(false);
    }, 3000);

    boot().then(() => clearTimeout(safetyTimeout));

    return () => clearTimeout(safetyTimeout);
  }, [authLoading, refreshPinState]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    console.log('[OSShell] Unlocked');
  }, []);

  const lock = useCallback(() => {
    setIsLocked(true);
    console.log('[OSShell] Locked');
  }, []);

  const value: OSShellContextType = {
    isBooting,
    isAuthenticated: !!session,
    isPinSet,
    isLocked,
    isUnlocked: !isLocked,
    bootError,
    unlock,
    lock,
    refreshPinState,
  };

  return (
    <OSShellContext.Provider value={value}>
      {children}
    </OSShellContext.Provider>
  );
}
