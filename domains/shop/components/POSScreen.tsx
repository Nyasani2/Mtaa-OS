import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

export default function POSScreen({ shopId }: { shopId: string }) {
  const [cart, setCart] = useState<any[]>([]);
  const total = cart.reduce((s, i) => s + (i.price || 0), 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>POS — {shopId}</Text>
      <FlatList
        data={cart}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>${item.price}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Scan or add items</Text>}
      />
      <View style={styles.footer}>
        <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
        <TouchableOpacity style={styles.checkoutBtn}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomColor: '#222', borderBottomWidth: 1 },
  itemName: { color: '#fff' },
  itemPrice: { color: '#00d4ff' },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
  footer: { marginTop: 'auto', paddingTop: 16, borderTopColor: '#222', borderTopWidth: 1 },
  total: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  checkoutBtn: { backgroundColor: '#00d4ff', borderRadius: 12, padding: 16, alignItems: 'center' },
  checkoutText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
