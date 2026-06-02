import React from 'react';
import { View, Text, Image, Pressable, FlatList, StyleSheet } from 'react-native';
import { useShop } from '../hooks/useShop';

export function ShopPanel() {
  const { items, cart, cartCount, cartTotal, addToCart, placeOrder } = useShop();

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.product}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>${item.price}</Text>
      <Pressable style={styles.addBtn} onPress={() => addToCart(item)}>
        <Text style={styles.addText}>🛒 Add to Cart</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.cartBar}>
        <Text style={styles.cartText}>🛒 {cartCount} items — ${cartTotal.toFixed(2)}</Text>
        <Pressable style={styles.checkoutBtn} onPress={() => placeOrder.mutate({ items: cart })}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </Pressable>
      </View>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  cartBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderBottomColor: '#eee' },
  cartText: { fontWeight: '600' },
  checkoutBtn: { backgroundColor: '#E91E63', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  checkoutText: { color: '#fff', fontWeight: '700' },
  grid: { padding: 8 },
  product: { flex: 1, margin: 4, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee', padding: 8 },
  productImage: { width: '100%', height: 120, borderRadius: 6, marginBottom: 8 },
  productName: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  productPrice: { fontSize: 14, color: '#E91E63', fontWeight: '700', marginBottom: 8 },
  addBtn: { backgroundColor: '#f5f5f5', padding: 8, borderRadius: 6, alignItems: 'center' },
  addText: { fontSize: 12, fontWeight: '600' },
});
