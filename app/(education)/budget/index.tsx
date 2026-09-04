// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert, PieChart, BarChart3, Plus, ChevronRight, Target, AlertCircle } from 'lucide-react-native';

export default function BudgetScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [totals, setTotals] = useState({ total: 0, spent: 0, remaining: 0 });

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: staffData } = await supabase
        .from("education_staff").select("institution_id").eq("user_id", user.id).maybeSingle();
      const instId = staffData?.institution_id;
      setInstitutionId(instId);
      if (!instId) { setLoading(false); return; }

      const { data: budgetData } = await supabase
        .from("education_budgets").select("*").eq("institution_id", instId).order("fiscal_year", { ascending: false }).limit(10);
      const { data: allocData } = await supabase
        .from("education_budget_allocations").select("*, education_budgets(fiscal_year)").eq("institution_id", instId).order("created_at", { ascending: false }).limit(50);

      setBudgets(budgetData || []);
      setAllocations(allocData || []);
      const total = (budgetData || []).reduce((s: number, x: any) => s + (Number(x.total_amount) || 0), 0);
      const spent = (allocData || []).reduce((s: number, x: any) => s + (Number(x.spent_amount) || 0), 0);
      setTotals({ total, spent, remaining: total - spent });
    } catch (e: any) {
      console.error('[Budget]', e);
      Alert.alert('Error', e.message || 'Failed to load budget');
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Budget</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(education as any)/budget/create' as any)}>
          <Plus size={18} color="#fff" /><Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#6366f120' }]}>
          <Target size={20} color="#6366f1" />
          <Text style={styles.statValue}>{totals.total.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Budget</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#ef444420' }]}>
          <BarChart3 size={20} color="#ef4444" />
          <Text style={styles.statValue}>{totals.spent.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Spent</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#22c55e20' }]}>
          <PieChart size={20} color="#22c55e" />
          <Text style={styles.statValue}>{totals.remaining.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Remaining</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Budget Periods</Text>
      {(budgets || []).map((b: any) => (
        <TouchableOpacity key={b.id} style={styles.card} onPress={() => router.push(`/(education as any)/budget/${b.id}` as any)}>
          <View style={styles.cardRow}>
            <Target size={18} color="#6366f1" />
            <Text style={styles.cardTitle}>FY {b.fiscal_year}</Text>
            <Text style={[styles.badge, totals.remaining < 0 ? styles.badgeOver : styles.badgeOk]}>{totals.remaining < 0 ? 'Over' : 'On Track'}</Text>
          </View>
          <Text style={styles.cardSub}>{b.description || 'No description'}</Text>
          <Text style={styles.cardAmount}>Total: {Number(b.total_amount || 0).toLocaleString()}</Text>
          <ChevronRight size={16} color="#9ca3af" style={styles.chevron} />
        </TouchableOpacity>
      ))}
      <Text style={styles.sectionTitle}>Allocations</Text>
      {(allocations || []).map((a: any) => (
        <View key={a.id} style={styles.card}>
          <View style={styles.cardRow}>
            <AlertCircle size={18} color="#f59e0b" />
            <Text style={styles.cardTitle}>{a.department || a.category || 'Allocation'}</Text>
            <Text style={styles.cardAmount}>{Number(a.allocated_amount || 0).toLocaleString()}</Text>
          </View>
          <Text style={styles.cardSub}>Spent: {Number(a.spent_amount || 0).toLocaleString()} · Remaining: {Number((a.allocated_amount || 0) - (a.spent_amount || 0)).toLocaleString()}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(100, ((a.spent_amount || 0) / (a.allocated_amount || 1)) * 100)}%`, backgroundColor: ((a.spent_amount || 0) / (a.allocated_amount || 1)) > 0.9 ? '#ef4444' : '#22c55e' }]} />
          </View>
        </View>
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  cardSub: { fontSize: 12, color: '#64748b', marginTop: 4 },
  cardAmount: { fontSize: 14, fontWeight: '600', color: '#6366f1', marginTop: 4 },
  badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
  badgeOk: { backgroundColor: '#22c55e20', color: '#22c55e' },
  badgeOver: { backgroundColor: '#ef444420', color: '#ef4444' },
  progressBar: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  chevron: { position: 'absolute', right: 14, top: '50%', marginTop: -8 },
});
