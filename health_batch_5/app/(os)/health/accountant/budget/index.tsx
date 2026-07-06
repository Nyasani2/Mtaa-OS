import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface BudgetItem {
  id: string;
  facility_id: string;
  facility_name: string;
  category: 'salaries' | 'medical_supplies' | 'equipment' | 'utilities' | 'maintenance' | 'pharmaceuticals' | 'insurance' | 'marketing' | 'other';
  allocated_amount: number;
  spent_amount: number;
  fiscal_year: number;
  fiscal_quarter: number;
  notes: string | null;
  status: 'active' | 'exceeded' | 'closed' | 'draft';
  created_at: string;
}

export default function AccountantBudgetScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({ category: 'salaries' as BudgetItem['category'], allocated_amount: '', fiscal_quarter: 1, notes: '' });

  const categories: BudgetItem['category'][] = ['salaries', 'medical_supplies', 'equipment', 'utilities', 'maintenance', 'pharmaceuticals', 'insurance', 'marketing', 'other'];

  useEffect(() => {
    loadBudget();
  }, [fiscalYear]);

  async function loadBudget() {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_budget')
        .select('*, health_facilities(name)')
        .eq('fiscal_year', fiscalYear)
        .order('fiscal_quarter', { ascending: true })
        .order('category', { ascending: true });

      if (error) throw error;

      const mapped: BudgetItem[] = (data || []).map((r: any) => ({
        id: r.id,
        facility_id: r.facility_id,
        facility_name: r.health_facilities?.name || 'Unknown',
        category: r.category,
        allocated_amount: r.allocated_amount || 0,
        spent_amount: r.spent_amount || 0,
        fiscal_year: r.fiscal_year,
        fiscal_quarter: r.fiscal_quarter,
        notes: r.notes,
        status: r.status,
        created_at: r.created_at,
      }));

      setItems(mapped);
    } catch (err) {
      console.error('Budget load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function createBudget() {
    if (!user || !form.allocated_amount) return;
    const { error } = await supabase.from('health_budget').insert({
      category: form.category,
      allocated_amount: parseFloat(form.allocated_amount),
      fiscal_year: fiscalYear,
      fiscal_quarter: form.fiscal_quarter,
      notes: form.notes || null,
      status: 'active',
    });
    if (!error) {
      setShowForm(false);
      setForm({ category: 'salaries', allocated_amount: '', fiscal_quarter: 1, notes: '' });
      loadBudget();
    }
  }

  async function updateSpent(id: string, amount: number) {
    const { error } = await supabase.from('health_budget').update({ spent_amount: amount }).eq('id', id);
    if (!error) loadBudget();
  }

  const totalAllocated = items.reduce((s, i) => s + i.allocated_amount, 0);
  const totalSpent = items.reduce((s, i) => s + i.spent_amount, 0);
  const remaining = totalAllocated - totalSpent;

  const categoryConfig: Record<string, { color: string; icon: string }> = {
    salaries: { color: '#3b82f6', icon: 'people' },
    medical_supplies: { color: '#ef4444', icon: 'medical' },
    equipment: { color: '#f59e0b', icon: 'hardware-chip' },
    utilities: { color: '#22c55e', icon: 'flash' },
    maintenance: { color: '#8b5cf6', icon: 'construct' },
    pharmaceuticals: { color: '#ec4899', icon: 'flask' },
    insurance: { color: '#14b8a6', icon: 'shield-checkmark' },
    marketing: { color: '#f97316', icon: 'megaphone' },
    other: { color: '#9ca3af', icon: 'ellipsis-horizontal' },
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budget Management</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      <View style={styles.totalsRow}>
        <View style={[styles.totalCard, { backgroundColor: '#0ea5e920' }]}>
          <Text style={[styles.totalValue, { color: '#0ea5e9' }]}>KES {totalAllocated.toLocaleString()}</Text>
          <Text style={styles.totalLabel}>Allocated</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#ef444420' }]}>
          <Text style={[styles.totalValue, { color: '#ef4444' }]}>KES {totalSpent.toLocaleString()}</Text>
          <Text style={styles.totalLabel}>Spent</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#22c55e20' }]}>
          <Text style={[styles.totalValue, { color: '#22c55e' }]}>KES {remaining.toLocaleString()}</Text>
          <Text style={styles.totalLabel}>Remaining</Text>
        </View>
      </View>

      <View style={styles.yearRow}>
        <TouchableOpacity onPress={() => setFiscalYear(y => y - 1)}>
          <Ionicons name="chevron-back" size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.yearText}>FY {fiscalYear}</Text>
        <TouchableOpacity onPress={() => setFiscalYear(y => y + 1)}>
          <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Budget Allocation</Text>
          <View style={styles.categoryRow}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catBtn, form.category === cat && { backgroundColor: categoryConfig[cat]?.color }]}
                onPress={() => setForm(f => ({ ...f, category: cat }))}
              >
                <Text style={[styles.catBtnText, form.category === cat && { color: '#fff' }]}>
                  {cat.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Amount (KES)</Text>
              <TextInput
                style={styles.formInput}
                value={form.allocated_amount}
                onChangeText={t => setForm(f => ({ ...f, allocated_amount: t }))}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#64748b"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Quarter</Text>
              <View style={styles.quarterRow}>
                {[1, 2, 3, 4].map(q => (
                  <TouchableOpacity
                    key={q}
                    style={[styles.quarterBtn, form.fiscal_quarter === q && { backgroundColor: '#0ea5e9' }]}
                    onPress={() => setForm(f => ({ ...f, fiscal_quarter: q }))}
                  >
                    <Text style={[styles.quarterText, form.fiscal_quarter === q && { color: '#fff' }]}>Q{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <TextInput
            style={styles.notesInput}
            value={form.notes}
            onChangeText={t => setForm(f => ({ ...f, notes: t }))}
            placeholder="Notes..."
            placeholderTextColor="#64748b"
            multiline
          />
          <TouchableOpacity style={styles.submitBtn} onPress={createBudget}>
            <Text style={styles.submitBtnText}>Create Budget</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const pct = item.allocated_amount > 0 ? (item.spent_amount / item.allocated_amount) * 100 : 0;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.catIcon, { backgroundColor: categoryConfig[item.category]?.color + '20' }]}>
                      <Ionicons name={categoryConfig[item.category]?.icon as any} size={16} color={categoryConfig[item.category]?.color} />
                    </View>
                    <View>
                      <Text style={styles.cardTitle}>{item.category.replace('_', ' ').replace(/\w/g, l => l.toUpperCase())}</Text>
                      <Text style={styles.cardFacility}>{item.facility_name} — Q{item.fiscal_quarter}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: (item.status === 'active' ? '#22c55e' : item.status === 'exceeded' ? '#ef4444' : '#9ca3af') + '20' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'active' ? '#22c55e' : item.status === 'exceeded' ? '#ef4444' : '#9ca3af' }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 90 ? '#ef4444' : pct > 75 ? '#f59e0b' : '#22c55e' }]} />
                  </View>
                  <Text style={styles.progressText}>{pct.toFixed(1)}% used</Text>
                </View>
                <View style={styles.amountRow}>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Allocated</Text>
                    <Text style={styles.amountValue}>KES {item.allocated_amount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Spent</Text>
                    <Text style={[styles.amountValue, { color: '#ef4444' }]}>KES {item.spent_amount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Remaining</Text>
                    <Text style={[styles.amountValue, { color: '#22c55e' }]}>KES {(item.allocated_amount - item.spent_amount).toLocaleString()}</Text>
                  </View>
                </View>
                {item.notes && <Text style={styles.notesText}>{item.notes}</Text>}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="wallet-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No budget allocations for FY {fiscalYear}</Text>
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
  totalValue: { fontSize: 14, fontWeight: '700' },
  totalLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 8 },
  yearText: { fontSize: 16, fontWeight: '700', color: '#e2e8f0' },
  formCard: { backgroundColor: '#1e293b', margin: 16, borderRadius: 12, padding: 16 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  catBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, backgroundColor: '#334155' },
  catBtnText: { fontSize: 10, color: '#94a3b8' },
  formRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  formField: { flex: 1 },
  formLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  formInput: { backgroundColor: '#0f172a', borderRadius: 8, padding: 10, color: '#e2e8f0', fontSize: 14, borderWidth: 1, borderColor: '#334155' },
  quarterRow: { flexDirection: 'row', gap: 6 },
  quarterBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#334155' },
  quarterText: { fontSize: 12, color: '#94a3b8' },
  notesInput: { backgroundColor: '#0f172a', borderRadius: 8, padding: 10, color: '#e2e8f0', fontSize: 14, borderWidth: 1, borderColor: '#334155', height: 60, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#0ea5e9', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cardFacility: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  progressSection: { marginTop: 8 },
  progressBar: { height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'right' },
  amountRow: { flexDirection: 'row', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#334155' },
  amountItem: { flex: 1, alignItems: 'center' },
  amountLabel: { fontSize: 11, color: '#64748b' },
  amountValue: { fontSize: 13, color: '#e2e8f0', fontWeight: '600', marginTop: 2 },
  notesText: { fontSize: 12, color: '#64748b', marginTop: 8, fontStyle: 'italic' },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
});
