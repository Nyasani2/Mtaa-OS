import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, FlatList, TextInput } from 'react-native';
import { Alert, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert, Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert, deliveryService, DeliveryAgent } from '@/domains/shop/services/deliveryService';
import { supabase } from '@/lib/supabase/client';

interface DeliveryTask {
  id: string;
  order_id: string;
  order_number: string;
  buyer_user_id?: string;
  shipping_address?: string;
  total_amount: number;
  status?: string;
  tax_rate?: number;
  cover_image?: string;
  location?: string;
  delivery_type: string;
  assigned_agent_id?: string;
  created_at: string;
}

export default function ShopDeliveryScreen() {
  const router = useRouter();
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const [orders, setOrders] = useState<DeliveryTask[]>([]);
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryTask | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed'>('pending');
  const [dispatchType, setDispatchType] = useState<'boda' | 'mtaxi'>('boda');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const loadData = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      // Get orders for this shop that have delivery requests
      const { data: reqs } = await supabase
        .from('shop_delivery_requests')
        .select(`
          id, order_id, shop_id, delivery_type, status, assigned_agent_id, created_at,
          shop_orders!inner(id, order_number, buyer_user_id, status, total_amount, shipping_address, created_at)
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      const mapped: DeliveryTask[] = (reqs || []).map((r: any) => ({
        id: r.id,
        order_id: r.order_id,
        order_number: r.shop_orders?.order_number || r.order_id.slice(0, 8),
        buyer_user_id: r.shop_orders?.buyer_user_id,
        shipping_address: r.shop_orders?.shipping_address,
        total_amount: r.shop_orders?.total_amount || 0,
        status: r.shop_orders?.status || r.status,
        delivery_type: r.delivery_type,
        assigned_agent_id: r.assigned_agent_id,
        created_at: r.created_at,
      }));

      setOrders(mapped);
      const agentList = await deliveryService.getAvailableAgents(shopId);
      setAgents(agentList);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadData();
    const sub = supabase
      .channel('shop_delivery_' + shopId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_delivery_requests', filter: 'shop_id=eq.' + shopId }, () => { loadData(); })
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [shopId, loadData]);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'pending') return ['pending','confirmed','preparing','ready'].includes(o.status);
    if (activeTab === 'active') return o.status === 'out_for_delivery';
    return o.status === 'delivered';
  });

  async function handleAssignAgent(agentId: string) {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      await deliveryService.assignInHouseAgent(selectedOrder.order_id, shopId!, agentId);
      setShowAssignModal(false); setSelectedOrder(null); loadData();
      Alert.alert('Assigned', 'Delivery agent assigned successfully');
    } catch (err: any) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  }

  async function handleDispatchExternal() {
    if (!selectedOrder || !shopId) return;
    setLoading(true);
    try {
      await deliveryService.dispatchExternal(
        selectedOrder.order_id,
        shopId,
        dispatchType,
        { address: pickupAddress },
        { address: dropoffAddress },
        customerPhone || undefined
      );
      setShowDispatchModal(false); setSelectedOrder(null); loadData();
      Alert.alert('Dispatched', dispatchType.toUpperCase() + ' dispatched for delivery');
    } catch (err: any) { Alert.alert('Dispatch Failed', err.message); }
    finally { setLoading(false); }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#3B82F6';
      case 'preparing': return '#8B5CF6';
      case 'ready': return '#10B981';
      case 'out_for_delivery': return '#EC4899';
      case 'delivered': return '#059669';
      case 'cancelled': return '#DC2626';
      default: return '#6B7280';
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Management</Text>
        <TouchableOpacity onPress={loadData}>
          <Ionicons name="refresh" size={22} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {(['pending','active','completed'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
            <Text style={[styles.tabCount, activeTab === tab && styles.tabCountActive]}>
              {orders.filter((o) => {
                if (tab === 'pending') return ['pending','confirmed','preparing','ready'].includes(o.status);
                if (tab === 'active') return o.status === 'out_for_delivery';
                return o.status === 'delivered';
              }).length}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && orders.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2196F3" />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>#{item.order_number}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.replace(/_/g, ' ')}</Text>
                </View>
              </View>
              <Text style={styles.address} numberOfLines={2}>📍 {item.shipping_address || 'No address'}</Text>
              <View style={styles.orderFooter}>
                <Text style={styles.total}>KES {item.total_amount?.toLocaleString()}</Text>
                <Text style={styles.time}>{new Date(item.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</Text>
              </View>
              {activeTab === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, styles.assignBtn]} onPress={() => { setSelectedOrder(item); setShowAssignModal(true); }}>
                    <Text style={styles.actionBtnText}>Assign Agent</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.dispatchBtn]} onPress={() => { setSelectedOrder(item); setShowDispatchModal(true); }}>
                    <Text style={styles.actionBtnText}>Dispatch Boda/MTaxi</Text>
                  </TouchableOpacity>
                </View>
              )}
              {activeTab === 'active' && (
                <TouchableOpacity style={styles.trackBtn} onPress={() => router.push({ pathname: '/(commerce)/shop/delivery-tracking', params: { orderId: item.order_id } } as any)}>
                  <Text style={styles.trackBtnText}>📍 Track Delivery</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No {activeTab} deliveries</Text></View>}
        />
      )}

      {/* Assign Agent Modal */}
      <Modal visible={showAssignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Delivery Agent</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Order #{selectedOrder?.order_number}</Text>
            <FlatList
              data={agents}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.agentCard} onPress={() => handleAssignAgent(item.id)}>
                  <View style={styles.agentAvatar}><Text style={styles.agentAvatarText}>{item.name.charAt(0)}</Text></View>
                  <View style={styles.agentInfo}>
                    <Text style={styles.agentName}>{item.name}</Text>
                    <Text style={styles.agentRole}>{item.role}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No active agents</Text>}
            />
          </View>
        </View>
      </Modal>

      {/* Dispatch Modal */}
      <Modal visible={showDispatchModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>External Dispatch</Text>
              <TouchableOpacity onPress={() => setShowDispatchModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Order #{selectedOrder?.order_number}</Text>

            <View style={styles.dispatchTypeRow}>
              <TouchableOpacity style={[styles.dispatchTypeBtn, dispatchType === 'boda' && styles.dispatchTypeActive]} onPress={() => setDispatchType('boda')}>
                <Ionicons name="bicycle" size={20} color={dispatchType === 'boda' ? '#2196F3' : '#64748B'} />
                <Text style={[styles.dispatchTypeText, dispatchType === 'boda' && styles.dispatchTypeTextActive]}>Boda</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dispatchTypeBtn, dispatchType === 'mtaxi' && styles.dispatchTypeActive]} onPress={() => setDispatchType('mtaxi')}>
                <Ionicons name="car" size={20} color={dispatchType === 'mtaxi' ? '#2196F3' : '#64748B'} />
                <Text style={[styles.dispatchTypeText, dispatchType === 'mtaxi' && styles.dispatchTypeTextActive]}>MTaxi</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Pickup Address</Text>
            <TextInput style={styles.input} placeholder="Shop address" value={pickupAddress} onChangeText={setPickupAddress} />

            <Text style={styles.inputLabel}>Dropoff Address</Text>
            <TextInput style={styles.input} placeholder="Customer address" value={dropoffAddress} onChangeText={setDropoffAddress} />

            <Text style={styles.inputLabel}>Customer Phone</Text>
            <TextInput style={styles.input} placeholder="Phone number" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />

            <TouchableOpacity style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]} onPress={handleDispatchExternal} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Dispatch {dispatchType.toUpperCase()}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  tabRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F1F5F9' },
  tabBtnActive: { backgroundColor: '#2196F3' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#fff' },
  tabCount: { fontSize: 11, fontWeight: '700', color: '#94A3B8', backgroundColor: '#E2E8F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  tabCountActive: { color: '#fff', backgroundColor: 'rgba(255,255,255,0.3)' },
  list: { padding: 12 },
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderNumber: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  address: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  total: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  time: { fontSize: 12, color: '#94A3B8' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  assignBtn: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  dispatchBtn: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  trackBtn: { marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: '#F3E8FF', borderWidth: 1, borderColor: '#E9D5FF', alignItems: 'center' },
  trackBtnText: { fontSize: 13, fontWeight: '700', color: '#7C3AED' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalClose: { fontSize: 20, color: '#94A3B8' },
  modalSub: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  agentCard: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#F8FAFC', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  agentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2196F3', alignItems: 'center', justifyContent: 'center' },
  agentAvatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  agentInfo: { flex: 1, marginLeft: 12 },
  agentName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  agentRole: { fontSize: 12, color: '#64748B', textTransform: 'capitalize' },
  dispatchTypeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  dispatchTypeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  dispatchTypeActive: { borderColor: '#2196F3', backgroundColor: '#EFF6FF' },
  dispatchTypeText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  dispatchTypeTextActive: { color: '#2196F3' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12 },
  confirmBtn: { backgroundColor: '#2196F3', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
