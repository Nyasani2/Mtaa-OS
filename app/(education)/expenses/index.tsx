import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Receipt, TrendingUp, Filter, Plus, ChevronRight, Tag } from 'lucide-react-native';

export default function ExpensesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [totals, setTotals] = useState({ total: 0, approved: 0, pending: 0 });

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: staffData } = await supabase
        .from("education_staff").select("institution_id").eq("user_id", user.id).maybeSingle();
      const instId = staffData?.institution_id;
      setInstitutionId(instId);
      if (!instId) { setLoading(false); return; }

      let query = supabase.from("education_expenses").select("*").eq("institution_id", instId).order("expense_date", { ascending: false }).limit(50);
      if (filter) query = query.eq("category", filter);
      const { data: expenseData } = await query;
      const { data: catData } = await supabase.from("education_expense_categories").select("*").eq("institution_id", instId);

      setExpenses(expenseData || []);
      setCategories(catData || []);
      const total = (expenseData || []).reduce((s: number, x: any) => s + (Number(x.amount) || 0), 0);
      const approved = (expenseData || []).filter((x: any) => x.status === 'approved').reduce((s: number, x: any) => s + (Number(x.amount) || 0), 0);
      setTotals({ total, approved, pending: total - approved });
    } catch (e: any) {
      console.error('[Expenses]', e);
      Alert.alert('Error', e.message || 'Failed to load expenses');
    } finally { setLoading(false); }
  }, [user?.id, filter]);

  useEffect(() => { load(); }, [load]);

  const approveExpense = async (id: string) => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from("education_expenses").update({ status: 'approved', approved_by: user?.id, approved_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      Alert.alert('Approved', 'Expense approved successfully'); load();
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to approve'); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(education)/expenses/create')}>
          <Plus size={18} color="#fff" /><Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#ef444420' }]}>
          <Receipt size={20} color="#ef4444" />
          <Text style={styles.statValue}>{totals.total.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#22c55e20' }]}>
          <TrendingUp size={20} color="#22c55e" />
          <Text style={styles.statValue}>{totals.approved.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b20' }]}>
          <Filter size={20} color="#f59e0b" />
          <Text style={styles.statValue}>{totals.pending.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterChip, !filter && styles.filterActive]} onPress={() => setFilter(null)}>
          <Text style={[styles.filterText, !filter && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {(categories || []).map((c: any) => (
          <TouchableOpacity key={c.id} style={[styles.filterChip, filter === c.name && styles.filterActive]} onPress={() => setFilter(c.name)}>
            <Tag size={14} color={filter === c.name ? '#fff' : '#64748b'} />
            <Text style={[styles.filterText, filter === c.name && styles.filterTextActive]}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.sectionTitle}>Recent Expenses</Text>
      {(expenses || []).map((e: any) => (
        <TouchableOpacity key={e.id} style={styles.card} onPress={() => router.push(`/(education)/expenses/${e.id}`)}>
          <View style={styles.cardRow}>
            <Receipt size={18} color="#ef4444" />
            <Text style={styles.cardTitle}>{e.description || 'Expense'}</Text>
            <Text style={[styles.badge, e.status === 'approved' ? styles.badgePaid : e.status === 'rejected' ? styles.badgeRejected : styles.badgePending]}>{e.status}</Text>
          </View>
          <Text style={styles.cardSub}>{e.category} · {e.expense_date}</Text>
          <Text style={styles.cardAmount}>{Number(e.amount || 0).toLocaleString()}</Text>
          {e.status === 'pending' && (
            <TouchableOpacity style={styles.approveBtn} onPress={() => approveExpense(e.id)}>
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
          )}
          <ChevronRight size={16} color="#9ca3af" style={styles.chevron} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366f1', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  filterRow: { flexDirection: 'row', marginBottom: 16 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#e2e8f0', marginRight: 8, gap: 4 },
  filterActive: { backgroundColor: '#6366f1' },
  filterText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  cardSub: { fontSize: 12, color: '#64748b', marginTop: 4 },
  cardAmount: { fontSize: 14, fontWeight: '600', color: '#ef4444', marginTop: 4 },
  badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
  badgePaid: { backgroundColor: '#22c55e20', color: '#22c55e' },
  badgePending: { backgroundColor: '#f59e0b20', color: '#f59e0b' },
  badgeRejected: { backgroundColor: '#ef444420', color: '#ef4444' },
  approveBtn: { marginTop: 8, backgroundColor: '#22c55e', paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  approveBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  chevron: { position: 'absolute', right: 14, top: '50%', marginTop: -8 },
});
