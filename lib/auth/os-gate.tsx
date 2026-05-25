import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useOSShell } from '@/lib/shell/use-os-shell';
import { useIdentity } from '@/lib/auth/use-identity';

interface OSGateProps { children: React.ReactNode; fallback?: React.ReactNode; }

export function OSGate({ children, fallback }: OSGateProps) {
  const { isAuthenticated, isLoading } = useIdentity();
  const { isUnlocked, isLocked, isBooting } = useOSShell();

  if (isLoading || isBooting) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Loading MTAA OS...</Text>
      </View>
    );
  }

  if (!isAuthenticated) return fallback || null;
  if (isLocked) return fallback || null;
  if (!isUnlocked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Unlocking...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
