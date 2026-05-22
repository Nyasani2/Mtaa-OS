import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useBails } from '../hooks/useBails';

interface Props {
  caseId?: string;
}

export default function BailsList({ caseId }: Props) {
  const { bails, loading } = useBails(caseId);

  if (loading) return <Text>Loading bails...</Text>;

  return (
    <FlatList
      data={bails}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.row}>
          <Text>Party: {item.party?.full_name || item.party_id}</Text>
          <Text>Amount: ${item.amount?.toFixed(2)}</Text>
          <Text>Conditions: {item.conditions || 'None'}</Text>
          <Text style={[styles.badge, { backgroundColor: item.status === 'posted' ? '#4caf50' : '#f44336' }]}>
            {item.status}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, color: '#fff', fontSize: 10, alignSelf: 'flex-start', marginTop: 4 }
});
