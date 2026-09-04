import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

interface Payslip {
  id: string;
  month: string;
  year: number;
  gross_salary: number;
  deductions: number;
  net_salary: number;
  status: 'draft' | 'processed' | 'paid';
  paid_at?: string;
}

interface DeductionItem {
  label: string;
  amount: number;
}

export default function PayrollScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);

  const fetchPayroll = useCallback(async () => {
    try {
      // Check if user is a teacher
      const { data: teacherData } = await supabase
        .from('education_teachers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      setIsTeacher(!!teacherData);

      if (!teacherData?.id) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data, error } = await supabase
        .from('education_payslips')
        .select('id, month, year, gross_salary, deductions, net_salary, status, paid_at')
        .eq('teacher_id', teacherData.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      setPayslips(data || []);
    } catch (e) {
      console.error('[Payroll]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchPayroll(); }, [fetchPayroll]);
  const onRefresh = () => { setRefreshing(true); fetchPayroll(); };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#059669';
      case 'processed': return '#2563EB';
      case 'draft': return '#9CA3AF';
      default: return '#9CA3AF';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'paid': return '#ECFDF5';
      case 'processed': return '#DBEAFE';
      case 'draft': return '#F3F4F6';
      default: return '#F3F4F6';
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isTeacher) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Ionicons name="lock-closed" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Payroll access restricted</Text>
        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Only teachers can view payroll</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Payroll</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{payslips.length} payslips</Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ padding: 16 }}>
        {payslips.map((p: any) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setSelectedPayslip(p)}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {p.month} {p.year}
                </Text>
                <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                  {p.status === 'paid' && p.paid_at ? `Paid on ${new Date(p.paid_at).toLocaleDateString()}` : 'Pending payment'}
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: getStatusBg(p.status) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(p.status) }]}>{p.status}</Text>
              </View>
            </View>
            <View style={styles.amountRow}>
              <View style={styles.amountItem}>
                <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Gross</Text>
                <Text style={[styles.amountValue, { color: colors.text }]}>${p.gross_salary.toLocaleString()}</Text>
              </View>
              <View style={styles.amountItem}>
                <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Deductions</Text>
                <Text style={[styles.amountValue, { color: '#DC2626' }]}>-${p.deductions.toLocaleString()}</Text>
              </View>
              <View style={styles.amountItem}>
                <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Net</Text>
                <Text style={[styles.amountValue, { color: '#059669' }]}>${p.net_salary.toLocaleString()}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {payslips.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="cash-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No payslips found</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Contact your school administration</Text>
          </View>
        )}
      </ScrollView>

      {/* Payslip Detail */}
      {selectedPayslip && (
        <View style={[styles.detailOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
            <View style={styles.detailHeader}>
              <Text style={[styles.detailTitle, { color: colors.text }]}>
                {selectedPayslip.month} {selectedPayslip.year}
              </Text>
              <TouchableOpacity onPress={() => setSelectedPayslip(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Gross Salary</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>${selectedPayslip.gross_salary.toLocaleString()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Deductions</Text>
              <Text style={[styles.detailValue, { color: '#DC2626' }]}>-${selectedPayslip.deductions.toLocaleString()}</Text>
            </View>
            <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 8 }]}>
              <Text style={[styles.detailLabel, { color: colors.text, fontWeight: '700' }]}>Net Salary</Text>
              <Text style={[styles.detailValue, { color: '#059669', fontWeight: '800' }]}>${selectedPayslip.net_salary.toLocaleString()}</Text>
            </View>

            <View style={[styles.statusRow, { marginTop: 16 }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedPayslip.status) }]} />
              <Text style={[styles.statusLabel, { color: colors.text }]}>
                Status: {selectedPayslip.status.charAt(0).toUpperCase() + selectedPayslip.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardMeta: { fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between' },
  amountItem: { alignItems: 'center' },
  amountLabel: { fontSize: 11, marginBottom: 2 },
  amountValue: { fontSize: 15, fontWeight: '700' },
  emptyText: { marginTop: 12, fontSize: 14 },
  emptySub: { marginTop: 4, fontSize: 13, textAlign: 'center' },
  detailOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', padding: 20 },
  detailCard: { width: '100%', maxWidth: 360, borderRadius: 20, padding: 20 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailTitle: { fontSize: 18, fontWeight: '700' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 15, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 14, fontWeight: '600' },
});
