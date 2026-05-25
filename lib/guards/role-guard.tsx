// lib/guards/role-guard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useIdentity } from '@/lib/auth/identity';
import { useRouter } from 'expo-router';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const identity = useIdentity();
  const router = useRouter();
  const userRole = identity.user?.user_metadata?.role as string | undefined;

  if (!identity.isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Please sign in to access this feature.</Text>
      </View>
    );
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    if (fallback) return <>{fallback}</>;
    return (
      <View style={styles.container}>
        <Text style={styles.text}>You do not have permission to access this feature.</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 16, color: '#666', textAlign: 'center' },
});
