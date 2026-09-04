
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

interface FinanceStats {
  totalFeesCollected: number;
  totalFeesPending: number;
  totalExpenses: number;
  totalSalaries: number;
  studentCount: number;
}

export default function AccountantDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<FinanceStats | null>(null);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      if (!user?.id) return;

      const { data: staff } = await supabase
        .from('education_staff')
        .select('institution_id')
        .eq('user_id', user.id)
        .maybeSingle();

      const instId = staff?.institution_id;
      if (!instId) { setLoading(false); return; }

      const { data: fees } = await supabase
        .from('education_fees')
        .select('amount, status')
        .eq('institution_id', instId);

      const collected = fees?.filter((f: any) => f.status === 'paid').reduce((s, f) => s + (f.amount || 0), 0) || 0;
      const pending = fees?.filter((f: any) => f.status === 'pending').reduce((s, f) => s + (f.amount || 0), 0) || 0;

      const { count: students } = await supabase
        .from('education_students')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', instId);

      setStats({
        totalFeesCollected: collected,
        totalFeesPending: pending,
        totalExpenses: 0,
        totalSalaries: 0,
        studentCount: students || 0,
      });
    } catch (err) {
      console.error('[AccountantDashboard] load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => { setRefreshing(true); loadDashboard(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading accountant dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, Accountant</Text>
        <Text style={styles.subGreeting}>Financial Overview</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon="cash" label="Fees Collected" value={`KES ${(stats?.totalFeesCollected || 0).toLocaleString()}`} color="#10B981" />
        <StatCard icon="time" label="Fees Pending" value={`KES ${(stats?.totalFeesPending || 0).toLocaleString()}`} color="#F59E0B" />
        <StatCard icon="people" label="Students" value={stats?.studentCount || 0} color="#3B82F6" />
        <StatCard icon="trending-up" label="Revenue" value={`KES ${(stats?.totalFeesCollected || 0).toLocaleString()}`} color="#8B5CF6" />
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <ActionButton icon="cash" label="Fee Collection" onPress={() => router.push('/(education as any)/fees' as any)} />
        <ActionButton icon="card" label="Payroll" onPress={() => router.push('/(education as any)/payroll' as any)} />
        <ActionButton icon="receipt" label="Expenses" onPress={() => router.push('/(education as any)/expenses' as any)} />
        <ActionButton icon="document-text" label="Reports" onPress={() => router.push('/(education as any)/reports' as any)} />
        <ActionButton icon="wallet" label="Budget" onPress={() => router.push('/(education as any)/budget' as any)} />
        <ActionButton icon="download" label="Export" onPress={() => router.push('/(education as any)/export' as any)} />
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number | string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Ionicons name={icon as any} size={24} color="#8B5CF6" />
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F0F' },
  loadingText: { color: '#9CA3AF', marginTop: 12, fontSize: 14 },
  header: { padding: 20, paddingTop: 40 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  subGreeting: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10 },
  statCard: {
    width: '47%', backgroundColor: '#1A1A1A', borderRadius: 12,
    padding: 16, alignItems: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10 },
  actionButton: {
    width: '30%', backgroundColor: '#1A1A1A', borderRadius: 12,
    padding: 14, alignItems: 'center', marginBottom: 8,
  },
  actionLabel: { fontSize: 11, color: '#D1D5DB', marginTop: 6, textAlign: 'center' },
});

