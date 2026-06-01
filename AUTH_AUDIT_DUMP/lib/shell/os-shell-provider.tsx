import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { getPinState, isPinSet } from '@/lib/security/pin-engine';
import { useIdentity } from '@/lib/auth/use-identity';

// ── Types ───────────────────────────────────────────────────────────────────
interface OSShellContextType {
  isBooted: boolean;
  isLocked: boolean;
  bootError: string | null;
  retryBoot: () => void;
}

const OSShellContext = createContext<OSShellContextType | null>(null);

export function useOSShell() {
  const ctx = useContext(OSShellContext);
  if (!ctx) throw new Error('useOSShell must be used within OSShellProvider');
  return ctx;
}

// ── Provider ────────────────────────────────────────────────────────────────
export function OSShellProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { session, isLoading: authLoading } = useIdentity();

  const [isBooted, setIsBooted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  // ── Boot Sequence ─────────────────────────────────────────────────────────
  const runBoot = useCallback(async () => {
    console.log('[OSShell] Starting boot sequence...');
    setBootError(null);

    try {
      // Step 1: Wait for auth to initialize
      if (authLoading) {
        console.log('[OSShell] Waiting for auth...');
        return;
      }

      // Step 2: Check if user is authenticated
      if (!session) {
        console.log('[OSShell] No session — redirect to login');
        setIsBooted(true);
        router.replace('/auth/login');
        return;
      }

      // Step 3: Check PIN state (wrapped in try/catch so SecureStore failure doesn't crash)
      let pinSet = false;
      let pinLocked = false;

      try {
        const state = await getPinState();
        pinSet = state.isSet;
        pinLocked = state.isLocked;
        console.log('[OSShell] PIN state:', { isSet: pinSet, isLocked: pinLocked });
      } catch (pinErr) {
        console.warn('[OSShell] PIN check failed (SecureStore unavailable):', pinErr);
        // If PIN check fails, assume no PIN is set — don't crash
        pinSet = false;
        pinLocked = false;
      }

      // Step 4: Route based on state
      if (!pinSet) {
        // No PIN set — show setup screen
        console.log('[OSShell] No PIN set — redirect to set-pin');
        setIsBooted(true);
        router.replace('/auth/set-pin');
        return;
      }

      if (pinLocked) {
        // PIN is locked (too many attempts)
        console.log('[OSShell] PIN locked — redirect to lock-screen');
        setIsLocked(true);
        setIsBooted(true);
        router.replace('/auth/lock-screen');
        return;
      }

      // Step 5: Device is secure — show lock screen for unlock
      console.log('[OSShell] PIN set — redirect to lock-screen for unlock');
      setIsLocked(true);
      setIsBooted(true);
      router.replace('/auth/lock-screen');

    } catch (err: any) {
      console.error('[OSShell] Boot error:', err);
      setBootError(err.message || 'Boot failed');
      setIsBooted(true);
    }
  }, [session, authLoading, router]);

  // ── Retry ─────────────────────────────────────────────────────────────────
  const retryBoot = useCallback(() => {
    setIsBooted(false);
    setIsLocked(false);
    setBootError(null);
    runBoot();
  }, [runBoot]);

  // ── Effect: Run boot when auth state changes ──────────────────────────────
  useEffect(() => {
    if (!authLoading) {
      runBoot();
    }
  }, [authLoading, session, runBoot]);

  // ── Effect: Listen for auth state changes ───────────────────────────────────
  useEffect(() => {
    const { supabase } = require('@/lib/supabase');

    const { data: listener } = supabase.auth.onAuthStateChange((event: string) => {
      console.log('[OSShell] Auth state change:', event);
      if (event === 'SIGNED_OUT') {
        setIsLocked(false);
        setIsBooted(false);
        router.replace('/auth/login');
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [router]);

  // ── Boot Error Screen ─────────────────────────────────────────────────────
  if (bootError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={48} color="#F59E0B" />
        <Text style={styles.errorTitle}>Boot Error</Text>
        <Text style={styles.errorMessage}>{bootError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryBoot}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Booting Screen ──────────────────────────────────────────────────────────
  if (!isBooted) {
    return (
      <View style={styles.bootContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.bootText}>Loading MTAA OS...</Text>
      </View>
    );
  }

  // ── Provide Context ───────────────────────────────────────────────────────
  return (
    <OSShellContext.Provider value={{ isBooted, isLocked, bootError, retryBoot }}>
      {children}
    </OSShellContext.Provider>
  );
}

// ── Styles (inline for boot screen) ─────────────────────────────────────────
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const styles = StyleSheet.create({
  bootContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  bootText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    color: '#F59E0B',
    fontSize: 20,
    fontWeight: '700',
  },
  errorMessage: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
