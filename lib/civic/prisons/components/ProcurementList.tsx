import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { usePrisonProcurement } from '../hooks/usePrisonProcurement';

interface Props {
  facilityId?: string;
}

export default function ProcurementList({ facilityId }: Props) {
  const { items, loading } = usePrisonProcurement(facilityId);

  if (loading) return <Text>Loading procurement...</Text>;

  return (
    <FlatList
      data={items}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.row}>
          <Text>{item.item_name}</Text>
          <Text>{item.quantity}</Text>
          <Text>${(item.unit_price || 0).toFixed(2)}</Text>
          <Text>${(item.total_cost || 0).toFixed(2)}</Text>
          <Text style={[styles.badge, { backgroundColor: item.status === 'received' ? '#4caf50' : '#ff9800' }]}>
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
