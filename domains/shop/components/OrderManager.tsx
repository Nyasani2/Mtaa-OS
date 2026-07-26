import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

export default function OrderManager({ shopId }: { shopId: string }) {
  const orders: any[] = [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orders — {shopId}</Text>
      <FlatList
        data={orders}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.id}>#{item.id?.slice(0, 8)}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No orders yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
  id: { color: '#fff' },
  status: { color: '#00d4ff' },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
});
