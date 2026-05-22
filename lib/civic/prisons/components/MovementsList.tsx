import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useMovements } from '../hooks/useMovements';
import { formatDate } from '@/lib/utils';

interface Props {
  facilityId?: string;
}

export default function MovementsList({ facilityId }: Props) {
  const { movements, loading } = useMovements(facilityId);

  if (loading) return <Text>Loading movements...</Text>;

  return (
    <FlatList
      data={movements}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.row}>
          <Text>{item.inmate?.first_name} {item.inmate?.last_name}</Text>
          <Text>{item.movement_type}</Text>
          <Text>{formatDate(item.occurred_at || '')}</Text>
          <Text style={[styles.badge, { backgroundColor: item.status === 'completed' ? '#4caf50' : '#ff9800' }]}>
            {item.status}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, color: '#fff', fontSize: 10 }
});
