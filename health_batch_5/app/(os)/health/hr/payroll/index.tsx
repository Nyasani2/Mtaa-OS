import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface PayrollRecord {
  id: string;
  staff_id: string;
  user_id: string;
  user_email: string;
  user_full_name: string;
  role: string;
  facility_name: string;
  base_salary: number;
  overtime_hours: number;
  overtime_rate: number;
  bonus: number;
  deductions: number;
  tax: number;
  net_pay: number;
  pay_period_start: string;
  pay_period_end: string;
  status: 'draft' | 'approved' | 'paid' | 'rejected';
  paid_at: string | null;
  created_at: string;
}

export default function HRPayrollScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'approved' | 'paid' | 'rejected'>('all');
  const [totalNetPay, setTotalNetPay] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);

  useEffect(() => {
    loadPayroll();
  }, [filter]);

  async function loadPayroll() {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('health_payroll')
        .select('*, health_staff(role, facility_id, health_facilities(name)), user_profiles:staff_id(email, full_name)')
        .order('pay_period_end', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: PayrollRecord[] = (data || []).map((r: any) => ({
        id: r.id,
        staff_id: r.staff_id,
        user_id: r.staff_id,
        user_email: r.user_profiles?.email || 'Unknown',
        user_full_name: r.user_profiles?.full_name || 'Unknown',
        role: r.health_staff?.role || 'Unknown',
        facility_name: r.health_staff?.health_facilities?.name || 'Unknown',
        base_salary: r.base_salary || 0,
        overtime_hours: r.overtime_hours || 0,
        overtime_rate: r.overtime_rate || 0,
        bonus: r.bonus || 0,
        deductions: r.deductions || 0,
        tax: r.tax || 0,
        net_pay: r.net_pay || 0,
        pay_period_start: r.pay_period_start,
        pay_period_end: r.pay_period_end,
        status: r.status,
        paid_at: r.paid_at,
        created_at: r.created_at,
      }));

      setRecords(mapped);
      setTotalNetPay(mapped.reduce((sum, r) => sum + r.net_pay, 0));
      setTotalStaff(new Set(mapped.map(r => r.staff_id)).size);
    } catch (err) {
      console.error('Payroll load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function approvePayroll(id: string) {
    const { error } = await supabase.from('health_payroll').update({ status: 'approved' }).eq('id', id);
    if (!error) loadPayroll();
  }

  async function markPaid(id: string) {
    const { error } = await supabase
      .from('health_payroll')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) loadPayroll();
  }

  const statusColors: Record<string, string> = {
    draft: '#9ca3af',
    approved: '#3b82f6',
    paid: '#22c55e',
    rejected: '#ef4444',
  };

  const filters: Array<'all' | 'draft' | 'approved' | 'paid' | 'rejected'> = ['all', 'draft', 'approved', 'paid', 'rejected'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payroll Management</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalStaff}</Text>
          <Text style={styles.summaryLabel}>Staff on Payroll</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>KES {totalNetPay.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total Net Pay</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardName}>{item.user_full_name}</Text>
                  <Text style={styles.cardRole}>{item.role} — {item.facility_name}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20', borderColor: statusColors[item.status] }]}>
                  <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.periodText}>
                Period: {new Date(item.pay_period_start).toLocaleDateString()} — {new Date(item.pay_period_end).toLocaleDateString()}
              </Text>
              <View style={styles.payRow}>
                <View style={styles.payItem}>
                  <Text style={styles.payLabel}>Base Salary</Text>
                  <Text style={styles.payValue}>KES {item.base_salary.toLocaleString()}</Text>
                </View>
                <View style={styles.payItem}>
                  <Text style={styles.payLabel}>Overtime</Text>
                  <Text style={styles.payValue}>KES {((item.overtime_hours * item.overtime_rate) || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.payItem}>
                  <Text style={styles.payLabel}>Bonus</Text>
                  <Text style={styles.payValue}>KES {item.bonus.toLocaleString()}</Text>
                </View>
                <View style={styles.payItem}>
                  <Text style={styles.payLabel}>Deductions</Text>
                  <Text style={[styles.payValue, { color: '#ef4444' }]}>-KES {item.deductions.toLocaleString()}</Text>
                </View>
                <View style={styles.payItem}>
                  <Text style={styles.payLabel}>Tax</Text>
                  <Text style={[styles.payValue, { color: '#ef4444' }]}>-KES {item.tax.toLocaleString()}</Text>
                </View>
                <View style={styles.payItem}>
                  <Text style={styles.payLabel}>Net Pay</Text>
                  <Text style={[styles.payValue, { color: '#22c55e', fontWeight: '700' }]}>KES {item.net_pay.toLocaleString()}</Text>
                </View>
              </View>
              {item.status === 'draft' && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => approvePayroll(item.id)}>
                  <Text style={styles.actionBtnText}>Approve Payroll</Text>
                </TouchableOpacity>
              )}
              {item.status === 'approved' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e' }]} onPress={() => markPaid(item.id)}>
                  <Text style={styles.actionBtnText}>Mark as Paid</Text>
                </TouchableOpacity>
              )}
              {item.status === 'paid' && item.paid_at && (
                <Text style={styles.paidText}>Paid on {new Date(item.paid_at).toLocaleDateString()}</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cash-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No payroll records found</Text>
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
  summaryRow: { flexDirection: 'row', padding: 16, gap: 12 },
  summaryCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '700', color: '#0ea5e9' },
  summaryLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1e293b' },
  filterBtnActive: { backgroundColor: '#0ea5e9' },
  filterText: { fontSize: 12, color: '#94a3b8' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardRole: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '700' },
  periodText: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  payRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  payItem: { width: '30%' },
  payLabel: { fontSize: 11, color: '#64748b' },
  payValue: { fontSize: 13, color: '#e2e8f0', fontWeight: '600', marginTop: 2 },
  actionBtn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 12 },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  paidText: { fontSize: 12, color: '#22c55e', marginTop: 8, textAlign: 'center' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
});
