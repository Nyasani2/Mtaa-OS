import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useLocation } from '@/lib/transport/hooks/useLocation';
import { getShipperHauls, getWalletBalance } from '@/lib/transport/services/ride.service';

export default function MTruckHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { position, address, loading: locLoading } = useLocation();
  const [hauls, setHauls] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadData();
  }, [user?.id]);

  async function loadData() {
    setLoading(true);
    try {
      const [h, b] = await Promise.all([
        getShipperHauls(user!.id),
        getWalletBalance(user!.id),
      ]);
      setHauls(h);
      setBalance(Number(b.available_balance || 0));
    } catch { /* ignore */ }
    setLoading(false);
  }

  const guard = (route: string, msg: string) => {
    Alert.alert('Coming Soon', msg);
    // router.push(route); // uncomment when screens exist
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>🚛 MTruck</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balance}>KES {balance.toLocaleString()}</Text>
        <Text style={styles.location}>{locLoading ? 'Locating...' : address || 'Location unknown'}</Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.tile} onPress={() => router.push('/(mtruck)/request-haul')}>
          <Text style={styles.tileIcon}>📦</Text>
          <Text style={styles.tileText}>Request Haul</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tile} onPress={() => guard('/(mtruck)/onboarding', 'Truck company registration coming soon.')}>
          <Text style={styles.tileIcon}>🏢</Text>
          <Text style={styles.tileText}>Register Company</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tile} onPress={() => guard('/(mtruck)/fleet', 'Fleet management coming soon.')}>
          <Text style={styles.tileIcon}>🚚</Text>
          <Text style={styles.tileText}>My Fleet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tile} onPress={() => guard('/(mtruck)/equipment', 'Equipment listing coming soon.')}>
          <Text style={styles.tileIcon}>🔧</Text>
          <Text style={styles.tileText}>Equipment</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Recent Hauls</Text>
      {loading ? (
        <ActivityIndicator color="#e94560" />
      ) : hauls.length === 0 ? (
        <Text style={styles.empty}>No hauls yet. Tap "Request Haul" to start.</Text>
      ) : (
        hauls.slice(0, 5).map((h) => (
          <View key={h.id} style={styles.haulCard}>
            <Text style={styles.haulRoute}>{h.pickup_address || 'Pickup'} → {h.dropoff_address || 'Dropoff'}</Text>
            <Text style={styles.haulMeta}>{h.cargo_type} • {h.weight_kg}kg • KES {h.fare_estimate}</Text>
            <View style={[styles.statusBadge, { backgroundColor: h.status === 'completed' ? '#27ae60' : '#f39c12' }]}>
              <Text style={styles.statusText}>{h.status}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  header: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 16 },
  balanceCard: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 16 },
  balanceLabel: { color: '#8892b0', fontSize: 12, textTransform: 'uppercase' },
  balance: { color: '#e94560', fontSize: 28, fontWeight: '800', marginTop: 4 },
  location: { color: '#555', fontSize: 12, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  tile: { width: '47%', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, alignItems: 'center' },
  tileIcon: { fontSize: 28, marginBottom: 8 },
  tileText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  section: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 10 },
  empty: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 20 },
  haulCard: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10 },
  haulRoute: { color: '#fff', fontSize: 14, fontWeight: '600' },
  haulMeta: { color: '#8892b0', fontSize: 12, marginTop: 4 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
