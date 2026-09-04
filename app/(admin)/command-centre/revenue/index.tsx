import React, { useState, useEffect, useCallback } from 'react';

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface Taxpayer {
  id: string;
  taxpayer_name: string;
  taxpayer_type: string;
  tax_id: string;
  country: string;
  status: string;
}

interface RevenuePayment {
  id: string;
  payment_type: string;
  amount: number;
  taxpayer_id: string;
  status: string;
  created_at: string;
}

export default function RevenueAdminView() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([]);
  const [payments, setPayments] = useState<RevenuePayment[]>([]);
  const [stats, setStats] = useState({
    totalTaxpayers: 0,
    totalRevenue: 0,
    compliantCount: 0,
    nonCompliantCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: tps } = await supabase
        .from('revenue_taxpayers')
        .select('*')
        .order('taxpayer_name', { ascending: true })
        .limit(20);
      if (tps) setTaxpayers(tps);

      const { data: pays } = await supabase
        .from('revenue_payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (pays) setPayments(pays);

      const { count: tpCount } = await supabase
        .from('revenue_taxpayers')
        .select('*', { count: 'exact', head: true });

      const totalRev = pays ? pays.reduce((sum, p) => sum + (p.amount || 0), 0) : 0;

      setStats({
        totalTaxpayers: tpCount || 0,
        totalRevenue: totalRev,
        compliantCount: 0,
        nonCompliantCount: 0,
      });
    } catch (err) {
      console.error('Revenue admin error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.loadingText}>Loading Revenue...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Revenue Administration</Text>
        <Text style={styles.headerSub}>Tax Collection and Compliance</Text>
      </View>

      <View style={styles.statsRow}>
        <StatBox
          title="Taxpayers"
          value={stats.totalTaxpayers.toLocaleString()}
          icon="people-outline"
          color="#00d4ff"
        />
        <StatBox
          title="Revenue"
          value={`KES ${stats.totalRevenue.toLocaleString()}`}
          icon="cash-outline"
          color="#00cc66"
        />
        <StatBox
          title="Compliant"
          value={stats.compliantCount.toString()}
          icon="checkmark-circle-outline"
          color="#00cc66"
        />
        <StatBox
          title="Non-Compliant"
          value={stats.nonCompliantCount.toString()}
          icon="alert-circle-outline"
          color="#ff4444"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Payments</Text>
        {payments.length === 0 ? (
          <Text style={styles.emptyText}>No payments recorded</Text>
        ) : (
          payments.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentLeft}>
                <View style={[styles.paymentIcon, { backgroundColor: '#00cc6622' }]}>
                  <Ionicons name="cash-outline" size={16} color="#00cc66" />
                </View>
                <View>
                  <Text style={styles.paymentType}>{payment.payment_type}</Text>
                  <Text style={styles.paymentStatus}>{payment.status}</Text>
                </View>
              </View>
              <Text style={styles.paymentAmount}>
                +KES {(payment.amount || 0).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Taxpayers</Text>
        {taxpayers.length === 0 ? (
          <Text style={styles.emptyText}>No taxpayers registered</Text>
        ) : (
          taxpayers.map((tp) => (
            <View key={tp.id} style={styles.taxpayerCard}>
              <View style={styles.taxpayerAvatar}>
                <Text style={styles.taxpayerInitial}>{tp.taxpayer_name.charAt(0)}</Text>
              </View>
              <View style={styles.taxpayerInfo}>
                <Text style={styles.taxpayerName}>{tp.taxpayer_name}</Text>
                <Text style={styles.taxpayerMeta}>
                  {tp.taxpayer_type} · {tp.tax_id}
                </Text>
                <Text style={styles.taxpayerCountry}>{tp.country}</Text>
              </View>
              <View
                style={[
                  styles.taxpayerStatus,
                  tp.status === 'active' ? styles.statusActive : styles.statusInactive,
                ]}
              >
                <Text style={styles.statusText}>{tp.status}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function StatBox({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingText: { color: '#fff', fontSize: 16, marginTop: 16 },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: { marginBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  headerSub: { color: '#888', fontSize: 14, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  statTitle: { color: '#888', fontSize: 11, marginTop: 4 },
  section: { padding: 16, marginBottom: 8 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  emptyText: { color: '#666', fontSize: 14, fontStyle: 'italic' },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  paymentLeft: { flexDirection: 'row', alignItems: 'center' },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  paymentType: { color: '#fff', fontSize: 14, fontWeight: '500' },
  paymentStatus: { color: '#888', fontSize: 11, marginTop: 2 },
  paymentAmount: { color: '#00cc66', fontSize: 14, fontWeight: '600' },
  taxpayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  taxpayerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8855ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taxpayerInitial: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  taxpayerInfo: { flex: 1, marginLeft: 12 },
  taxpayerName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  taxpayerMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  taxpayerCountry: { color: '#666', fontSize: 11, marginTop: 2 },
  taxpayerStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusActive: { backgroundColor: '#00cc6622' },
  statusInactive: { backgroundColor: '#ff444422' },
  statusText: { fontSize: 10, fontWeight: '600' },
});
