import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppLock } from '@/lib/security/app-lock-provider';
import { Ionicons } from '@expo/vector-icons';

export default function OsHomeScreen() {
  const router = useRouter();
  const { lock } = useAppLock();

  return (
    <View style={styles.container}>
      <Ionicons name="construct-outline" size={64} color="#64748b" />
      <Text style={styles.title}>Home</Text>
          <TouchableOpacity onPress={lock} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1a2e', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 10 }}>
            <Ionicons name="lock-closed" size={18} color="#00d4ff" />
            <Text style={{ color: '#00d4ff', fontWeight: '700', fontSize: 14 }}>Lock Screen</Text>
          </TouchableOpacity>
      <Text style={styles.subtitle}>This screen is under construction.</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
  button: { marginTop: 24, backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
