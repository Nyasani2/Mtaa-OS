// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useHospitalAccounting } from '@/lib/health/hooks/useHospitalAccounting';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { TrendingUp, TrendingDown, DollarSign, Users, CreditCard, Wallet, ArrowLeft, BarChart3, AlertCircle } from 'lucide-react-native';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'quarter', label: 'This Quarter' },
  { key: 'year', label: 'This Year' },
];

export default function HospitalAccountingScreen() {
  const router = useRouter();
  const { selectedFacilityId } = useHealthRole();
  const [period, setPeriod] = useState('today');
  const { stats, revenueBreakdown, recentTransactions, loading, refresh } = useHospitalAccounting(selectedFacilityId, period);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#0A4DA6" />
      <Text style={styles.loadingText}>Loading financial data...</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1F2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Accounting</Text>
        <TouchableOpacity onPress={refresh} style={styles.refreshBtn}><BarChart3 size={20} color="#0A4DA6" /></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll} contentContainerStyle={styles.periodRow}>
        {PERIODS.map((p: any) => (
          <TouchableOpacity key={p.key} style={[styles.periodChip, period === p.key && styles.periodChipActive]} onPress={() => setPeriod(p.key)}>
            <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
          <DollarSign size={24} color="#10B981" />
          <Text style={styles.statValue}>${(stats?.totalRevenue || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <View style={styles.trendRow}><TrendingUp size={14} color="#10B981" /><Text style={[styles.trendText, { color: '#10B981' }]}>+{stats?.revenueGrowth || 0}%</Text></View>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
          <CreditCard size={24} color="#3B82F6" />
          <Text style={styles.statValue}>${(stats?.outstanding || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Outstanding</Text>
          <View style={styles.trendRow}><TrendingDown size={14} color="#EF4444" /><Text style={[styles.trendText, { color: '#EF4444' }]}>{stats?.outstandingCount || 0} invoices</Text></View>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Users size={24} color="#F59E0B" />
          <Text style={styles.statValue}>{stats?.uniquePatients || 0}</Text>
          <Text style={styles.statLabel}>Patients</Text>
          <Text style={styles.statSub}>{stats?.newPatients || 0} new</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F3E8FF' }]}>
          <Wallet size={24} color="#8B5CF6" />
          <Text style={styles.statValue}>${(stats?.mtaaCommission || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>MTAA Commission</Text>
          <Text style={styles.statSub}>{stats?.commissionRate || 2.5}% rate</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Revenue by Service</Text>
        {revenueBreakdown?.map((item: any, i: number) => (
          <View key={i} style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownBar, { width: `${Math.max(item.percentage, 5)}%`, backgroundColor: item.color }]} />
              <Text style={styles.breakdownLabel}>{item.name}</Text>
            </View>
            <Text style={styles.breakdownValue}>${item.amount.toLocaleString()} ({item.percentage}%)</Text>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        <View style={styles.methodGrid}>
          {[
            { label: 'Cash', value: stats?.cashRevenue || 0 },
            { label: 'Card', value: stats?.cardRevenue || 0 },
            { label: 'Wallet', value: stats?.walletRevenue || 0 },
            { label: 'M-Pesa', value: stats?.mpesaRevenue || 0 },
            { label: 'Insurance', value: stats?.insuranceRevenue || 0 },
          ].map((m: any) => (
            <View key={m.label} style={styles.methodItem}>
              <Text style={styles.methodValue}>${m.value.toLocaleString()}</Text>
              <Text style={styles.methodLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {recentTransactions?.length === 0 ? (
          <View style={styles.emptyState}><AlertCircle size={32} color="#D1D5DB" /><Text style={styles.emptyText}>No transactions yet</Text></View>
        ) : recentTransactions?.map((tx: any) => (
          <View key={tx.id} style={styles.txRow}>
            <View style={styles.txLeft}>
              <Text style={styles.txPatient}>{tx.patient_name || 'Unknown'}</Text>
              <Text style={styles.txMethod}>{tx.payment_method} · {tx.invoice_number}</Text>
            </View>
            <Text style={[styles.txAmount, { color: tx.status === 'refunded' ? '#EF4444' : '#10B981' }]}>
              {tx.status === 'refunded' ? '-' : ''}${tx.amount.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingTop: 50 },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', flex: 1 },
  refreshBtn: { padding: 8 },
  periodScroll: { maxHeight: 56 },
  periodRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  periodChipActive: { backgroundColor: '#0A4DA6', borderColor: '#0A4DA6' },
  periodText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  periodTextActive: { color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  statCard: { width: '48%', padding: 16, borderRadius: 12 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1F2937', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  statSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  trendText: { fontSize: 12, fontWeight: '600' },
  section: { backgroundColor: '#fff', margin: 12, padding: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  breakdownBar: { height: 8, borderRadius: 4, marginRight: 10 },
  breakdownLabel: { fontSize: 13, color: '#374151' },
  breakdownValue: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  methodItem: { width: '30%', alignItems: 'center', padding: 10, backgroundColor: '#F9FAFB', borderRadius: 8 },
  methodValue: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  methodLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  txLeft: { flex: 1 },
  txPatient: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  txMethod: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  emptyState: { alignItems: 'center', padding: 24 },
  emptyText: { color: '#9CA3AF', marginTop: 8 },
});
