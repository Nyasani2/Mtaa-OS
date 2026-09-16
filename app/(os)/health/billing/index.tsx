// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

export default function BillingAccountsOS() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, invoices, patients, payments
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [kpiData, setKpiData] = useState({ totalRevenue: 0, arBalance: 0, todayCollections: 0, pendingClaims: 0 });
  const [agingData, setAgingData] = useState({ current: 0, days30: 0, days60: 0, days90: 0, days120: 0 });
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);

  useEffect(() => { loadFinancialData(); }, []);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const { data: invData, error } = await supabase
        .from('health_invoices')
        .select(`id, invoice_number, total_amount, paid_amount, balance_due, status, created_at, due_date, patient:health_patients(id, first_name, last_name, phone)`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      let totalRev = 0, arBal = 0, todayColl = 0, pendingClaims = 0;
      let aging = { current: 0, days30: 0, days60: 0, days90: 0, days120: 0 };
      const today = new Date();

      (invData || []).forEach((inv: any) => {
        totalRev += inv.total_amount || 0;
        arBal += inv.balance_due || 0;
        if (inv.status === 'paid' && new Date(inv.created_at).toDateString() === today.toDateString()) {
          todayColl += inv.paid_amount || 0;
        }
        if (inv.status === 'pending_claim' || inv.status === 'submitted') pendingClaims++;

        if (inv.balance_due > 0 && inv.due_date) {
          const daysOverdue = Math.floor((today.getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24));
          if (daysOverdue <= 0) aging.current += inv.balance_due;
          else if (daysOverdue <= 30) aging.days30 += inv.balance_due;
          else if (daysOverdue <= 60) aging.days60 += inv.balance_due;
          else if (daysOverdue <= 90) aging.days90 += inv.balance_due;
          else aging.days120 += inv.balance_due;
        }
      });

      setKpiData({ totalRevenue: totalRev, arBalance: arBal, todayCollections: todayColl, pendingClaims });
      setAgingData(aging);
      setInvoices(invData || []);

      const { data: patData } = await supabase
        .from('health_patients')
        .select('id, first_name, last_name, phone, total_balance')
        .order('last_name', { ascending: true })
        .limit(50);
      setPatients(patData || []);

    } catch (err) {
      console.error('Billing load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => `KES ${(amount || 0).toLocaleString()}`;

  const renderDashboard = () => (
    <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFinancialData(); }} />}>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total Revenue</Text>
          <Text style={styles.kpiValue}>{formatCurrency(kpiData.totalRevenue)}</Text>
          <Ionicons name="trending-up" size={24} color="#10b981" style={styles.kpiIcon} />
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>A/R Balance</Text>
          <Text style={[styles.kpiValue, { color: '#f59e0b' }]}>{formatCurrency(kpiData.arBalance)}</Text>
          <Ionicons name="wallet" size={24} color="#f59e0b" style={styles.kpiIcon} />
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Today's Collections</Text>
          <Text style={[styles.kpiValue, { color: '#3b82f6' }]}>{formatCurrency(kpiData.todayCollections)}</Text>
          <Ionicons name="cash" size={24} color="#3b82f6" style={styles.kpiIcon} />
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Pending Claims</Text>
          <Text style={[styles.kpiValue, { color: '#8b5cf6' }]}>{kpiData.pendingClaims}</Text>
          <Ionicons name="document-text" size={24} color="#8b5cf6" style={styles.kpiIcon} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accounts Receivable Aging</Text>
        <View style={styles.agingContainer}>
          {[
            { label: 'Current', value: agingData.current, color: '#10b981' },
            { label: '1-30 Days', value: agingData.days30, color: '#3b82f6' },
            { label: '31-60 Days', value: agingData.days60, color: '#f59e0b' },
            { label: '61-90 Days', value: agingData.days90, color: '#ef4444' },
            { label: '90+ Days', value: agingData.days120, color: '#7f1d1d' },
          ].map((bucket, idx) => (
            <View key={idx} style={styles.agingRow}>
              <View style={styles.agingLabelBox}>
                <View style={[styles.agingDot, { backgroundColor: bucket.color }]} />
                <Text style={styles.agingLabelText}>{bucket.label}</Text>
              </View>
              <Text style={styles.agingValue}>{formatCurrency(bucket.value)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Invoices</Text>
          <TouchableOpacity onPress={() => setActiveTab('invoices')}>
            <Text style={styles.linkText}>View All</Text>
          </TouchableOpacity>
        </View>
        {invoices.slice(0, 5).map((inv: any, idx: number) => (
          <TouchableOpacity key={idx} style={styles.invoiceRow} onPress={() => {}}>
            <View style={styles.invoiceInfo}>
              <Text style={styles.invoicePatient}>{inv.patient?.first_name} {inv.patient?.last_name}</Text>
              <Text style={styles.invoiceNumber}>#{inv.invoice_number || inv.id.slice(0,8)}</Text>
            </View>
            <View style={styles.invoiceAmounts}>
              <Text style={styles.invoiceBalance}>{formatCurrency(inv.balance_due)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: (inv.status === 'paid' ? '#10b981' : inv.status === 'partial' ? '#3b82f6' : '#f59e0b') + '20' }]}>
                <Text style={[styles.statusText, { color: inv.status === 'paid' ? '#10b981' : inv.status === 'partial' ? '#3b82f6' : '#f59e0b' }]}>{inv.status.toUpperCase()}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Billing & Accounts</Text>
        <View style={styles.userBadge}>
          <Ionicons name="briefcase" size={20} color="#3b82f6" />
          <Text style={styles.userName}>Finance</Text>
        </View>
      </View>

      <View style={styles.navTabs}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'stats-chart' },
          { id: 'invoices', label: 'Invoices', icon: 'receipt' },
          { id: 'patients', label: 'Patients', icon: 'people' },
          { id: 'payments', label: 'Payments', icon: 'card' },
        ].map(tab => (
          <TouchableOpacity key={tab.id} style={[styles.navTab, activeTab === tab.id && styles.activeNavTab]} onPress={() => setActiveTab(tab.id)}>
            <Ionicons name={tab.icon} size={18} color={activeTab === tab.id ? '#fff' : '#94a3b8'} />
            <Text style={[styles.navText, activeTab === tab.id && styles.activeNavText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'payments' && (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Payment processing module</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  userBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#3b82f6' },
  userName: { color: '#3b82f6', fontSize: 12, fontWeight: '600' },
  navTabs: { flexDirection: 'row', backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  navTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, gap: 6 },
  activeNavTab: { borderBottomWidth: 2, borderBottomColor: '#3b82f6', backgroundColor: '#1e293b' },
  navText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  activeNavText: { color: '#fff' },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 16 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  kpiCard: { width: '48%', backgroundColor: '#1e293b', borderRadius: 12, padding: 16, position: 'relative' },
  kpiLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 8 },
  kpiValue: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  kpiIcon: { position: 'absolute', top: 16, right: 16, opacity: 0.2 },
  section: { backgroundColor: '#0f172a', marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  linkText: { color: '#3b82f6', fontSize: 13, fontWeight: '600' },
  agingContainer: { marginTop: 8 },
  agingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155' },
  agingLabelBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  agingDot: { width: 10, height: 10, borderRadius: 5 },
  agingLabelText: { color: '#cbd5e1', fontSize: 14 },
  agingValue: { color: '#fff', fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace' },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  invoiceInfo: { flex: 1 },
  invoicePatient: { color: '#fff', fontSize: 15, fontWeight: '600' },
  invoiceNumber: { color: '#64748b', fontSize: 12, fontFamily: 'monospace' },
  invoiceAmounts: { alignItems: 'flex-end' },
  invoiceBalance: { color: '#fff', fontSize: 15, fontWeight: 'bold', fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
});
