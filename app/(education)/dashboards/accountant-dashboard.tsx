// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useEducation } from '@/domains/education/hooks/useEducation';
import { supabase } from '@/lib/supabase';
import {
  CreditCard, TrendingUp, FileText, DollarSign, ChevronRight, BarChart3
} from 'lucide-react-native';

interface Props { institutionId: string | null; }

export default function AccountantDashboard({ institutionId }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
    // @ts-ignore
  const { getFees, getFeePayments, getPayroll } = useEducation();
  const [fees, setFees] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [totals, setTotals] = useState({ collected: 0, pending: 0, payrollTotal: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!institutionId) { setLoading(false); return; }
    try {
      const [f, p, pr] = await Promise.all([
        getFees({ institution_id: institutionId }),
        getFeePayments({ institution_id: institutionId }),
    // @ts-ignore
        getPayroll({ institution_id: institutionId }),
      ]);
      setFees(f.slice(0, 5));
      setPayments(p.slice(0, 5));
      setPayroll(pr.slice(0, 5));

      const collected = (p || []).reduce((sum: number, x: any) => sum + (Number(x.amount) || 0), 0);
      const pending = (f || []).reduce((sum: number, x: any) => sum + (Number(x.amount) || 0), 0) - collected;
      const payrollTotal = (pr || []).reduce((sum: number, x: any) => sum + (Number(x.net_salary || x.amount) || 0), 0);
      setTotals({ collected, pending, payrollTotal });
    } catch (e) { console.error('[AccountantDashboard]', e); }
    finally { setLoading(false); }
  }, [institutionId]);

  useEffect(() => { load(); }, [load]);

  const Section = ({ icon: Icon, title, color, children, onPress }: any) => (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
          <Icon size={18} color={color} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <ChevronRight size={16} color="#475569" />
      </TouchableOpacity>
      {children}
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#38bdf8" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Accountant Portal</Text>
        <Text style={styles.headerSub}>Financial Management</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderColor: '#34d39940' }]}>
          <DollarSign size={18} color="#34d399" />
          <Text style={styles.summaryValue}>KES {totals.collected.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Collected</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: '#fbbf2440' }]}>
          <TrendingUp size={18} color="#fbbf24" />
          <Text style={styles.summaryValue}>KES {totals.pending.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: '#ef444440' }]}>
          <CreditCard size={18} color="#ef4444" />
          <Text style={styles.summaryValue}>KES {totals.payrollTotal.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Payroll</Text>
        </View>
      </View>

      <Section icon={CreditCard} title="Fee Records" color="#38bdf8" onPress={() => router.push('/(education as any)/fees' as any)}>
        {fees.length === 0 ? (
          <Text style={styles.empty}>No fee records</Text>
        ) : (
          fees.map((f) => (
            <View key={f.id} style={styles.row}>
              <Text style={styles.rowTitle}>{f.description || 'Fee'}</Text>
              <Text style={styles.rowMeta}>KES {f.amount || 0} · {f.status || 'Pending'}</Text>
            </View>
          ))
        )}
      </Section>

      <Section icon={FileText} title="Recent Payments" color="#34d399" onPress={() => router.push('/(education as any)/fees' as any)}>
        {payments.length === 0 ? (
          <Text style={styles.empty}>No payments recorded</Text>
        ) : (
          payments.map((p) => (
            <View key={p.id} style={styles.row}>
              <Text style={styles.rowTitle}>{p.description || 'Payment'}</Text>
              <Text style={[styles.rowMeta, { color: '#34d399' }]}>KES {p.amount || 0} · {p.status || 'Paid'}</Text>
            </View>
          ))
        )}
      </Section>

      <Section icon={BarChart3} title="Payroll" color="#a78bfa" onPress={() => router.push('/(education as any)/payroll' as any)}>
        {payroll.length === 0 ? (
          <Text style={styles.empty}>No payroll records</Text>
        ) : (
          payroll.map((pr) => (
            <View key={pr.id} style={styles.row}>
              <Text style={styles.rowTitle}>{pr.staff_name || 'Staff'}</Text>
              <Text style={styles.rowMeta}>KES {pr.net_salary || pr.amount || 0} · {pr.status || 'Pending'}</Text>
            </View>
          ))
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#f8fafc' },
  headerSub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 16, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center' },
  summaryValue: { fontSize: 16, fontWeight: '800', color: '#f8fafc', marginTop: 6 },
  summaryLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  section: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  iconWrap: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#e2e8f0' },
  row: { paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1e293b' },
  rowTitle: { fontSize: 14, color: '#f8fafc', fontWeight: '500' },
  rowMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  empty: { padding: 14, fontSize: 13, color: '#475569', fontStyle: 'italic' },
});

