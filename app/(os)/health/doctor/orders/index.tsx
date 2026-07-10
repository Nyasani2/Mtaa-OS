import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/useAuthStore';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft, Plus, Pill, FlaskConical, Scan, Stethoscope,
  Clock, CheckCircle2, XCircle, AlertCircle, Search, Filter
} from 'lucide-react-native';

interface Order {
  id: string;
  patient_id: string;
  patient_name: string;
  type: 'medication' | 'lab' | 'imaging' | 'referral' | 'procedure';
  details: string;
  priority: 'routine' | 'urgent' | 'stat';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  ordered_by: string;
  ordered_at: string;
  completed_at: string | null;
  notes: string | null;
}

const ORDER_TYPES = [
  { key: 'medication', label: 'Medication', icon: Pill, color: '#6366f1' },
  { key: 'lab', label: 'Lab Test', icon: FlaskConical, color: '#22c55e' },
  { key: 'imaging', label: 'Imaging', icon: Scan, color: '#f59e0b' },
  { key: 'referral', label: 'Referral', icon: Stethoscope, color: '#8b5cf6' },
  { key: 'procedure', label: 'Procedure', icon: AlertCircle, color: '#ef4444' },
];

const PRIORITY_COLORS = { routine: '#64748b', urgent: '#f59e0b', stat: '#ef4444' };
const STATUS_COLORS = { pending: '#f59e0b', in_progress: '#3b82f6', completed: '#22c55e', cancelled: '#ef4444' };

export default function OrdersScreen() {
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newType, setNewType] = useState<Order['type']>('medication');
  const [newDetails, setNewDetails] = useState('');
  const [newPriority, setNewPriority] = useState<Order['priority']>('routine');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    loadOrders();
  }, [patientId]);

  const loadOrders = async () => {
    try {
      let query = supabase
        .from('medical_orders')
        .select('*, // STUB_REMOVED: "patients"(full_name)')
        .order('ordered_at', { ascending: false });

      if (patientId) query = query.eq('patient_id', patientId);

      const { data, error } = await query;
      if (error) throw error;

      const formatted = (data || []).map((o: any) => ({
        ...o,
        patient_name: o.// STUB_REMOVED: "patients"?.full_name || 'Unknown',
      }));
      setOrders(formatted);
    } catch (err) {
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async () => {
    if (!newDetails.trim()) {
      Alert.alert('Error', 'Order details are required');
      return;
    }

    try {
      const { error } = await supabase.from('medical_orders').insert({
        patient_id: patientId || null,
        type: newType,
        details: newDetails,
        priority: newPriority,
        status: 'pending',
        ordered_by: user?.id,
        notes: newNotes || null,
      });

      if (error) throw error;

      setShowNewOrder(false);
      setNewDetails('');
      setNewNotes('');
      setNewType('medication');
      setNewPriority('routine');
      loadOrders();
    } catch (err) {
      Alert.alert('Error', 'Failed to create order');
    }
  };

  const updateStatus = async (orderId: string, status: Order['status']) => {
    try {
      const updates: any = { status };
      if (status === 'completed') updates.completed_at = new Date().toISOString();

      const { error } = await supabase.from('medical_orders').update(updates).eq('id', orderId);
      if (error) throw error;
      loadOrders();
    } catch (err) {
      Alert.alert('Error', 'Failed to update order');
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filterType && o.type !== filterType) return false;
    if (filterStatus && o.status !== filterStatus) return false;
    if (searchQuery && !o.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) && !o.details.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (showNewOrder) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowNewOrder(false)} style={styles.backBtn}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Order</Text>
          <TouchableOpacity onPress={createOrder} style={styles.saveBtn}>
            <CheckCircle2 size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.formLabel}>Order Type</Text>
        <View style={styles.typeGrid}>
          {ORDER_TYPES.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeCard, newType === t.key && { borderColor: t.color, backgroundColor: t.color + '20' }]}
              onPress={() => setNewType(t.key as Order['type'])}
            >
              <t.icon size={24} color={t.color} />
              <Text style={[styles.typeLabel, newType === t.key && { color: t.color }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.formLabel}>Priority</Text>
        <View style={styles.priorityRow}>
          {(['routine', 'urgent', 'stat'] as const).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.priorityChip, newPriority === p && { backgroundColor: PRIORITY_COLORS[p] + '30', borderColor: PRIORITY_COLORS[p] }]}
              onPress={() => setNewPriority(p)}
            >
              <AlertCircle size={14} color={PRIORITY_COLORS[p]} />
              <Text style={[styles.priorityText, { color: PRIORITY_COLORS[p] }]}>{p.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.formLabel}>Order Details</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Enter order details..."
          placeholderTextColor="#64748b"
          value={newDetails}
          onChangeText={setNewDetails}
        />

        <Text style={styles.formLabel}>Additional Notes</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Any special instructions..."
          placeholderTextColor="#64748b"
          value={newNotes}
          onChangeText={setNewNotes}
        />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Orders</Text>
        <TouchableOpacity onPress={() => setShowNewOrder(true)} style={styles.addBtn}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        <TouchableOpacity style={[styles.filterChip, !filterType && styles.filterChipActive]} onPress={() => setFilterType(null)}>
          <Filter size={14} color={!filterType ? '#fff' : '#94a3b8'} />
          <Text style={[styles.filterText, !filterType && styles.filterTextActive]}>All Types</Text>
        </TouchableOpacity>
        {ORDER_TYPES.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.filterChip, filterType === t.key && { backgroundColor: t.color + '30', borderColor: t.color }]}
            onPress={() => setFilterType(filterType === t.key ? null : t.key)}
          >
            <t.icon size={14} color={filterType === t.key ? t.color : '#94a3b8'} />
            <Text style={[styles.filterText, filterType === t.key && { color: t.color }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const typeConfig = ORDER_TYPES.find(t => t.key === item.type) || ORDER_TYPES[0];
          return (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '20' }]}>
                  <typeConfig.icon size={14} color={typeConfig.color} />
                  <Text style={[styles.typeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status.replace('_', ' ')}</Text>
                </View>
              </View>

              <Text style={styles.orderPatient}>{item.patient_name}</Text>
              <Text style={styles.orderDetails}>{item.details}</Text>

              <View style={styles.orderFooter}>
                <View style={styles.orderMeta}>
                  <Clock size={12} color="#64748b" />
                  <Text style={styles.orderMetaText}>{new Date(item.ordered_at).toLocaleDateString()}</Text>
                  <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[item.priority] }]} />
                  <Text style={[styles.orderMetaText, { color: PRIORITY_COLORS[item.priority] }]}>{item.priority}</Text>
                </View>

                {item.status === 'pending' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => updateStatus(item.id, 'in_progress')} style={styles.actionBtn}>
                      <CheckCircle2 size={16} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => updateStatus(item.id, 'cancelled')} style={styles.actionBtn}>
                      <XCircle size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                )}
                {item.status === 'in_progress' && (
                  <TouchableOpacity onPress={() => updateStatus(item.id, 'completed')} style={styles.completeBtn}>
                    <CheckCircle2 size={16} color="#22c55e" />
                    <Text style={styles.completeText}>Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AlertCircle size={48} color="#334155" />
            <Text style={styles.emptyTitle}>No orders</Text>
            <Text style={styles.emptySubtitle}>Tap + to create a medical order</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  saveBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, marginHorizontal: 16, paddingHorizontal: 12, marginBottom: 8 },
  searchInput: { flex: 1, color: '#fff', paddingVertical: 10, marginLeft: 8, fontSize: 14 },
  filterScroll: { maxHeight: 48, marginBottom: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#334155', marginRight: 8 },
  filterChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  filterText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  formLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 16 },
  typeCard: { width: '30%', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: '#334155' },
  typeLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginTop: 8 },
  priorityRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16 },
  priorityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#334155' },
  priorityText: { fontSize: 12, fontWeight: '700' },
  textArea: { color: '#fff', fontSize: 14, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginHorizontal: 16, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#334155' },
  orderCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  typeText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  orderPatient: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  orderDetails: { color: '#94a3b8', fontSize: 13, lineHeight: 20, marginBottom: 10 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderMetaText: { color: '#64748b', fontSize: 12 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  completeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#064e3b', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  completeText: { color: '#22c55e', fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: '#94a3b8', fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { color: '#64748b', fontSize: 14, marginTop: 8 },
});
