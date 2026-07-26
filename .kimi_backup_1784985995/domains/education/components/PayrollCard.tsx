import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_COLORS: Record<string, string> = {
  pending: '#ff9800',
  processed: '#2196f3',
  paid: '#4caf50'
};

interface Props {
  record: any;
}

export default function PayrollCard({ record }: Props) {
  const status = record?.status || 'pending';
  const color = STATUS_COLORS[status] || '#ff9800';

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{record?.staff_name || 'Unknown'}</Text>
      <Text>Amount: ${(record?.amount || 0).toFixed(2)}</Text>
      <Text style={[styles.badge, { backgroundColor: color }]}>{status}</Text>
      <Text>Period: {record?.period || 'N/A'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 12, marginBottom: 8, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  name: { fontWeight: '600', fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, color: '#fff', fontSize: 10, alignSelf: 'flex-start', marginTop: 4 }
});
