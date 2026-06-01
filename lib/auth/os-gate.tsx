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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FF6B00' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ marginTop: 12, color: '#fff', fontSize: 14 }}>Loading MTAA OS...</Text>
      </View>
    );
  }

  if (!isAuthenticated) return fallback || null;
  if (isLocked) return fallback || null;
  if (!isUnlocked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' }}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={{ marginTop: 12, color: '#999' }}>Unlocking...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
