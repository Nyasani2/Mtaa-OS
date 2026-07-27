// domains/shop/components/OrderManager.tsx
// Shop order management component
// Imported by: app/(commerce)/shop/[id]/orders.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ShopOrder {
  id: string;
  customerName: string;
  items: number;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  createdAt: string;
}

export interface OrderManagerProps {
  orders: ShopOrder[];
  onUpdateStatus?: (orderId: string, status: ShopOrder['status']) => void;
  onViewDetail?: (orderId: string) => void;
  loading?: boolean;
}

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  refunded: '#6b7280',
};

export default function OrderManager({ orders, onUpdateStatus, onViewDetail, loading }: OrderManagerProps) {
  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  if (!orders?.length) {
    return (
      <View style={styles.center}>
        <Ionicons name="cube-outline" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>No orders yet</Text>
      </View>
    );
  }

  const renderOrder = ({ item }: { item: ShopOrder }) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => onViewDetail?.(item.id)}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item.id.slice(-6).toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '15' }]}>
          <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      <Text style={styles.customerName}>{item.customerName}</Text>
      <View style={styles.orderMeta}>
        <Text style={styles.metaText}>{item.items} items</Text>
        <Text style={styles.metaText}>·</Text>
        <Text style={styles.totalText}>{item.currency} {item.total.toLocaleString()}</Text>
      </View>
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>

      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#22c55e' }]}
            onPress={() => onUpdateStatus?.(item.id, 'confirmed')}
          >
            <Text style={styles.actionBtnText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
            onPress={() => onUpdateStatus?.(item.id, 'cancelled')}
          >
            <Text style={styles.actionBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={renderOrder}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { fontSize: 14, color: '#6b7280', marginTop: 12 },
  emptyText: { fontSize: 16, color: '#6b7280', marginTop: 12 },
  list: { padding: 16 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  customerName: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 4 },
  orderMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  metaText: { fontSize: 13, color: '#6b7280', marginRight: 6 },
  totalText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
  date: { fontSize: 12, color: '#9ca3af' },
  actions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
