import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useMyShops } from '../hooks/useShop';

export default function ShopQuickAccess() {
  const router = useRouter();
  const { shops, loading } = useMyShops();

  if (loading) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Shops</Text>
      {shops.length === 0 ? (
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/shop/create' as any)}>
          <Text style={styles.createText}>+ Create Shop</Text>
        </TouchableOpacity>
      ) : (
        shops.map((shop: any) => (
          <TouchableOpacity key={shop.id} style={styles.card} onPress={() => router.push(`/shop/${shop.id}` as any)}>
            <Text style={styles.shopName}>{shop.name}</Text>
            <Text style={styles.location}>{shop.location || 'No location'}</Text>
          </TouchableOpacity>
        ))
      )}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/shop/cart' as any)}>
          <Text>Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/shop/orders' as any)}>
          <Text>Orders</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  createBtn: { backgroundColor: '#2196f3', padding: 16, borderRadius: 8, alignItems: 'center' },
  createText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  shopName: { fontSize: 16, fontWeight: '600' },
  location: { fontSize: 12, color: '#666', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: { flex: 1, backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, alignItems: 'center' }
});
