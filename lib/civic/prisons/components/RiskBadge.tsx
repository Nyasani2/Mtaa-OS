// lib/civic/prisons/components/RiskBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RiskLevel } from '@/types/prisons';

const riskColors: Record<RiskLevel, string> = {
  low: '#059669',
  medium: '#f59e0b',
  high: '#ef4444',
  maximum: '#7f1d1d',
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <View style={[styles.badge, { backgroundColor: riskColors[level] ?? '#6b7280' }]}>
      <Text style={styles.text}>{level.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start' },
  text: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
