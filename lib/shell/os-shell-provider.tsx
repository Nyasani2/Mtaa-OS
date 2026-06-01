import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getPinState, PinState } from '@/lib/security/pin-engine';
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

export function useOSShell() {
  const ctx = useContext(OSShellContext);
  if (!ctx) throw new Error('useOSShell must be used within OSShellProvider');
  return ctx;
}

export function OSShellProvider({ children }: { children: React.ReactNode }) {
  const { session, isLoading: authLoading } = useIdentity();

  const [pinState, setPinState] = useState<PinState | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);

  const isAuthenticated = !!session;
  const isPinSet = pinState?.isSet ?? false;
  const isLocked = pinState?.isLocked ?? false;
  const isUnlocked = isPinSet && !isLocked;

  const refreshPinState = useCallback(async () => {
    try {
      const state = await getPinState();
      setPinState(state);
    } catch (err) {
      console.warn('[OSShell] refreshPinState failed:', err);
      setPinState({ isSet: false, isLocked: false, attemptsRemaining: 5, lockoutEnd: null });
    }
  }, []);

  const unlock = useCallback(() => {
    setPinState(prev => prev
      ? { ...prev, isLocked: false }
      : { isSet: true, isLocked: false, attemptsRemaining: 5, lockoutEnd: null }
    );
  }, []);

  const lock = useCallback(() => {
    setPinState(prev => prev
      ? { ...prev, isLocked: true }
      : { isSet: true, isLocked: true, attemptsRemaining: 5, lockoutEnd: null }
    );
  }, []);

  useEffect(() => {
    if (authLoading) return;

    let mounted = true;
    setIsBooting(true);
    setBootError(null);

    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('[OSShell] PIN check timed out');
        setPinState({ isSet: false, isLocked: false, attemptsRemaining: 5, lockoutEnd: null });
        setIsBooting(false);
      }
    }, 3000);

    refreshPinState().then(() => {
      clearTimeout(timeout);
      if (mounted) setIsBooting(false);
    }).catch(err => {
      clearTimeout(timeout);
      if (mounted) {
        console.error('[OSShell] Boot failed:', err);
        setBootError('Failed to initialize. Please restart the app.');
        setIsBooting(false);
      }
    });

    return () => { mounted = false; clearTimeout(timeout); };
  }, [authLoading, session, refreshPinState]);

  return (
    <OSShellContext.Provider value={{
      isBooting,
      isAuthenticated,
      isPinSet,
      isLocked,
      isUnlocked,
      bootError,
      unlock,
      lock,
      refreshPinState,
    }}>
      {children}
    </OSShellContext.Provider>
  );
}
