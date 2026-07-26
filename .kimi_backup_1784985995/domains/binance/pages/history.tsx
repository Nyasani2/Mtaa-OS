import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const MOCK_HISTORY = [
  { id: '1', from: 'BTC', to: 'USDT', amount: 0.5, date: '2024-01-15' },
  { id: '2', from: 'ETH', to: 'USDT', amount: 2.0, date: '2024-01-14' },
];

export default function HistoryPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conversion History</Text>
      <FlatList
        data={MOCK_HISTORY}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text>{item.from} → {item.to}</Text>
            <Text>{item.amount}</Text>
            <Text>{item.date}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }
});
