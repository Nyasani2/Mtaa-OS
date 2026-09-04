import { useState } from 'react';
// @ts-nocheck
// ============================================================================
// MTAA Restaurant Module — Delivery Management Screen
// ============================================================================

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, Linking } from 'react-native';
import { useOrders } from '@/lib/restaurant/hooks';

export default function RestaurantDelivery() {
  const { orders, isLoading, loadOrders } = useOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [driverNote, setDriverNote] = useState('');

  const deliveryOrders = orders.filter((o: any) => o.order_type === 'delivery');

  useEffect(() => {
    loadOrders({ order_type: 'delivery', limit: 50 });
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders({ order_type: 'delivery', limit: 50 });
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'preparing': return '#3B82F6';
      case 'ready': return '#10B981';
      case 'out_for_delivery': return '#8B5CF6';
      case 'delivered': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#9CA3AF';
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleNavigate = (address: any) => {
    const query = encodeURIComponent(address?.formatted || address?.street || '');
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivery Orders</Text>
        <Text style={styles.headerCount}>{deliveryOrders.filter((o: any) => o.status !== 'delivered' && o.status !== 'cancelled').length} active</Text>
      </View>

      <FlatList
        data={deliveryOrders}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.ordersList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }: any) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => { setSelectedOrder(item); setShowDetail(true); }}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>#{item.order_number}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.replace('_', ' ')}</Text>
              </View>
            </View>
            <Text style={styles.customerName}>👤 {item.customer_name || 'Guest'}</Text>
            <Text style={styles.address} numberOfLines={2}>📍 {item.delivery_address?.formatted || item.delivery_address?.street || 'No address'}</Text>
            <View style={styles.orderFooter}>
              <Text style={styles.total}>£{item.total_amount?.toFixed(2)}</Text>
              <Text style={styles.time}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{isLoading ? 'Loading...' : 'No delivery orders'}</Text>
          </View>
        }
      />

      {/* Order Detail Modal */}
      <Modal visible={showDetail} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order #{selectedOrder?.order_number}</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <>
                <Text style={styles.detailLabel}>Customer</Text>
                <Text style={styles.detailValue}>{selectedOrder.customer_name || 'Guest'}</Text>
                {selectedOrder.customer_phone && (
                  <TouchableOpacity style={styles.actionRow} onPress={() => handleCall(selectedOrder.customer_phone)}>
                    <Text style={styles.actionText}>📞 {selectedOrder.customer_phone}</Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.detailLabel}>Delivery Address</Text>
                <Text style={styles.detailValue}>
                  {selectedOrder.delivery_address?.formatted || selectedOrder.delivery_address?.street || 'No address'}
                </Text>
                <TouchableOpacity style={styles.actionRow} onPress={() => handleNavigate(selectedOrder.delivery_address)}>
                  <Text style={styles.actionText}>🗺️ Open in Maps</Text>
                </TouchableOpacity>

                <Text style={styles.detailLabel}>Items</Text>
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <Text key={idx} style={styles.itemText}>• {item.quantity}x {item.name}</Text>
                ))}

                <Text style={styles.detailLabel}>Total</Text>
                <Text style={styles.detailTotal}>£{selectedOrder.total_amount?.toFixed(2)}</Text>

                <TextInput
                  style={styles.noteInput}
                  placeholder="Driver notes..."
                  value={driverNote}
                  onChangeText={setDriverNote}
                  placeholderTextColor="#9CA3AF"
                />

                <View style={styles.actionButtons}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}>
                    <Text style={styles.actionBtnText}>📦 Out for Delivery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.actionBtnText}>✓ Delivered</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#1F2937',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  headerCount: { fontSize: 14, color: '#D1D5DB' },
  ordersList: { padding: 12 },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderNumber: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  customerName: { fontSize: 14, color: '#374151', marginBottom: 4 },
  address: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  total: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
  time: { fontSize: 13, color: '#9CA3AF' },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyStateText: { fontSize: 15, color: '#9CA3AF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  modalClose: { fontSize: 24, color: '#6B7280', padding: 4 },
  detailLabel: { fontSize: 12, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 16, marginBottom: 4 },
  detailValue: { fontSize: 15, color: '#1F2937' },
  actionRow: { marginTop: 6 },
  actionText: { fontSize: 14, color: '#3B82F6' },
  itemText: { fontSize: 14, color: '#4B5563', paddingVertical: 2 },
  detailTotal: { fontSize: 22, fontWeight: 'bold', color: '#10B981' },
  noteInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
