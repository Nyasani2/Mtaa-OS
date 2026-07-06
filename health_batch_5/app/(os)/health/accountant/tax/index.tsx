import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface TaxRecord {
  id: string;
  facility_id: string;
  facility_name: string;
  tax_type: 'vat' | 'income_tax' | 'payroll_tax' | 'property_tax' | 'customs_duty' | 'excise' | 'other';
  tax_period: string;
  taxable_amount: number;
  tax_rate: number;
  tax_amount: number;
  paid_amount: number;
  balance_due: number;
  filing_date: string | null;
  due_date: string;
  payment_date: string | null;
  status: 'pending' | 'filed' | 'paid' | 'overdue' | 'waived';
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

export default function AccountantTaxScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<TaxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | TaxRecord['status']>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tax_type: 'vat' as TaxRecord['tax_type'],
    tax_period: '',
    taxable_amount: '',
    tax_rate: '',
    due_date: '',
    reference_number: '',
    notes: '',
  });

  const taxTypes: TaxRecord['tax_type'][] = ['vat', 'income_tax', 'payroll_tax', 'property_tax', 'customs_duty', 'excise', 'other'];

  useEffect(() => {
    loadTaxes();
  }, [filter]);

  async function loadTaxes() {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('health_tax_records')
        .select('*, health_facilities(name)')
        .order('due_date', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: TaxRecord[] = (data || []).map((r: any) => ({
        id: r.id,
        facility_id: r.facility_id,
        facility_name: r.health_facilities?.name || 'Unknown',
        tax_type: r.tax_type,
        tax_period: r.tax_period,
        taxable_amount: r.taxable_amount || 0,
        tax_rate: r.tax_rate || 0,
        tax_amount: r.tax_amount || 0,
        paid_amount: r.paid_amount || 0,
        balance_due: r.balance_due || 0,
        filing_date: r.filing_date,
        due_date: r.due_date,
        payment_date: r.payment_date,
        status: r.status,
        reference_number: r.reference_number,
        notes: r.notes,
        created_at: r.created_at,
      }));

      setRecords(mapped);
    } catch (err) {
      console.error('Tax load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function createTax() {
    if (!user || !form.tax_period || !form.taxable_amount || !form.tax_rate || !form.due_date) return;
    const taxable = parseFloat(form.taxable_amount);
    const rate = parseFloat(form.tax_rate);
    const taxAmount = taxable * (rate / 100);
    const { error } = await supabase.from('health_tax_records').insert({
      tax_type: form.tax_type,
      tax_period: form.tax_period,
      taxable_amount: taxable,
      tax_rate: rate,
      tax_amount: taxAmount,
      paid_amount: 0,
      balance_due: taxAmount,
      due_date: form.due_date,
      reference_number: form.reference_number || null,
      notes: form.notes || null,
      status: 'pending',
    });
    if (!error) {
      setShowForm(false);
      setForm({ tax_type: 'vat', tax_period: '', taxable_amount: '', tax_rate: '', due_date: '', reference_number: '', notes: '' });
      loadTaxes();
    }
  }

  async function markFiled(id: string) {
    const { error } = await supabase.from('health_tax_records').update({ status: 'filed', filing_date: new Date().toISOString().split('T')[0] }).eq('id', id);
    if (!error) loadTaxes();
  }

  async function markPaid(id: string, amount: number) {
    const record = records.find(r => r.id === id);
    if (!record) return;
    const newPaid = record.paid_amount + amount;
    const newBalance = record.tax_amount - newPaid;
    const { error } = await supabase.from('health_tax_records').update({
      paid_amount: newPaid,
      balance_due: newBalance,
      status: newBalance <= 0 ? 'paid' : 'filed',
      payment_date: newBalance <= 0 ? new Date().toISOString().split('T')[0] : record.payment_date,
    }).eq('id', id);
    if (!error) loadTaxes();
  }

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    filed: '#3b82f6',
    paid: '#22c55e',
    overdue: '#ef4444',
    waived: '#9ca3af',
  };

  const taxTypeConfig: Record<string, { color: string; icon: string }> = {
    vat: { color: '#3b82f6', icon: 'receipt' },
    income_tax: { color: '#22c55e', icon: 'cash' },
    payroll_tax: { color: '#f59e0b', icon: 'people' },
    property_tax: { color: '#8b5cf6', icon: 'home' },
    customs_duty: { color: '#ef4444', icon: 'airplane' },
    excise: { color: '#ec4899', icon: 'flask' },
    other: { color: '#9ca3af', icon: 'ellipsis-horizontal' },
  };

  const totalPending = records.filter(r => r.status === 'pending' || r.status === 'overdue').reduce((s, r) => s + r.balance_due, 0);
  const totalPaid = records.filter(r => r.status === 'paid').reduce((s, r) => s + r.paid_amount, 0);
  const totalOverdue = records.filter(r => r.status === 'overdue').reduce((s, r) => s + r.balance_due, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tax Management</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      <View style={styles.totalsRow}>
        <View style={[styles.totalCard, { backgroundColor: '#f59e0b20' }]}>
          <Text style={[styles.totalValue, { color: '#f59e0b' }]}>KES {totalPending.toLocaleString()}</Text>
          <Text style={styles.totalLabel}>Pending</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#22c55e20' }]}>
          <Text style={[styles.totalValue, { color: '#22c55e' }]}>KES {totalPaid.toLocaleString()}</Text>
          <Text style={styles.totalLabel}>Paid</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#ef444420' }]}>
          <Text style={[styles.totalValue, { color: '#ef4444' }]}>KES {totalOverdue.toLocaleString()}</Text>
          <Text style={styles.totalLabel}>Overdue</Text>
        </View>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Tax Entry</Text>
          <View style={styles.typeRow}>
            {taxTypes.map(t => (
              <TouchableOpacity key={t} style={[styles.typeBtn, form.tax_type === t && { backgroundColor: taxTypeConfig[t]?.color }]} onPress={() => setForm(f => ({ ...f, tax_type: t }))}>
                <Text style={[styles.typeBtnText, form.tax_type === t && { color: '#fff' }]}>{t.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} value={form.tax_period} onChangeText={t => setForm(f => ({ ...f, tax_period: t }))} placeholder="Tax period (e.g., 2026-Q2)" placeholderTextColor="#64748b" />
          <View style={styles.row2}>
            <TextInput style={[styles.input, styles.half]} value={form.taxable_amount} onChangeText={t => setForm(f => ({ ...f, taxable_amount: t }))} placeholder="Taxable amount" keyboardType="numeric" placeholderTextColor="#64748b" />
            <TextInput style={[styles.input, styles.half]} value={form.tax_rate} onChangeText={t => setForm(f => ({ ...f, tax_rate: t }))} placeholder="Rate %" keyboardType="numeric" placeholderTextColor="#64748b" />
          </View>
          <TextInput style={styles.input} value={form.due_date} onChangeText={t => setForm(f => ({ ...f, due_date: t }))} placeholder="Due date (YYYY-MM-DD)" placeholderTextColor="#64748b" />
          <TextInput style={styles.input} value={form.reference_number} onChangeText={t => setForm(f => ({ ...f, reference_number: t }))} placeholder="Reference number" placeholderTextColor="#64748b" />
          <TextInput style={[styles.input, { height: 60 }]} value={form.notes} onChangeText={t => setForm(f => ({ ...f, notes: t }))} placeholder="Notes" placeholderTextColor="#64748b" multiline />
          <TouchableOpacity style={styles.submitBtn} onPress={createTax}>
            <Text style={styles.submitBtnText}>Create Tax Entry</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.filterRow}>
        {(['all', 'pending', 'filed', 'paid', 'overdue'] as const).map(f => (
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
                  <View style={[styles.typeIcon, { backgroundColor: taxTypeConfig[item.tax_type]?.color + '20' }]}>
                    <Ionicons name={taxTypeConfig[item.tax_type]?.icon as any} size={16} color={taxTypeConfig[item.tax_type]?.color} />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>{item.tax_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Text>
                    <Text style={styles.cardFacility}>{item.facility_name} — {item.tax_period}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColors[item.status] }]}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.amountRow}>
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Taxable</Text>
                  <Text style={styles.amountValue}>KES {item.taxable_amount.toLocaleString()}</Text>
                </View>
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Rate</Text>
                  <Text style={styles.amountValue}>{item.tax_rate}%</Text>
                </View>
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Tax Due</Text>
                  <Text style={styles.amountValue}>KES {item.tax_amount.toLocaleString()}</Text>
                </View>
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Balance</Text>
                  <Text style={[styles.amountValue, { color: item.balance_due > 0 ? '#ef4444' : '#22c55e' }]}>KES {item.balance_due.toLocaleString()}</Text>
                </View>
              </View>
              <View style={styles.dateRow}>
                <Text style={styles.dateText}>Due: {new Date(item.due_date).toLocaleDateString()}</Text>
                {item.filing_date && <Text style={styles.dateText}>Filed: {new Date(item.filing_date).toLocaleDateString()}</Text>}
                {item.payment_date && <Text style={[styles.dateText, { color: '#22c55e' }]}>Paid: {new Date(item.payment_date).toLocaleDateString()}</Text>}
              </View>
              {item.reference_number && <Text style={styles.refText}>Ref: {item.reference_number}</Text>}
              {item.notes && <Text style={styles.notesText}>{item.notes}</Text>}
              <View style={styles.actionRow}>
                {item.status === 'pending' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={() => markFiled(item.id)}>
                    <Text style={styles.actionBtnText}>Mark Filed</Text>
                  </TouchableOpacity>
                )}
                {(item.status === 'pending' || item.status === 'filed' || item.status === 'overdue') && item.balance_due > 0 && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e' }]} onPress={() => markPaid(item.id, item.balance_due)}>
                    <Text style={styles.actionBtnText}>Mark Paid</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No tax records</Text>
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
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  typeBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, backgroundColor: '#334155' },
  typeBtnText: { fontSize: 10, color: '#94a3b8' },
  input: { backgroundColor: '#0f172a', borderRadius: 8, padding: 10, color: '#e2e8f0', fontSize: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 8 },
  row2: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
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
  typeIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cardFacility: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  amountRow: { flexDirection: 'row', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#334155' },
  amountItem: { flex: 1, alignItems: 'center' },
  amountLabel: { fontSize: 11, color: '#64748b' },
  amountValue: { fontSize: 12, color: '#e2e8f0', fontWeight: '600', marginTop: 2 },
  dateRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  dateText: { fontSize: 12, color: '#64748b' },
  refText: { fontSize: 12, color: '#0ea5e9', marginTop: 4 },
  notesText: { fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, borderRadius: 8, padding: 10, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
});
