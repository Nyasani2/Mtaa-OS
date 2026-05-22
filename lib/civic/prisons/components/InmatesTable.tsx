import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useInmates } from '../hooks/useInmates';
import { formatDate } from '@/lib/utils';

interface Props {
  facilityId?: string;
}

export default function InmatesTable({ facilityId }: Props) {
  const { inmates, loading } = useInmates(facilityId);

  if (loading) return <Text>Loading inmates...</Text>;

  return (
    <FlatList
      data={inmates}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.row}>
          <Text style={styles.number}>{item.inmate_number}</Text>
          <Text>{item.first_name} {item.last_name}</Text>
          <Text>{item.facility?.name || 'N/A'}</Text>
          <Text style={[styles.status, { color: item.status === 'active' ? '#4caf50' : '#f44336' }]}>
            {item.status}
          </Text>
          <Text>{formatDate(item.sentence_end || '')}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  number: { fontWeight: '600', width: 80 },
  status: { fontWeight: '600' }
});
