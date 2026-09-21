// domains/shop/components/OrderManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  customer_name: string;
  created_at: string;
}

interface Props {
  shopId: string;
}

export default function OrderManager({ shopId }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });
    if (!error && data) setOrders(data as Order[]);
    setLoading(false);
  }, [shopId]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const updateStatus = async (orderId: string, status: Order['status']) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      loadOrders();
    }
  };

  const confirmDelivery = async (orderId: string) => {
    await updateStatus(orderId, 'delivered');
  };

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.customer}>{item.customer_name}</Text>
        <Text style={[styles.badge, styles[item.status]]}>{item.status}</Text>
      </View>
      <Text style={styles.total}>KES {item.total?.toLocaleString()}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={() => updateStatus(item.id, 'processing')}>
          <Text style={styles.btnText}>Process</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => updateStatus(item.id, 'shipped')}>
          <Text style={styles.btnText}>Ship</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.deliverBtn]} onPress={() => confirmDelivery(item.id)}>
          <Text style={styles.btnText}>Deliver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Orders</Text>
      {loading && <Text style={styles.loading}>Loading...</Text>}
      <FlatList data={orders} keyExtractor={(o) => o.id} renderItem={renderItem} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  header: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 16 },
  loading: { color: '#888', textAlign: 'center' },
  card: { backgroundColor: '#1f1f1f', borderRadius: 12, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customer: { color: '#fff', fontSize: 16, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontSize: 12, fontWeight: '600' },
  pending: { backgroundColor: '#F59E0B', color: '#000' },
  processing: { backgroundColor: '#3B82F6', color: '#fff' },
  shipped: { backgroundColor: '#8B5CF6', color: '#fff' },
  delivered: { backgroundColor: '#10B981', color: '#fff' },
  cancelled: { backgroundColor: '#EF4444', color: '#fff' },
  total: { color: '#10B981', fontSize: 18, fontWeight: '700', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { backgroundColor: '#333', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  deliverBtn: { backgroundColor: '#10B981' },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
