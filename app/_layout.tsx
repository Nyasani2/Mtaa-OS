import React, { useEffect, useRef } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import { IdentityProvider } from '@/lib/auth/identity-provider';
import { OSGate } from '@/lib/auth/os-gate';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { LockScreen } from '@/components/os/LockScreen';
import { ASISCSEProvider } from '@/lib/asis-cse/asis-cse-provider';
import { GlobalASISOverlay } from '@/components/GlobalASISOverlay';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { usePathname } from 'expo-router';

const AUTO_LOCK_SECONDS = 30;

function RootLayoutContent() {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);
  const { initialize, lockApp, updateLastActive, isAuthenticated, pinSet, user } = useAuthStore();

  // SAFE INITIALIZATION: Prevents unhandled promise rejections from crashing the app
  useEffect(() => {
    const safeInitialize = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error("CRITICAL: Auth initialization failed, but preventing crash:", error);
      }
    };
    safeInitialize();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const current = appState.current;
      if (current === 'active' && nextAppState.match(/inactive|background/)) {
        backgroundTime.current = Date.now();
        updateLastActive();
      }
      if (current.match(/inactive|background/) && nextAppState === 'active') {
        if (backgroundTime.current && isAuthenticated && pinSet) {
          const elapsed = (Date.now() - backgroundTime.current) / 1000;
          if (elapsed > AUTO_LOCK_SECONDS) {
            lockApp();
          }
        }
        backgroundTime.current = null;
        updateLastActive();
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [isAuthenticated, pinSet, lockApp, updateLastActive]);

  useEffect(() => {
    updateLastActive();
  }, [segments]);

  return (
    <SafeAreaProvider>
      <ASISCSEProvider userId={user?.id || 'anonymous'}>
        <IdentityProvider>
          <OSGate>
            <Slot />
          </OSGate>
        </IdentityProvider>
        <StatusBar style="light" />
        <LockScreen />
        {pathname !== '/asis' && <GlobalASISOverlay />}
      </ASISCSEProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
