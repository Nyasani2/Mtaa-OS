import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useShopOrders } from '../hooks/useShop';
import { ShopService } from '../services/shopService';

interface Props {
  shopId: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#ff9800',
  processing: '#2196f3',
  shipped: '#9c27b0',
  delivered: '#4caf50',
  cancelled: '#f44336'
};

export default function OrderManager({ shopId }: Props) {
  const { orders, loading, refresh } = useShopOrders(shopId);

  const updateStatus = async (orderId: string, status: string) => {
    await ShopService.updateOrderStatus(orderId, status);
    refresh();
  };

  const confirmDelivery = async (orderId: string) => {
    await ShopService.confirmDelivery(orderId);
    refresh();
  };

  if (loading) return <Text>Loading orders...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orders ({orders.length})</Text>
      <FlatList
        data={orders}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.orderId}>Order #{item.id.slice(0, 8)}</Text>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || '#999' }]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text>Total: ${item.total_amount?.toFixed(2)}</Text>
            <Text>Date: {new Date(item.created_at).toLocaleDateString()}</Text>
            <View style={styles.actions}>
              {item.status === 'pending' && (
                <TouchableOpacity style={styles.button} onPress={() => updateStatus(item.id, 'processing')}>
                  <Text style={styles.buttonText}>Process</Text>
                </TouchableOpacity>
              )}
              {item.status === 'processing' && (
                <TouchableOpacity style={styles.button} onPress={() => updateStatus(item.id, 'shipped')}>
                  <Text style={styles.buttonText}>Ship</Text>
                </TouchableOpacity>
              )}
              {item.status === 'shipped' && (
                <TouchableOpacity style={[styles.button, styles.deliverBtn]} onPress={() => confirmDelivery(item.id)}>
                  <Text style={styles.buttonText}>Confirm Delivery</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.button, styles.cancelBtn]} onPress={() => updateStatus(item.id, 'cancelled')}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontSize: 14, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  actions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  button: { backgroundColor: '#2196f3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  buttonText: { color: '#fff', fontSize: 12 },
  deliverBtn: { backgroundColor: '#4caf50' },
  cancelBtn: { backgroundColor: '#f44336' }
});
