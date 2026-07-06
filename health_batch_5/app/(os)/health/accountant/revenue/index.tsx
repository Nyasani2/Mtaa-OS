import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface RevenueRecord {
  id: string;
  facility_id: string;
  facility_name: string;
  revenue_date: string;
  source: 'consultation' | 'pharmacy' | 'lab' | 'radiology' | 'surgery' | 'admission' | 'insurance' | 'other';
  amount: number;
  currency: string;
  payment_method: 'cash' | 'card' | 'mobile_money' | 'insurance' | 'bank_transfer';
  status: 'confirmed' | 'pending' | 'refunded' | 'cancelled';
  patient_id: string | null;
  patient_name: string | null;
  notes: string | null;
  created_at: string;
}

export default function AccountantRevenueScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [totals, setTotals] = useState({ total: 0, confirmed: 0, pending: 0, refunded: 0, bySource: {} as Record<string, number> });

  useEffect(() => {
    loadRevenue();
  }, [period]);

  async function loadRevenue() {
    if (!user) return;
    setLoading(true);
    try {
      const now = new Date();
      let startDate: Date;
      switch (period) {
        case 'today': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
        case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case 'quarter': startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1); break;
        case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
      }

      const { data, error } = await supabase
        .from('health_revenue')
        .select('*, health_facilities(name)')
        .gte('revenue_date', startDate.toISOString().split('T')[0])
        .lte('revenue_date', now.toISOString().split('T')[0])
        .order('revenue_date', { ascending: false });

      if (error) throw error;

      const mapped: RevenueRecord[] = (data || []).map((r: any) => ({
        id: r.id,
        facility_id: r.facility_id,
        facility_name: r.health_facilities?.name || 'Unknown',
        revenue_date: r.revenue_date,
        source: r.source,
        amount: r.amount || 0,
        currency: r.currency || 'KES',
        payment_method: r.payment_method,
        status: r.status,
        patient_id: r.patient_id,
        patient_name: r.patient_name,
        notes: r.notes,
        created_at: r.created_at,
      }));

      setRecords(mapped);
      setTotals({
        total: mapped.reduce((s, r) => s + r.amount, 0),
        confirmed: mapped.filter(r => r.status === 'confirmed').reduce((s, r) => s + r.amount, 0),
        pending: mapped.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0),
        refunded: mapped.filter(r => r.status === 'refunded').reduce((s, r) => s + r.amount, 0),
        bySource: mapped.reduce((acc, r) => {
          acc[r.source] = (acc[r.source] || 0) + r.amount;
          return acc;
        }, {} as Record<string, number>),
      });
    } catch (err) {
      console.error('Revenue load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const sourceConfig: Record<string, { color: string; icon: string }> = {
    consultation: { color: '#3b82f6', icon: 'people' },
    pharmacy: { color: '#22c55e', icon: 'medical' },
    lab: { color: '#f59e0b', icon: 'flask' },
    radiology: { color: '#8b5cf6', icon: 'scan' },
    surgery: { color: '#ef4444', icon: 'cut' },
    admission: { color: '#ec4899', icon: 'bed' },
    insurance: { color: '#14b8a6', icon: 'shield-checkmark' },
    other: { color: '#9ca3af', icon: 'ellipsis-horizontal' },
  };

  const periods: Array<'today' | 'week' | 'month' | 'quarter' | 'year'> = ['today', 'week', 'month', 'quarter', 'year'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Revenue Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {periods.map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodChip, period === p && styles.periodChipActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#1e293b' }]}>
          <Text style={[styles.summaryValue, { color: '#22c55e' }]}>KES {totals.confirmed.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Confirmed</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#1e293b' }]}>
          <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>KES {totals.pending.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#1e293b' }]}>
          <Text style={[styles.summaryValue, { color: '#ef4444' }]}>KES {totals.refunded.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Refunded</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#0ea5e920' }]}>
          <Text style={[styles.summaryValue, { color: '#0ea5e9' }]}>KES {totals.total.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total Revenue</Text>
        </View>
      </View>

      <View style={styles.sourceSection}>
        <Text style={styles.sectionTitle}>Revenue by Source</Text>
        <View style={styles.sourceGrid}>
          {Object.entries(totals.bySource).sort((a, b) => b[1] - a[1]).map(([source, amount]) => (
            <View key={source} style={styles.sourceItem}>
              <View style={[styles.sourceIcon, { backgroundColor: sourceConfig[source]?.color + '20' }]}>
                <Ionicons name={sourceConfig[source]?.icon as any} size={16} color={sourceConfig[source]?.color} />
              </View>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceName}>{source.charAt(0).toUpperCase() + source.slice(1)}</Text>
                <Text style={styles.sourceAmount}>KES {amount.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>
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
                  <View style={[styles.sourceIcon, { backgroundColor: sourceConfig[item.source]?.color + '20' }]}>
                    <Ionicons name={sourceConfig[item.source]?.icon as any} size={16} color={sourceConfig[item.source]?.color} />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>{item.source.charAt(0).toUpperCase() + item.source.slice(1)}</Text>
                    <Text style={styles.cardFacility}>{item.facility_name}</Text>
                  </View>
                </View>
                <Text style={[styles.cardAmount, { color: item.status === 'refunded' ? '#ef4444' : '#22c55e' }]}>
                  {item.status === 'refunded' ? '-' : ''}KES {item.amount.toLocaleString()}
                </Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>{new Date(item.revenue_date).toLocaleDateString()}</Text>
                <Text style={styles.cardMethod}>{item.payment_method.replace('_', ' ')}</Text>
                <View style={[styles.statusBadge, { backgroundColor: (item.status === 'confirmed' ? '#22c55e' : item.status === 'pending' ? '#f59e0b' : '#ef4444') + '20' }]}>
                  <Text style={[styles.statusText, { color: item.status === 'confirmed' ? '#22c55e' : item.status === 'pending' ? '#f59e0b' : '#ef4444' }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              {item.patient_name && <Text style={styles.patientText}>Patient: {item.patient_name}</Text>}
              {item.notes && <Text style={styles.notesText}>{item.notes}</Text>}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cash-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No revenue records for this period</Text>
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
  periodScroll: { marginTop: 8 },
  periodChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1e293b', marginRight: 8 },
  periodChipActive: { backgroundColor: '#0ea5e9' },
  periodText: { fontSize: 12, color: '#94a3b8' },
  periodTextActive: { color: '#fff', fontWeight: '600' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginTop: 12 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  summaryLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  sourceSection: { padding: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#e2e8f0', marginBottom: 10 },
  sourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sourceItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1e293b', borderRadius: 10, padding: 10, width: '48%' },
  sourceIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sourceInfo: { flex: 1 },
  sourceName: { fontSize: 12, color: '#e2e8f0', fontWeight: '600' },
  sourceAmount: { fontSize: 12, color: '#22c55e', fontWeight: '700', marginTop: 2 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cardFacility: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  cardAmount: { fontSize: 15, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  cardDate: { fontSize: 12, color: '#64748b' },
  cardMethod: { fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  patientText: { fontSize: 12, color: '#64748b', marginTop: 6 },
  notesText: { fontSize: 12, color: '#64748b', marginTop: 4, fontStyle: 'italic' },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
});
