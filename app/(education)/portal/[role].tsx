import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PortalRole() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const router = useRouter();

  return (
    <View style={styles.center}>
      <Text style={styles.title}>{role ? `${role.toUpperCase()} Portal` : 'Portal'}</Text>
      <Text style={styles.sub}>Dashboard loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
});
