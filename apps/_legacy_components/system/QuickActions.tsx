/**
 * MTAA OS — Quick Actions (React Native)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const QUICK_ACTIONS = [
  { label: 'Send', icon: '↑', path: '/wallet/send', color: '#3b82f6' },
  { label: 'Receive', icon: '↓', path: '/wallet/receive', color: '#10b981' },
  { label: 'Scan', icon: '◫', path: '/scan', color: '#8b5cf6' },
  { label: 'Pay', icon: '◉', path: '/wallet/pay', color: '#f59e0b' },
  { label: 'Top Up', icon: '+', path: '/wallet/topup', color: '#ec4899' },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.row}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            onPress={() => router.push(action.path)}
            style={styles.btn}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: action.color + '20' }]}>
              <Text style={[styles.iconText, { color: action.color }]}>{action.icon}</Text>
            </View>
            <Text style={styles.label}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 16, marginBottom: 16 },
  title: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { alignItems: 'center', flex: 1 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  iconText: { fontSize: 18 },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
});
