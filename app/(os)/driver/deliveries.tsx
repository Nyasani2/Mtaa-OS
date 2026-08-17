import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  FlatList, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { deliveryService } from '@/domains/shop/services/deliveryService';
import { supabase } from '@/lib/supabase/client';

interface DeliveryTask {
  id: string;
  order_id: string;
  order_number: string;
  shop_name: string;
  shop_phone: string;
  shop_address: string;
  shipping_address: string;
  total_amount: number;
  status: string;
  delivery_type: string;
}

export default function DriverAppScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const deliveries = await deliveryService.getAgentDeliveries(user.id);
      const mapped: DeliveryTask[] = (deliveries || []).map((d: any) => ({
        id: d.id,
        order_id: d.order_id,
        order_number: d.shop_orders?.order_number || d.order_id.slice(0, 8),
        shop_name: d.shops?.name || 'Shop',
        shop_phone: d.shops?.phone || '',
        shop_address: d.shops?.address_line1 || '',
        shipping_address: d.shop_orders?.shipping_address || '',
        total_amount: d.shop_orders?.total_amount || 0,
        status: d.shop_orders?.status || d.status,
        delivery_type: d.delivery_type,
      }));
      setTasks(mapped);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTasks();
    const sub = supabase
      .channel('driver_tasks_' + user?.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_delivery_requests' }, () => { loadTasks(); })
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [loadTasks, user?.id]);

  async function handleStatusUpdate(orderId: string, newStatus: 'picked_up' | 'in_transit' | 'delivered') {
    setLoading(true);
    try {
      await deliveryService.updateDeliveryStatus(orderId, newStatus);
      loadTasks();
      if (newStatus === 'delivered') {
        Alert.alert('Delivered', 'Order marked as delivered.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCall(phone: string) {
    if (phone) Linking.openURL('tel:' + phone);
  }

  function handleNavigate(address: string) {
    if (address) {
      const url = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address);
      Linking.openURL(url);
    }
  }

  if (loading && tasks.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading deliveries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚚 My Deliveries</Text>
        <TouchableOpacity onPress={loadTasks}>
          <Ionicons name="refresh" size={22} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskNumber}>#{item.order_number}</Text>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'delivered' ? '#ECFDF5' : '#FEF3C7' }]}>
                <Text style={[styles.statusText, { color: item.status === 'delivered' ? '#059669' : '#D97706' }]}>
                  {item.status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>

            <View style={styles.taskBody}>
              <View style={styles.taskRow}>
                <Ionicons name="storefront" size={16} color="#64748B" />
                <Text style={styles.taskText}>{item.shop_name}</Text>
              </View>
              <View style={styles.taskRow}>
                <Ionicons name="location" size={16} color="#64748B" />
                <Text style={styles.taskText} numberOfLines={2}>{item.shipping_address || 'No address'}</Text>
              </View>
              <View style={styles.taskRow}>
                <Ionicons name="cash" size={16} color="#64748B" />
                <Text style={styles.taskText}>KES {item.total_amount.toLocaleString()}</Text>
              </View>
            </View>

            {item.status === 'out_for_delivery' && (
              <View style={styles.taskActions}>
                <TouchableOpacity style={[styles.taskBtn, styles.pickupBtn]} onPress={() => handleStatusUpdate(item.order_id, 'picked_up')}>
                  <Text style={styles.taskBtnText}>📦 Picked Up</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.taskBtn, styles.transitBtn]} onPress={() => handleStatusUpdate(item.order_id, 'in_transit')}>
                  <Text style={styles.taskBtnText}>🚚 In Transit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.taskBtn, styles.deliverBtn]} onPress={() => handleStatusUpdate(item.order_id, 'delivered')}>
                  <Text style={styles.taskBtnText}>✓ Delivered</Text>
                </TouchableOpacity>
              </View>
            )}

            {item.status === 'in_transit' && (
              <TouchableOpacity style={[styles.taskBtn, styles.deliverBtn, { marginTop: 8 }]} onPress={() => handleStatusUpdate(item.order_id, 'delivered')}>
                <Text style={styles.taskBtnText}>✓ Mark Delivered</Text>
              </TouchableOpacity>
            )}

            {item.status === 'delivered' && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}

            <View style={styles.contactRow}>
              <TouchableOpacity style={styles.contactBtn} onPress={() => handleCall(item.shop_phone)}>
                <Ionicons name="call" size={14} color="#2196F3" />
                <Text style={styles.contactText}>Call Shop</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactBtn} onPress={() => handleNavigate(item.shipping_address)}>
                <Ionicons name="navigate" size={14} color="#10B981" />
                <Text style={styles.contactText}>Navigate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bicycle" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No delivery assignments</Text>
            <Text style={styles.emptySub}>Check back when orders are assigned to you</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748B' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  list: { padding: 12 },
  taskCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  taskNumber: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  taskBody: { marginBottom: 12 },
  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  taskText: { fontSize: 13, color: '#334155', marginLeft: 8, flex: 1 },
  taskActions: { flexDirection: 'row', gap: 8 },
  taskBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  pickupBtn: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  transitBtn: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
  deliverBtn: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  taskBtnText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  completedText: { fontSize: 13, fontWeight: '700', color: '#059669' },
  contactRow: { flexDirection: 'row', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  empty: { alignItems: 'center', padding: 60 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#64748B', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
});
