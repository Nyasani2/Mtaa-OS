// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceIntegrity } from '@/lib/hooks/useDeviceIntegrity';

export default function DeviceSecurityCard() {
  const { status, loading } = useDeviceIntegrity();

  if (loading) return null;

  const getIcon = () => {
    if (status.riskLevel === 'low') return { name: 'shield-checkmark', color: '#10b981' };
    if (status.riskLevel === 'medium') return { name: 'construct', color: '#f59e0b' };
    return { name: 'alert-circle', color: '#ef4444' };
  };

  const icon = getIcon();

  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
        <Ionicons name={icon.name} size={24} color={icon.color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Device Security Status</Text>
        <Text style={styles.message}>{status.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  title: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  message: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
});
