import React, { useEffect, useRef } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppState, Platform } from 'react-native';
import { IdentityProvider } from '@/lib/auth/identity-provider';
import { OSGate } from '@/lib/auth/os-gate';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { LockScreen } from '@/components/os/LockScreen';

const AUTO_LOCK_SECONDS = 30;

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);
  const { initialize, lockApp, updateLastActive, isAuthenticated, pinSet } = useAuthStore();

  // Initialize auth on boot
  useEffect(() => {
    initialize();
  }, []);

  // Track last active time for auto-lock
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const current = appState.current;

      if (current === 'active' && nextAppState.match(/inactive|background/)) {
        // Going to background — record time
        backgroundTime.current = Date.now();
        updateLastActive();
      }

      if (current.match(/inactive|background/) && nextAppState === 'active') {
        // Coming to foreground — check if we should lock
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

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, pinSet, lockApp, updateLastActive]);

  // Update last active on navigation
  useEffect(() => {
    updateLastActive();
  }, [segments]);

  return (
    <SafeAreaProvider>
      <IdentityProvider>
        <OSGate>
          <Slot />
        </OSGate>
      </IdentityProvider>
      <StatusBar style="light" />
      <LockScreen />
    </SafeAreaProvider>
  );
}
