// lib/shell/os-shell-provider.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

export interface OSShellContextValue {
  isLocked: boolean;
  isUnlocked: boolean;
  isBooting: boolean;
  isReady: boolean;
  lock: () => void;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  boot: () => Promise<void>;
  shutdown: () => void;
}

export const OSShellContext = createContext<OSShellContextValue | undefined>(undefined);

export function OSShellProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(true);
  const [isBooting, setIsBooting] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const lock = useCallback(() => {
    setIsLocked(true);
    setIsReady(false);
  }, []);

  const unlockWithPin = useCallback(async (pin: string): Promise<boolean> => {
    // In production, validate against secure storage
    const valid = pin.length >= 4;
    if (valid) {
      setIsLocked(false);
      setIsReady(true);
    }
    return valid;
  }, []);

  const unlockWithBiometric = useCallback(async (): Promise<boolean> => {
    // In production, use expo-local-authentication
    const success = true;
    if (success) {
      setIsLocked(false);
      setIsReady(true);
    }
    return success;
  }, []);

  const boot = useCallback(async () => {
    setIsBooting(true);
    // Simulate boot sequence
    await new Promise(r => setTimeout(r, 500));
    setIsBooting(false);
    setIsLocked(true); // Require unlock after boot
  }, []);

  const shutdown = useCallback(() => {
    setIsLocked(true);
    setIsReady(false);
    setIsBooting(false);
  }, []);

  const value: OSShellContextValue = {
    isLocked,
    isUnlocked: !isLocked,
    isBooting,
    isReady,
    lock,
    unlockWithPin,
    unlockWithBiometric,
    boot,
    shutdown,
  };

  return (
    <OSShellContext.Provider value={value}>
      {children}
    </OSShellContext.Provider>
  );
}

export function useOSShell(): OSShellContextValue {
  const context = useContext(OSShellContext);
  if (context === undefined) {
    throw new Error('useOSShell must be used within an OSShellProvider');
  }
  return context;
}
