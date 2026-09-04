import { Alert, useState } from 'react';
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert, useLocation } from '@/lib/transport/hooks/useLocation';
import { Alert, useDriver } from '@/lib/transport/hooks/useDriver';

export default function DriverDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { position } = useLocation();
  const {
    loadDriverProfile, toggleOnline, loadEarnings, loadWalletBalance,
    driverProfile, loading,
  } = useDriver();

  const [earnings, setEarnings] = useState<{ total: number; transactions: any[] }>({ total: 0, transactions: [] });
  const [wallet, setWallet] = useState<{ balance: number; available_balance: number } | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    init();
  }, [user?.id]);

  async function init() {
    try {
      const profile = await loadDriverProfile(user!.id);
      if (profile) {
        setIsOnline(profile.is_online || false);
        const [e, w] = await Promise.all([
          loadEarnings(profile.id, 'today'),
          loadWalletBalance(user!.id),
        ]);
        setEarnings(e);
        setWallet(w);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  const handleToggle = async () => {
    if (!driverProfile?.id) return;
    const newStatus = !isOnline;
    try {
      await toggleOnline(
        driverProfile.id,
        newStatus,
        position?.latitude,
        position?.longitude
      );
      setIsOnline(newStatus);
    } catch (err: any) {
      Alert.alert('Failed', err.message);
    }
  };

  if (loading && !driverProfile) {
    return <View style={styles.center}><ActivityIndicator color="#e94560" /></View>;
  }

  if (!driverProfile) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>You are not registered as a driver.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => Alert.alert('Driver Onboarding', 'Go to MTaxi driver registration.')}>
          <Text style={styles.btnText}>Register as Driver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>🚗 Driver Dashboard</Text>

      {/* Online Toggle */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Switch
            value={isOnline}
            onValueChange={handleToggle}
            trackColor={{ false: '#333', true: '#e94560' }}
            thumbColor={isOnline ? '#fff' : '#888'}
          />
        </View>
        <Text style={[styles.statusText, { color: isOnline ? '#2ecc71' : '#e74c3c' }]}>
          {isOnline ? '● Online — receiving requests' : '● Offline'}
        </Text>
        {driverProfile.vehicle_plate && (
          <Text style={styles.meta}>Vehicle: {driverProfile.vehicle_plate} • {driverProfile.vehicle_type}</Text>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>KES {earnings.total.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Today's Earnings</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{driverProfile.total_trips || 0}</Text>
          <Text style={styles.statLabel}>Total Trips</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>⭐ {driverProfile.rating || 5}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>KES {wallet.available_balance.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Wallet</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.section}>Quick Actions</Text>
      <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(driver)/requests' as any)}>
        <Text style={styles.actionText}>📥 View Ride Requests</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(driver)/earnings' as any)}>
        <Text style={styles.actionText}>💰 Earnings History</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(driver)/navigation' as any)}>
        <Text style={styles.actionText}>🗺️ Active Trip Navigation</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 16 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#fff', fontSize: 16, fontWeight: '600' },
  statusText: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  meta: { color: '#8892b0', fontSize: 12, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statBox: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { color: '#e94560', fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#8892b0', fontSize: 11, marginTop: 4, textTransform: 'uppercase' },
  section: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 10, marginBottom: 10 },
  actionBtn: { backgroundColor: '#16213e', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#0f3460' },
  actionText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  empty: { color: '#555', fontSize: 16, marginBottom: 16 },
  btn: { backgroundColor: '#e94560', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
});
