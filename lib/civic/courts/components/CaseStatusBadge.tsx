// lib/civic/courts/components/CaseStatusBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CaseStatus } from '@/types/courts';

const statusColors: Record<CaseStatus, string> = {
  pending: '#f59e0b',
  active: '#2563eb',
  adjourned: '#6b7280',
  closed: '#059669',
  appealed: '#7c3aed',
  dismissed: '#ef4444',
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
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
