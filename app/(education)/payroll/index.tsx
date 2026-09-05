// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { DollarSign, Users, Calendar, ChevronRight, Plus, Wallet } from 'lucide-react-native';

export default function PayrollScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [totals, setTotals] = useState({ total: 0, paid: 0, pending: 0 });

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: staffData } = await supabase
        .from("education_staff").select("institution_id").eq("user_id", user.id).maybeSingle();
      const instId = staffData?.institution_id;
      setInstitutionId(instId);
      if (!instId) { setLoading(false); return; }

      const { data: payrollData } = await supabase
        .from("education_payroll")
        .select("*, education_staff(name, role)")
        .eq("institution_id", instId)
        .order("pay_period_end", { ascending: false }).limit(50);

      const { data: staffList } = await supabase
        .from("education_staff")
        .select("id, name, role, salary")
        .eq("institution_id", instId).eq("status", "active");

      setPayrolls(payrollData || []);
      setStaff(staffList || []);

      const total = (payrollData || []).reduce((s: number, x: any) => s + (Number(x.net_salary) || 0), 0);
      const paid = (payrollData || []).filter((x: any) => x.status === 'paid').reduce((s: number, x: any) => s + (Number(x.net_salary) || 0), 0);
      setTotals({ total, paid, pending: total - paid });
    } catch (e: any) {
      console.error('[Payroll]', e);
      Alert.alert('Error', e.message || 'Failed to load payroll');
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const generatePayroll = async (staffId: string) => {
    if (!institutionId) return;
    try {
      const { supabase } = await import("@/lib/supabase");
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const { error } = await supabase.from("education_payroll").insert({
        staff_id: staffId, institution_id: institutionId,
        pay_period_start: periodStart, pay_period_end: periodEnd,
        status: 'pending', created_by: user?.id,
      });
      if (error) throw error;
      Alert.alert('Success', 'Payroll entry created'); load();
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to create payroll'); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payroll</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(education as any)/payroll/create' as any)}>
          <Plus size={18} color="#fff" /><Text style={styles.addBtnText}>Generate</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#6366f120' }]}>
          <Wallet size={20} color="#6366f1" />
          <Text style={styles.statValue}>{totals.total.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Payroll</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#22c55e20' }]}>
          <DollarSign size={20} color="#22c55e" />
          <Text style={styles.statValue}>{totals.paid.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Paid</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b20' }]}>
          <Calendar size={20} color="#f59e0b" />
          <Text style={styles.statValue}>{totals.pending.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Recent Payroll Entries</Text>
      {(payrolls || []).map((p: any) => (
        <TouchableOpacity key={p.id} style={styles.card} onPress={() => router.push(`/(education as any)/payroll/${p.id}` as any)}>
          <View style={styles.cardRow}>
            <Users size={18} color="#6366f1" />
            <Text style={styles.cardTitle}>{p.education_staff?.name || 'Unknown'}</Text>
            <Text style={[styles.badge, p.status === 'paid' ? styles.badgePaid : styles.badgePending]}>{p.status}</Text>
          </View>
          <Text style={styles.cardSub}>{p.education_staff?.role || 'Staff'} · {p.pay_period_start} to {p.pay_period_end}</Text>
          <Text style={styles.cardAmount}>Net: {Number(p.net_salary || 0).toLocaleString()}</Text>
          <ChevronRight size={16} color="#9ca3af" style={styles.chevron} />
        </TouchableOpacity>
      ))}
      <Text style={styles.sectionTitle}>Active Staff</Text>
      {(staff || []).map((s: any) => (
        <TouchableOpacity key={s.id} style={styles.card} onPress={() => generatePayroll(s.id)}>
          <View style={styles.cardRow}>
            <Users size={18} color="#6366f1" />
            <Text style={styles.cardTitle}>{s.name}</Text>
            <Text style={styles.cardRole}>{s.role}</Text>
          </View>
          <Text style={styles.cardSub}>Salary: {Number(s.salary || 0).toLocaleString()}</Text>
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  cardSub: { fontSize: 12, color: '#64748b', marginTop: 4 },
  cardAmount: { fontSize: 14, fontWeight: '600', color: '#6366f1', marginTop: 4 },
  cardRole: { fontSize: 12, color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
  badgePaid: { backgroundColor: '#22c55e20', color: '#22c55e' },
  badgePending: { backgroundColor: '#f59e0b20', color: '#f59e0b' },
  chevron: { position: 'absolute', right: 14, top: '50%', marginTop: -8 },
});
