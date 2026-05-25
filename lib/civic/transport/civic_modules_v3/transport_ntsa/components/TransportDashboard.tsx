// lib/civic/transport/civic_modules_v3/transport_ntsa/components/TransportDashboard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useIdentity } from '@/lib/auth/identity';

export function TransportDashboard() {
  const { user } = useIdentity();
  return (
    <View style={styles.container}>
      <Text style={styles.header}>NTSA Transport</Text>
      <Text>Welcome, {user?.email ?? 'Guest'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
});
