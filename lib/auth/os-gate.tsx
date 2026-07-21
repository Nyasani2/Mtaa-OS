import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore, startSessionMonitor, stopSessionMonitor } from '@/lib/auth/store/auth.store';
import { hasPin } from '@/lib/security/pin-engine';

/**
 * MTAA OS Gate — Production Hardened Route Guard
 * 
 * Security checks on every route change:
 * 1. Authentication state
 * 2. Session timeout (idle + absolute)
 * 3. Device trust score
 * 4. PIN setup status
 * 5. Account freeze status
 * 6. Step-up auth requirement
 */

const PUBLIC_ROUTES = ['auth/login', 'auth/register', 'auth/reset-password', 'auth/verify-email'];
const AUTH_ROUTES = ['auth/set-pin', 'auth/biometric-enroll', 'auth/lock-screen'];

export default function OSGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const {
    isAuthenticated,
    isLoading,
    user,
    checkSessionTimeout,
    validateDevice,
    requiresStepUp,
    trustScore,
    revokeSession,
    updateLastActivity,
  } = useAuthStore();

  const [checking, setChecking] = useState(true);
  const [pinRequired, setPinRequired] = useState(false);

  const currentRoute = segments.join('/');
  const isPublicRoute = PUBLIC_ROUTES.some((r) => currentRoute.includes(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => currentRoute.includes(r));

  useEffect(() => {
    startSessionMonitor();
    return () => stopSessionMonitor();
  }, []);

  useEffect(() => {
    const checkGate = async () => {
      setChecking(true);

      try {
        // ─── Public routes: no checks needed ──────────────────────────────
        if (isPublicRoute) {
          setChecking(false);
          return;
        }

        // ─── Not authenticated ────────────────────────────────────────────
        if (!isAuthenticated || !user) {
          router.replace('/auth/login');
          return;
        }

        // ─── Account frozen ───────────────────────────────────────────────
        if (user?.role === 'frozen' || (await checkAccountFrozen(user.id))) {
          await revokeSession('account_frozen');
          router.replace('/auth/login');
          return;
        }

        // ─── Session timeout ──────────────────────────────────────────────
        if (checkSessionTimeout()) {
          await revokeSession('idle_timeout');
          router.replace('/auth/lock-screen');
          return;
        }

        // ─── Device validation ────────────────────────────────────────────
        const deviceValid = await validateDevice();
        if (!deviceValid.valid) {
          await revokeSession('device_untrusted');
          router.replace('/auth/login');
          return;
        }

        // ─── PIN not set ──────────────────────────────────────────────────
        const pinExists = await hasPin();
        if (!pinExists && !isAuthRoute) {
          router.replace('/auth/set-pin');
          return;
        }

        // ─── Step-up auth required ────────────────────────────────────────
        if (requiresStepUp && !isAuthRoute && currentRoute !== 'auth/lock-screen') {
          setPinRequired(true);
          router.push('/auth/lock-screen');
          return;
        }

        // ─── Update activity timestamp ────────────────────────────────────
        updateLastActivity();

        setChecking(false);
      } catch (error) {
        console.error('OS Gate check failed:', error);
        await revokeSession('gate_error');
        router.replace('/auth/login');
      }
    };

    checkGate();
  }, [isAuthenticated, isLoading, currentRoute, requiresStepUp, trustScore]);

  if (isLoading || checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4aa" />
        <Text style={styles.text}>Securing your session...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

async function checkAccountFrozen(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_profiles')
    .select('account_frozen, freeze_until')
    .eq('id', userId)
    .single();

  if (!data) return false;
  if (!data.account_frozen) return false;
  if (data.freeze_until && new Date(data.freeze_until) < new Date()) {
    // Auto-unfreeze if expired
    await supabase.rpc('unfreeze_account', { p_user_id: userId, p_unfrozen_by: userId });
    return false;
  }
  return true;
}

import { supabase } from '@/lib/supabase/client';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    color: '#888',
    fontSize: 14,
  },
});
