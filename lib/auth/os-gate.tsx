import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/update-password',
  '/create-pin',
];

export function OSGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, pinSet } = useAuthStore();
  const [gateReady, setGateReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setGateReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading || !gateReady) return;

    const isAuthRoute = AUTH_ROUTES.includes(pathname);

    const inRecovery =
      typeof window !== 'undefined' &&
      sessionStorage.getItem('mtaa_in_recovery') === 'true';

    if (inRecovery) {
      if (pathname !== '/update-password') {
        sessionStorage.removeItem('mtaa_in_recovery');
      } else {
        return;
      }
    }

    if (!user) {
      if (!isAuthRoute) router.replace('/login');
      return;
    }

    if (!pinSet) {
      if (pathname !== '/create-pin') router.replace('/create-pin');
      return;
    }

    if (isAuthRoute) {
      if (pathname === '/login' || pathname === '/signup') {
        router.replace('/(os)');
      }
    }
  }, [user, isLoading, pinSet, pathname, router, gateReady]);

  if (isLoading || !gateReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
