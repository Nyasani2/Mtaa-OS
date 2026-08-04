import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ride, setRide] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadRide();
    const sub = supabase
      .channel(`ride_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mtaxi_rides', filter: `id=eq.${id}` }, (payload) => {
        setRide(payload.new);
      })
      .subscribe();
    const interval = setInterval(loadRide, 10000);
    return () => { sub.unsubscribe(); clearInterval(interval); };
  }, [id]);

  async function loadRide() {
    if (!id) return;
    setLoading(true);
    const { data } = await supabase.from('mtaxi_rides').select('*').eq('id', id).single();
    setRide(data);
    if (data?.driver_id) {
      const { data: d } = await supabase.from('mtaxi_drivers').select('*').eq('id', data.driver_id).single();
      setDriver(d);
    }
    setLoading(false);
  }

  const statusColors: Record<string, string> = {
    searching: '#f39c12',
    accepted: '#3498db',
    arrived: '#9b59b6',
    started: '#2ecc71',
    completed: '#27ae60',
    cancelled: '#e74c3c',
  };

  if (loading && !ride) return <View style={styles.center}><ActivityIndicator color="#e94560" /></View>;
  if (!ride) return <View style={styles.center}><Text style={styles.empty}>Ride not found</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>Trip Tracking</Text>
      <View style={[styles.badge, { backgroundColor: statusColors[ride.status] || '#555' }]}>
        <Text style={styles.badgeText}>{ride.status?.toUpperCase()}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Pickup</Text>
        <Text style={styles.value}>{ride.pickup_address || `${ride.pickup_lat}, ${ride.pickup_lng}`}</Text>
        <Text style={styles.label}>Dropoff</Text>
        <Text style={styles.value}>{ride.dropoff_address || `${ride.dropoff_lat}, ${ride.dropoff_lng}`}</Text>
        <Text style={styles.label}>Fare Estimate</Text>
        <Text style={styles.fare}>KES {ride.fare_estimate}</Text>
        <Text style={styles.label}>Distance</Text>
        <Text style={styles.value}>{ride.distance_km} km</Text>
      </View>

      {driver && (
        <View style={styles.card}>
          <Text style={styles.label}>Driver</Text>
          <Text style={styles.value}>{driver.full_name}</Text>
          <Text style={styles.value}>📞 {driver.phone}</Text>
          <Text style={styles.value}>🚗 {driver.vehicle_plate} • {driver.vehicle_type}</Text>
          <Text style={styles.value}>⭐ {driver.rating}</Text>
        </View>
      )}

      {ride.status === 'searching' && (
        <View style={styles.center}>
          <ActivityIndicator color="#e94560" />
          <Text style={styles.hint}>Finding nearby drivers...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 12 },
  label: { color: '#8892b0', fontSize: 11, fontWeight: '600', marginTop: 8, textTransform: 'uppercase' },
  value: { color: '#fff', fontSize: 15, marginTop: 2 },
  fare: { color: '#e94560', fontSize: 20, fontWeight: '800', marginTop: 2 },
  empty: { color: '#555', fontSize: 16 },
  hint: { color: '#8892b0', marginTop: 12 },
});
