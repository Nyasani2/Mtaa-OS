// app/(os)/developer/index.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useIdentity } from '@/lib/auth/identity';

export default function DeveloperScreen() {
  const { user } = useIdentity();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Developer Portal</Text>
      <Text style={styles.text}>Signed in as: {user?.email ?? 'Guest'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  text: { fontSize: 16, color: '#666' },
});
