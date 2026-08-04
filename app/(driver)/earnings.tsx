import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useDriver } from '@/lib/transport/hooks/useDriver';

export default function DriverEarningsScreen() {
  const { user } = useAuthStore();
  const { loadDriverProfile, loadEarnings, driverProfile, loading } = useDriver();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [earnings, setEarnings] = useState({ total: 0, transactions: [] as any[] });

  useEffect(() => {
    if (!user?.id || !driverProfile?.id) return;
    loadEarningsData();
  }, [user?.id, driverProfile?.id, period]);

  useEffect(() => {
    if (user?.id) loadDriverProfile(user.id);
  }, [user?.id]);

  async function loadEarningsData() {
    if (!driverProfile?.id) return;
    const e = await loadEarnings(driverProfile.id, period);
    setEarnings(e);
  }

  const periods = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>💰 Earnings</Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>{period === 'today' ? "Today's" : period === 'week' ? "This Week's" : "This Month's"} Earnings</Text>
        <Text style={styles.totalValue}>KES {earnings.total.toLocaleString()}</Text>
      </View>

      <View style={styles.tabRow}>
        {periods.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.tab, period === p.key && styles.tabActive]}
            onPress={() => setPeriod(p.key as any)}
          >
            <Text style={[styles.tabText, period === p.key && styles.tabTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#e94560" style={{ marginTop: 40 }} />
      ) : earnings.transactions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>No earnings yet</Text>
        </View>
      ) : (
        <FlatList
          data={earnings.transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.type}>TRIP EARNING</Text>
                <Text style={styles.amount}>+KES {Number(item.amount).toLocaleString()}</Text>
              </View>
              <Text style={styles.desc}>{item.description}</Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  header: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 16 },
  totalCard: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 20, marginBottom: 16, alignItems: 'center' },
  totalLabel: { color: '#8892b0', fontSize: 12, textTransform: 'uppercase' },
  totalValue: { color: '#e94560', fontSize: 32, fontWeight: '800', marginTop: 8 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 8, padding: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#0f3460', borderWidth: 1, borderColor: '#e94560' },
  tabText: { color: '#8892b0', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#555', fontSize: 16 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  type: { color: '#2ecc71', fontSize: 11, fontWeight: '700' },
  amount: { color: '#2ecc71', fontSize: 16, fontWeight: '800' },
  desc: { color: '#fff', fontSize: 13, marginBottom: 4 },
  date: { color: '#555', fontSize: 11 },
});
