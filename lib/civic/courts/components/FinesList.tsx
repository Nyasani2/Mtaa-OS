import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFines } from '../hooks/useFines';

interface Props {
  caseId?: string;
}

export default function FinesList({ caseId }: Props) {
  const { fines, loading } = useFines(caseId);

  if (loading) return <Text>Loading fines...</Text>;

  return (
    <FlatList
      data={fines}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.row}>
          <Text>Amount: ${item.amount?.toFixed(2)}</Text>
          <Text>Paid: ${(item.amount_paid || 0).toFixed(2)}</Text>
          <Text style={[styles.badge, {
            backgroundColor: item.payment_status === 'paid' ? '#4caf50' : item.payment_status === 'partial' ? '#ff9800' : '#f44336'
          }]}>
            {item.payment_status}
          </Text>
          {item.receipt_number && <Text>Receipt: {item.receipt_number}</Text>}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, color: '#fff', fontSize: 10, alignSelf: 'flex-start', marginTop: 4 }
});
