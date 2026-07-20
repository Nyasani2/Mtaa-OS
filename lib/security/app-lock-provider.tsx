import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { hasPin, verifyPin } from './pin-engine';
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface AppLockContextType {
  isLocked: boolean;
  lockApp: () => void;
  unlockApp: (pin: string) => Promise<boolean>;
  timeSinceBackground: number;
}

const AppLockContext = createContext<AppLockContextType>({
  isLocked: false,
  lockApp: () => {},
  unlockApp: async () => false,
  timeSinceBackground: 0,
});

export const useAppLock = () => useContext(AppLockContext);

const LOCK_DELAY_MS = 30000; // 30 seconds before lock triggers

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [timeSinceBackground, setTimeSinceBackground] = useState(0);
  const backgroundTimeRef = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const router = useRouter();
  const segments = useSegments();
  const { session } = useAuthStore();
  const lockCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const shouldLock = useCallback(async (): Promise<boolean> => {
    if (!session) return false;
    const pinExists = await hasPin();
    return pinExists;
  }, [session]);

  const lockApp = useCallback(() => {
    shouldLock().then((canLock) => {
      if (canLock && !isLocked) {
        setIsLocked(true);
        const currentRoute = segments.join('/');
        router.push(`/auth/lock-screen?returnTo=${encodeURIComponent(currentRoute)}`);
      }
    });
  }, [isLocked, segments, router, shouldLock]);

  const unlockApp = useCallback(async (pin: string): Promise<boolean> => {
    const valid = await verifyPin(pin);
    if (valid) {
      setIsLocked(false);
      backgroundTimeRef.current = null;
      setTimeSinceBackground(0);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const currentState = appStateRef.current;

      if (currentState === 'active' && nextAppState.match(/inactive|background/)) {
        backgroundTimeRef.current = Date.now();
        console.log('[AppLock] App went to background');
      }

      if (currentState.match(/inactive|background/) && nextAppState === 'active') {
        const now = Date.now();
        const bgTime = backgroundTimeRef.current;

        if (bgTime) {
          const elapsed = now - bgTime;
          setTimeSinceBackground(elapsed);
          console.log(`[AppLock] Background time: ${elapsed}ms`);

          if (elapsed >= LOCK_DELAY_MS) {
            console.log('[AppLock] Locking app due to background timeout');
            shouldLock().then((canLock) => {
              if (canLock) {
                setIsLocked(true);
                const currentRoute = segments.join('/');
                router.push(`/auth/lock-screen?returnTo=${encodeURIComponent(currentRoute)}`);
              }
            });
          }
        }
        backgroundTimeRef.current = null;
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [segments, router, shouldLock]);

  return (
    <AppLockContext.Provider value={{ isLocked, lockApp, unlockApp, timeSinceBackground }}>
      {children}
    </AppLockContext.Provider>
  );
}
