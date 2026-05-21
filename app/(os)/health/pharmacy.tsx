// app/(os)/health/pharmacy.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { HealthPharmacyOrder } from '@/lib/health/types';
import { Ionicons } from '@expo/vector-icons';

export default function PharmacyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<HealthPharmacyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const { data: patient } = await supabase.from('health_patients').select('id').eq('user_id', user.id).single();
      if (patient) {
        const { data, error } = await supabase.from('health_pharmacy_orders').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false });
        if (error) throw error;
        setOrders(data as HealthPharmacyOrder[] || []);
      }
    } catch (err) {
      console.error('Failed to load pharmacy orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      processing: '#3B82F6',
      ready: '#10B981',
      delivered: '#10B981',
      cancelled: '#EF4444',
    };
    return colors[status] || '#64748B';
  };

  const renderOrder = ({ item }: { item: HealthPharmacyOrder }) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => router.push(`/health/pharmacy-order/${item.id}` as any)}>
      <View style={styles.orderHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.order_status) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.order_status) }]}>
            {item.order_status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.itemCount}>{item.items?.length || 0} items</Text>
      <Text style={styles.totalAmount}>KES {item.total_amount.toLocaleString()}</Text>
      {item.delivery_address && (
        <View style={styles.deliveryRow}>
          <Ionicons name="location" size={14} color="#64748B" />
          <Text style={styles.deliveryText}>{item.delivery_address}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pharmacy</Text>
        <TouchableOpacity onPress={() => router.push('/health/new-pharmacy-order' as any)}>
          <Ionicons name="add" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cart-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No pharmacy orders</Text>
              <TouchableOpacity style={styles.orderButton} onPress={() => router.push('/health/new-pharmacy-order' as any)}>
                <Text style={styles.orderButtonText}>Place Order</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  loader: { flex: 1, justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  orderCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  orderDate: { fontSize: 12, color: '#94A3B8' },
  itemCount: { fontSize: 14, color: '#64748B', marginBottom: 4 },
  totalAmount: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  deliveryText: { fontSize: 12, color: '#64748B' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#64748B', marginTop: 12, marginBottom: 20 },
  orderButton: { backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  orderButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
