// lib/mtaa/kernel/safe-mode.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { bootSequence } from './boot-sequence';
import { panicHandler } from './panic-handler';

export default function SafeModeScreen() {
  const router = useRouter();
  const status = bootSequence.getStatus();

  const handleRetry = () => { panicHandler.reset(); router.replace('/(os)/home'); };
  const handleReset = () => { panicHandler.reset(); router.replace('/auth/login'); };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>⚠️ Safe Mode</Text>
      <Text style={styles.subtitle}>MTAA OS encountered critical errors during startup</Text>
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Boot Status</Text>
        {status.map((s, i) => (
          <View key={i} style={styles.statusRow}>
            <Text style={styles.statusPhase}>{s.phase}</Text>
            <Text style={[styles.statusState, s.state === 'ok' ? styles.ok : styles.failed]}>{s.state.toUpperCase()}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.buttonPrimary} onPress={handleRetry}><Text style={styles.buttonText}>Retry Boot</Text></TouchableOpacity>
      <TouchableOpacity style={styles.buttonSecondary} onPress={handleReset}><Text style={styles.buttonTextSecondary}>Reset to Login</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 24, alignItems: 'center', paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#F59E0B', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 32 },
  statusCard: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, width: '100%', marginBottom: 24 },
  statusTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  statusPhase: { fontSize: 14, color: '#D1D5DB' },
  statusState: { fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  ok: { backgroundColor: '#065F46', color: '#34D399' },
  failed: { backgroundColor: '#7F1D1D', color: '#F87171' },
  buttonPrimary: { backgroundColor: '#3B82F6', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 12 },
  buttonSecondary: { backgroundColor: '#1A1A1A', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  buttonTextSecondary: { color: '#9CA3AF', fontSize: 16, fontWeight: '600' },
});
