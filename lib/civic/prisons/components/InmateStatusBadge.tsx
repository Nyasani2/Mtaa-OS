// lib/civic/prisons/components/InmateStatusBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { InmateStatus } from '@/types/prisons';

const statusColors: Record<InmateStatus, string> = {
  admitted: '#2563eb',
  awaiting_trial: '#f59e0b',
  convicted: '#7c3aed',
  on_parole: '#059669',
  released: '#6b7280',
  transferred: '#0891b2',
  deceased: '#ef4444',
};

export function InmateStatusBadge({ status }: { status: InmateStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: statusColors[status] ?? '#6b7280' }]}>
      <Text style={styles.text}>{status.replace(/_/g, ' ').toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start' },
  text: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
