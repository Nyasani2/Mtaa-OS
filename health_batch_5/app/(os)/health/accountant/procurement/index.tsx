import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface ProcurementRecord {
  id: string;
  facility_id: string;
  facility_name: string;
  item_name: string;
  category: 'medical_equipment' | 'pharmaceuticals' | 'office_supplies' | 'laboratory' | 'surgical' | 'it_equipment' | 'furniture' | 'other';
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  supplier_name: string;
  supplier_contact: string | null;
  order_date: string;
  expected_delivery: string | null;
  actual_delivery: string | null;
  status: 'requested' | 'approved' | 'ordered' | 'delivered' | 'cancelled' | 'rejected';
  approved_by: string | null;
  notes: string | null;
  created_at: string;
}

export default function AccountantProcurementScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<ProcurementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ProcurementRecord['status']>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    item_name: '',
    category: 'medical_equipment' as ProcurementRecord['category'],
    quantity: '',
    unit: 'pcs',
    unit_cost: '',
    supplier_name: '',
    supplier_contact: '',
    expected_delivery: '',
    notes: '',
  });

  const categories: ProcurementRecord['category'][] = ['medical_equipment', 'pharmaceuticals', 'office_supplies', 'laboratory', 'surgical', 'it_equipment', 'furniture', 'other'];

  useEffect(() => {
    loadProcurement();
  }, [filter]);

  async function loadProcurement() {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('health_procurement')
        .select('*, health_facilities(name)')
        .order('order_date', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: ProcurementRecord[] = (data || []).map((r: any) => ({
        id: r.id,
        facility_id: r.facility_id,
        facility_name: r.health_facilities?.name || 'Unknown',
        item_name: r.item_name,
        category: r.category,
        quantity: r.quantity || 0,
        unit: r.unit || 'pcs',
        unit_cost: r.unit_cost || 0,
        total_cost: r.total_cost || 0,
        supplier_name: r.supplier_name,
        supplier_contact: r.supplier_contact,
        order_date: r.order_date,
        expected_delivery: r.expected_delivery,
        actual_delivery: r.actual_delivery,
        status: r.status,
        approved_by: r.approved_by,
        notes: r.notes,
        created_at: r.created_at,
      }));

      setRecords(mapped);
    } catch (err) {
      console.error('Procurement load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function createRequest() {
    if (!user || !form.item_name || !form.quantity || !form.unit_cost || !form.supplier_name) return;
    const total = parseFloat(form.quantity) * parseFloat(form.unit_cost);
    const { error } = await supabase.from('health_procurement').insert({
      item_name: form.item_name,
      category: form.category,
      quantity: parseFloat(form.quantity),
      unit: form.unit,
      unit_cost: parseFloat(form.unit_cost),
      total_cost: total,
      supplier_name: form.supplier_name,
      supplier_contact: form.supplier_contact || null,
      expected_delivery: form.expected_delivery || null,
      notes: form.notes || null,
      status: 'requested',
      order_date: new Date().toISOString().split('T')[0],
    });
    if (!error) {
      setShowForm(false);
      setForm({ item_name: '', category: 'medical_equipment', quantity: '', unit: 'pcs', unit_cost: '', supplier_name: '', supplier_contact: '', expected_delivery: '', notes: '' });
      loadProcurement();
    }
  }

  async function updateStatus(id: string, status: ProcurementRecord['status']) {
    const updates: any = { status };
    if (status === 'approved') updates.approved_by = user?.id;
    if (status === 'delivered') updates.actual_delivery = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('health_procurement').update(updates).eq('id', id);
    if (!error) loadProcurement();
  }

  const statusConfig: Record<string, { color: string; next: ProcurementRecord['status'] | null; label: string }> = {
    requested: { color: '#f59e0b', next: 'approved', label: 'Approve' },
    approved: { color: '#3b82f6', next: 'ordered', label: 'Mark Ordered' },
    ordered: { color: '#8b5cf6', next: 'delivered', label: 'Mark Delivered' },
    delivered: { color: '#22c55e', next: null, label: 'Delivered' },
    cancelled: { color: '#9ca3af', next: null, label: 'Cancelled' },
    rejected: { color: '#ef4444', next: null, label: 'Rejected' },
  };

  const categoryConfig: Record<string, { color: string; icon: string }> = {
    medical_equipment: { color: '#3b82f6', icon: 'hardware-chip' },
    pharmaceuticals: { color: '#22c55e', icon: 'medical' },
    office_supplies: { color: '#f59e0b', icon: 'document' },
    laboratory: { color: '#8b5cf6', icon: 'flask' },
    surgical: { color: '#ef4444', icon: 'cut' },
    it_equipment: { color: '#14b8a6', icon: 'desktop' },
    furniture: { color: '#ec4899', icon: 'bed' },
    other: { color: '#9ca3af', icon: 'ellipsis-horizontal' },
  };

  const totalPending = records.filter(r => r.status === 'requested' || r.status === 'approved').reduce((s, r) => s + r.total_cost, 0);
  const totalOrdered = records.filter(r => r.status === 'ordered').reduce((s, r) => s + r.total_cost, 0);
  const totalDelivered = records.filter(r => r.status === 'delivered').reduce((s, r) => s + r.total_cost, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Procurement</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      <View style={styles.totalsRow}>
        <View style={[styles.totalCard, { backgroundColor: '#f59e0b20' }]}>
          <Text style={[styles.totalValue, { color: '#f59e0b' }]}>KES {totalPending.toLocaleString()}</Text>
          <Text style={styles.totalLabel}>Pending</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#8b5cf620' }]}>
          <Text style={[styles.totalValue, { color: '#8b5cf6' }]}>KES {totalOrdered.toLocaleString()}</Text>
          <Text style={styles.totalLabel}>Ordered</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#22c55e20' }]}>
          <Text style={[styles.totalValue, { color: '#22c55e' }]}>KES {totalDelivered.toLocaleString()}</Text>
          <Text style={styles.totalLabel}>Delivered</Text>
        </View>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Procurement Request</Text>
          <TextInput style={styles.input} value={form.item_name} onChangeText={t => setForm(f => ({ ...f, item_name: t }))} placeholder="Item name" placeholderTextColor="#64748b" />
          <View style={styles.categoryRow}>
            {categories.map(cat => (
              <TouchableOpacity key={cat} style={[styles.catBtn, form.category === cat && { backgroundColor: categoryConfig[cat]?.color }]} onPress={() => setForm(f => ({ ...f, category: cat }))}>
                <Text style={[styles.catBtnText, form.category === cat && { color: '#fff' }]}>{cat.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.row2}>
            <TextInput style={[styles.input, styles.half]} value={form.quantity} onChangeText={t => setForm(f => ({ ...f, quantity: t }))} placeholder="Qty" keyboardType="numeric" placeholderTextColor="#64748b" />
            <TextInput style={[styles.input, styles.half]} value={form.unit} onChangeText={t => setForm(f => ({ ...f, unit: t }))} placeholder="Unit" placeholderTextColor="#64748b" />
          </View>
          <TextInput style={styles.input} value={form.unit_cost} onChangeText={t => setForm(f => ({ ...f, unit_cost: t }))} placeholder="Unit cost (KES)" keyboardType="numeric" placeholderTextColor="#64748b" />
          <TextInput style={styles.input} value={form.supplier_name} onChangeText={t => setForm(f => ({ ...f, supplier_name: t }))} placeholder="Supplier name" placeholderTextColor="#64748b" />
          <TextInput style={styles.input} value={form.supplier_contact} onChangeText={t => setForm(f => ({ ...f, supplier_contact: t }))} placeholder="Supplier contact" placeholderTextColor="#64748b" />
          <TextInput style={styles.input} value={form.expected_delivery} onChangeText={t => setForm(f => ({ ...f, expected_delivery: t }))} placeholder="Expected delivery (YYYY-MM-DD)" placeholderTextColor="#64748b" />
          <TextInput style={[styles.input, { height: 60 }]} value={form.notes} onChangeText={t => setForm(f => ({ ...f, notes: t }))} placeholder="Notes" placeholderTextColor="#64748b" multiline />
          <TouchableOpacity style={styles.submitBtn} onPress={createRequest}>
            <Text style={styles.submitBtnText}>Submit Request</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.filterRow}>
        {(['all', 'requested', 'approved', 'ordered', 'delivered', 'cancelled'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <View style={[styles.catIcon, { backgroundColor: categoryConfig[item.category]?.color + '20' }]}>
                    <Ionicons name={categoryConfig[item.category]?.icon as any} size={16} color={categoryConfig[item.category]?.color} />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>{item.item_name}</Text>
                    <Text style={styles.cardFacility}>{item.facility_name} — {item.supplier_name}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig[item.status]?.color + '20' }]}>
                  <Text style={[styles.statusText, { color: statusConfig[item.status]?.color }]}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>{item.quantity} {item.unit} x KES {item.unit_cost.toLocaleString()} = <Text style={styles.totalText}>KES {item.total_cost.toLocaleString()}</Text></Text>
              </View>
              <View style={styles.dateRow}>
                <Text style={styles.dateText}>Ordered: {new Date(item.order_date).toLocaleDateString()}</Text>
                {item.expected_delivery && <Text style={styles.dateText}>Expected: {new Date(item.expected_delivery).toLocaleDateString()}</Text>}
                {item.actual_delivery && <Text style={[styles.dateText, { color: '#22c55e' }]}>Delivered: {new Date(item.actual_delivery).toLocaleDateString()}</Text>}
              </View>
              {item.notes && <Text style={styles.notesText}>{item.notes}</Text>}
              {statusConfig[item.status]?.next && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: statusConfig[item.status]?.color }]} onPress={() => updateStatus(item.id, statusConfig[item.status].next!)}>
                  <Text style={styles.actionBtnText}>{statusConfig[item.status]?.label}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cart-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No procurement records</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48, backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  totalsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  totalCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  totalValue: { fontSize: 13, fontWeight: '700' },
  totalLabel: { fontSize: 10, color: '#64748b', marginTop: 4 },
  formCard: { backgroundColor: '#1e293b', margin: 16, borderRadius: 12, padding: 16 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  input: { backgroundColor: '#0f172a', borderRadius: 8, padding: 10, color: '#e2e8f0', fontSize: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 8 },
  row2: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  catBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, backgroundColor: '#334155' },
  catBtnText: { fontSize: 10, color: '#94a3b8' },
  submitBtn: { backgroundColor: '#0ea5e9', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: '#1e293b' },
  filterBtnActive: { backgroundColor: '#0ea5e9' },
  filterText: { fontSize: 11, color: '#94a3b8' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cardFacility: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  detailRow: { marginTop: 4 },
  detailText: { fontSize: 13, color: '#e2e8f0' },
  totalText: { fontWeight: '700', color: '#0ea5e9' },
  dateRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  dateText: { fontSize: 12, color: '#64748b' },
  notesText: { fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' },
  actionBtn: { borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 10 },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
});
