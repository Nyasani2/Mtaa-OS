import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { deliveryService } from '@/domains/shop/services/deliveryService';
import { supabase } from '@/lib/supabase/client';

interface TimelineEvent {
  status: string;
  label: string;
  time: string;
  completed: boolean;
}

export default function DeliveryTrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    if (orderId) loadOrder();
    const sub = supabase
      .channel('delivery_track_' + orderId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_orders', filter: 'id=eq.' + orderId }, () => { loadOrder(); })
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [orderId]);

  async function loadOrder() {
    if (!orderId) return;
    setLoading(true);
    try {
      const data = await deliveryService.getCustomerDelivery(orderId);
      setOrder(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleConfirmDelivery() {
    if (!orderId) return;
    setReleasing(true);
    try {
      await deliveryService.updateDeliveryStatus(orderId, 'delivered');
      loadOrder();
    } catch (err: any) { alert(err.message); }
    finally { setReleasing(false); }
  }

  function getTimeline(): TimelineEvent[] {
    const status = order?.status || 'pending';
    const created = order?.created_at ? new Date(order.created_at).toLocaleString() : '';
    const delivered = order?.delivered_at ? new Date(order.delivered_at).toLocaleString() : '';
    return [
      { status: 'pending', label: 'Order Placed', time: created, completed: true },
      { status: 'confirmed', label: 'Confirmed', time: '', completed: ['confirmed','preparing','ready','out_for_delivery','delivered'].includes(status) },
      { status: 'preparing', label: 'Preparing', time: '', completed: ['preparing','ready','out_for_delivery','delivered'].includes(status) },
      { status: 'ready', label: 'Ready for Pickup', time: '', completed: ['ready','out_for_delivery','delivered'].includes(status) },
      { status: 'out_for_delivery', label: 'Out for Delivery', time: '', completed: ['out_for_delivery','delivered'].includes(status) },
      { status: 'delivered', label: 'Delivered', time: delivered, completed: status === 'delivered' },
    ];
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading delivery status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const timeline = getTimeline();
  const isDelivered = order?.status === 'delivered';
  const isOutForDelivery = order?.status === 'out_for_delivery';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delivery Tracking</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.orderCard}>
          <Text style={styles.orderNumber}>Order #{order?.order_number}</Text>
          <Text style={styles.shopName}>{order?.shops?.name || 'Shop'}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isDelivered ? '#10B981' : '#EC4899' }]} />
            <Text style={styles.statusText}>{order?.status?.replace(/_/g, ' ')}</Text>
          </View>
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>Delivery Progress</Text>
          {timeline.map((event, idx) => (
            <View key={idx} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, event.completed && styles.timelineDotCompleted]}>
                  {event.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                {idx < timeline.length - 1 && (
                  <View style={[styles.timelineLine, timeline[idx + 1]?.completed && styles.timelineLineCompleted]} />
                )}
              </View>
              <View style={styles.timelineRight}>
                <Text style={[styles.timelineLabel, event.completed && styles.timelineLabelCompleted]}>{event.label}</Text>
                {event.time ? <Text style={styles.timelineTime}>{event.time}</Text> : null}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={18} color="#64748B" />
            <Text style={styles.detailText}>{order?.shipping_address || 'No address'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash" size={18} color="#64748B" />
            <Text style={styles.detailText}>KES {order?.total_amount?.toLocaleString()}</Text>
          </View>
          {order?.deliveryRequest?.external_module && (
            <View style={styles.detailRow}>
              <Ionicons name="bicycle" size={18} color="#64748B" />
              <Text style={styles.detailText}>{order.deliveryRequest.external_module.toUpperCase()} dispatched</Text>
            </View>
          )}
        </View>

        {isOutForDelivery && (
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Has your order been delivered?</Text>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmDelivery} disabled={releasing}>
              {releasing ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>✓ Confirm Delivery</Text>}
            </TouchableOpacity>
          </View>
        )}

        {isDelivered && (
          <View style={styles.deliveredCard}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.deliveredTitle}>Delivered Successfully</Text>
            <Text style={styles.deliveredSub}>Thank you for shopping with us!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748B' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  orderCard: { margin: 16, padding: 20, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  orderNumber: { fontSize: 14, fontWeight: '700', color: '#2196F3' },
  shopName: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusText: { fontSize: 14, fontWeight: '600', color: '#334155', textTransform: 'capitalize' },
  timelineCard: { marginHorizontal: 16, marginBottom: 16, padding: 20, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  timelineRow: { flexDirection: 'row', marginBottom: 4 },
  timelineLeft: { alignItems: 'center', width: 28 },
  timelineDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  timelineDotCompleted: { backgroundColor: '#10B981' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },
  timelineLineCompleted: { backgroundColor: '#10B981' },
  timelineRight: { flex: 1, paddingLeft: 12, paddingBottom: 20 },
  timelineLabel: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  timelineLabelCompleted: { color: '#0F172A' },
  timelineTime: { fontSize: 12, color: '#64748B', marginTop: 2 },
  detailsCard: { marginHorizontal: 16, marginBottom: 16, padding: 20, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  detailText: { fontSize: 14, color: '#334155', marginLeft: 12, flex: 1 },
  actionCard: { marginHorizontal: 16, marginBottom: 16, padding: 20, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  actionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  confirmBtn: { backgroundColor: '#10B981', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  deliveredCard: { marginHorizontal: 16, marginBottom: 16, padding: 40, backgroundColor: '#ECFDF5', borderRadius: 16, borderWidth: 1, borderColor: '#A7F3D0', alignItems: 'center' },
  deliveredTitle: { fontSize: 18, fontWeight: '800', color: '#059669', marginTop: 12 },
  deliveredSub: { fontSize: 14, color: '#10B981', marginTop: 4 },
});
