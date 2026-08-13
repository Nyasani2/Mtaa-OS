import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Wallet, TrendingUp, Clock, DollarSign } from 'lucide-react-native';

export default function EarningsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, available: 0, pending: 0, lifetime: 0 });

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    const load = async () => {
      try {
        const [{ data: wallet }, { data: creator }] = await Promise.all([
          supabase.from('wallet_accounts').select('balance, available_balance').eq('user_id', user.id).eq('is_default', true).maybeSingle(),
          supabase.from('user_profiles').select('creator_earnings, creator_balance, creator_pending').eq('user_id', user.id).single(),
        ]);
        const total = (wallet?.balance || 0) + (creator?.creator_earnings || 0);
        const available = wallet?.available_balance || 0;
        const pending = creator?.creator_pending || 0;
        const lifetime = creator?.creator_earnings || 0;
        setStats({ total, available, pending, lifetime });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user?.id]);

  const formatKES = (n: number) => `KSh ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#10b981" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color="#f8fafc" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.scroll}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Earnings</Text>
          <Text style={styles.totalAmount}>{formatKES(stats.total)}</Text>
        </View>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Wallet size={20} color="#10b981" />
            <Text style={styles.gridValue}>{formatKES(stats.available)}</Text>
            <Text style={styles.gridLabel}>Available</Text>
          </View>
          <View style={styles.gridItem}>
            <Clock size={20} color="#f59e0b" />
            <Text style={styles.gridValue}>{formatKES(stats.pending)}</Text>
            <Text style={styles.gridLabel}>Pending</Text>
          </View>
          <View style={styles.gridItem}>
            <TrendingUp size={20} color="#3b82f6" />
            <Text style={styles.gridValue}>{formatKES(stats.lifetime)}</Text>
            <Text style={styles.gridLabel}>Lifetime</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.withdrawBtn} onPress={() => router.push('/(os)/wallet/withdraw' as any)}>
          <DollarSign size={18} color="#fff" />
          <Text style={styles.withdrawText}>Withdraw to Wallet</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  scroll: { flex: 1, padding: 16 },
  totalCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  totalLabel: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
  totalAmount: { color: '#f8fafc', fontSize: 32, fontWeight: '800' },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  gridItem: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center' },
  gridValue: { color: '#f8fafc', fontSize: 14, fontWeight: '700', marginTop: 8 },
  gridLabel: { color: '#64748b', fontSize: 11, marginTop: 4 },
  withdrawBtn: { backgroundColor: '#10b981', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  withdrawText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
