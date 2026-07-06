import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoleGuard } from '@/lib/health/hooks/useRoleGuard';

interface RoleGuardProps {
  requiredRole?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ requiredRole, children, fallback }: RoleGuardProps) {
  const { role, canAccess } = useRoleGuard();

  if (requiredRole && role !== requiredRole && role !== 'admin') {
    return (
      <View style={styles.container}>
        {fallback ?? (
          <Text style={styles.text}>Access denied. Required role: {requiredRole}</Text>
        )}
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    padding: 24,
  },
  text: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
  },
});
