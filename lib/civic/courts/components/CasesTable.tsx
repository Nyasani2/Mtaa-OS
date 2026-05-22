import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useCases } from '../hooks/useCases';
import { formatDate } from '@/lib/utils';

interface Props {
  courtHouseId?: string;
}

export default function CasesTable({ courtHouseId }: Props) {
  const { cases, loading } = useCases(courtHouseId);

  if (loading) return <Text>Loading cases...</Text>;

  return (
    <FlatList
      data={cases}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.row}>
          <Text style={styles.number}>{item.case_number}</Text>
          <Text>{item.title}</Text>
          <Text>Type: {item.case_type}</Text>
          <Text>Court: {item.court_house?.name || 'N/A'}</Text>
          <Text>Filed: {formatDate(item.filing_date || '')}</Text>
          <Text>Judge: {item.assigned_judge ? `${item.assigned_judge.first_name} ${item.assigned_judge.last_name}` : 'Unassigned'}</Text>
          <Text style={[styles.badge, { backgroundColor: item.status === 'closed' ? '#4caf50' : '#ff9800' }]}>
            {item.status}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  number: { fontWeight: '600', fontSize: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, color: '#fff', fontSize: 10, alignSelf: 'flex-start', marginTop: 4 }
});
