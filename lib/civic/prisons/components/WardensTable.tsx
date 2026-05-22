import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useWardens } from '../hooks/useWardens';

interface Props {
  facilityId?: string;
}

export default function WardensTable({ facilityId }: Props) {
  const { wardens, loading } = useWardens(facilityId);

  if (loading) return <Text>Loading wardens...</Text>;

  return (
    <FlatList
      data={wardens}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.row}>
          <Text>{item.first_name} {item.last_name}</Text>
          <Text>{item.rank}</Text>
          <Text style={[styles.status, { color: item.is_active ? '#4caf50' : '#f44336' }]}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  status: { fontWeight: '600' }
});
