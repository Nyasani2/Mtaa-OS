import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PortalRole() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const router = useRouter();
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{role ? `${role.replace('_', ' ').toUpperCase()} Portal` : 'Portal'}</Text>
      <Text style={styles.sub}>Dashboard view is loading...</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
        <Text style={styles.btnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  title: { fontSize: 20, fontWeight: '700' as const, color: '#fff' },
  sub: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
  btn: { marginTop: 20, backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' as const },
});
