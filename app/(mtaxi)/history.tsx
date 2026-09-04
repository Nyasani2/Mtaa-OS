import React, { useState, useEffect } from 'react';

import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { getPassengerRides } from '@/lib/transport/services/ride.service';

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    load();
  }, [user?.id]);

  async function load() {
    setLoading(true);
    try {
      const data = await getPassengerRides(user!.id);
      setRides(data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  const statusColor: Record<string, string> = {
    completed: '#27ae60',
    cancelled: '#e74c3c',
    searching: '#f39c12',
    accepted: '#3498db',
    started: '#2ecc71',
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ride History</Text>
      {loading ? (
        <ActivityIndicator color="#e94560" style={{ marginTop: 40 }} />
      ) : rides.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>No rides yet</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.push('/(mtaxi)/request' as any)}>
            <Text style={styles.btnText}>Book a Ride</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/(mtaxi)/tracking?id=${item.id}` as any)}>
              <View style={styles.row}>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                <View style={[styles.badge, { backgroundColor: statusColor[item.status] || '#555' }]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.route} numberOfLines={1}>
                {item.pickup_address || 'Pickup'} → {item.dropoff_address || 'Dropoff'}
              </Text>
              <Text style={styles.fare}>KES {(item.final_fare ?? item.fare_estimate)?.toLocaleString()}</Text>
              <Text style={styles.meta}>{item.ride_type} • {item.distance_km} km</Text>
            </TouchableOpacity>
          )}
          onRefresh={load}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  header: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#555', fontSize: 16, marginBottom: 16 },
  btn: { backgroundColor: '#e94560', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  date: { color: '#8892b0', fontSize: 12 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  route: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  fare: { color: '#e94560', fontSize: 16, fontWeight: '800' },
  meta: { color: '#8892b0', fontSize: 12, marginTop: 2 },
});
