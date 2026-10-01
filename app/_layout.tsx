import React, { Component, ErrorInfo, ReactNode, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments, usePathname } from 'expo-router';
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

const AUTO_LOCK_SECONDS = 30;

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>⚠️ App Crashed</Text>
          <ScrollView style={errorStyles.scroll}>
            <Text style={errorStyles.errorText}>{this.state.error?.toString()}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

function RootLayoutContent() {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);
  const { initialize, lockApp, updateLastActive, isAuthenticated, pinSet, user } = useAuthStore();

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
    <ErrorBoundary>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0000', padding: 20, justifyContent: 'center' },
  title: { color: '#ff4444', fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  scroll: { backgroundColor: '#000', borderRadius: 8, padding: 15 },
  errorText: { color: '#ff8888', fontSize: 14, fontFamily: 'monospace' }
});
