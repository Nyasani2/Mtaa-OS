import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useJury } from '../hooks/useJury';

export default function JurorList() {
  const { jurors, loading } = useJury();

  if (loading) return <Text>Loading jurors...</Text>;

  return (
    <FlatList
      data={jurors}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.row}>
          <Text>{item.first_name} {item.last_name}</Text>
          <Text>{item.occupation || 'N/A'}</Text>
          <Text style={[styles.status, { color: item.is_available ? '#4caf50' : '#f44336' }]}>
            {item.is_available ? 'Available' : 'Unavailable'}
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
