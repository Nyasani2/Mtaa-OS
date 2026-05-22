import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useAppeals } from '../hooks/useAppeals';
import { formatDate } from '@/lib/utils';

interface Props {
  courtHouseId?: string;
}

export default function AppealsTable({ courtHouseId }: Props) {
  const { appeals, loading } = useAppeals(courtHouseId);

  if (loading) return <Text>Loading appeals...</Text>;

  return (
    <FlatList
      data={appeals}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.row}>
          <Text style={styles.case}>Case: {item.original_case?.case_number || item.original_case_id}</Text>
          <Text>Appellant: {item.appellant}</Text>
          <Text>Grounds: {item.grounds}</Text>
          <Text>Court: {item.appellate_court?.name || item.appellate_court_id}</Text>
          <Text>Date: {formatDate(item.filing_date || '')}</Text>
          <Text style={[styles.badge, { backgroundColor: item.status === 'dismissed' ? '#f44336' : '#ff9800' }]}>
            {item.status}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  case: { fontWeight: '600', fontSize: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, color: '#fff', fontSize: 10, alignSelf: 'flex-start', marginTop: 4 }
});
