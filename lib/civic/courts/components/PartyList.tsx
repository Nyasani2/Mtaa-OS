import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

interface Props {
  parties: any[];
}

export default function PartyList({ parties }: Props) {
  return (
    <FlatList
      data={parties}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: { item: any }) => (
        <View style={styles.row}>
          <Text style={styles.name}>{item.full_name}</Text>
          <Text>{item.party_type}</Text>
          <Text>{item.id_number}</Text>
          {item.represented_by && <Text>Represented by: {item.represented_by}</Text>}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  name: { fontWeight: '600', fontSize: 14 }
});
