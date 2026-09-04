import React, { useEffect, useState } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert, useDriver } from '@/lib/transport/hooks/useDriver';
import { supabase } from '@/lib/supabase';

export default function DriverNavigationScreen() {
  const { user } = useAuthStore();
  const { loadDriverProfile, updateStatus, driverProfile, loading } = useDriver();
  const [activeRide, setActiveRide] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) return;
    loadDriverProfile(user!.id).then(() => loadActiveRide());
  }, [user?.id]);

  async function loadActiveRide() {
    if (!driverProfile?.id) return;
    const { data } = await supabase
      .from('mtaxi_rides')
      .select('*')
      .eq('driver_id', driverProfile.id)
      .in('status', ['accepted', 'arrived', 'started'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    setActiveRide(data);
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!activeRide) return;
    try {
      await updateStatus(activeRide.id, newStatus, activeRide.passenger_id);
      Alert.alert('Status Updated', `Ride is now ${newStatus}`);
      loadActiveRide();
    } catch (err: any) {
      Alert.alert('Failed', err.message);
    }
  };

  if (loading && !activeRide) {
    return <View style={styles.center}><ActivityIndicator color="#e94560" /></View>;
  }

  if (!activeRide) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No active trip</Text>
        <Text style={styles.hint}>Accept a ride request to see navigation here.</Text>
      </View>
    );
  }

  const nextAction = activeRide.status === 'accepted' ? 'arrived'
    : activeRide.status === 'arrived' ? 'started'
    : activeRide.status === 'started' ? 'completed'
    : null;

  const actionLabels: Record<string, string> = {
    arrived: "I've Arrived at Pickup",
    started: "Start Trip",
    completed: "Complete Trip",
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>🗺️ Active Trip</Text>

      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{activeRide.status?.toUpperCase()}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Pickup</Text>
        <Text style={styles.value}>{activeRide.pickup_address || `${activeRide.pickup_lat}, ${activeRide.pickup_lng}`}</Text>
        <Text style={styles.label}>Dropoff</Text>
        <Text style={styles.value}>{activeRide.dropoff_address || `${activeRide.dropoff_lat}, ${activeRide.dropoff_lng}`}</Text>
        <Text style={styles.label}>Fare</Text>
        <Text style={styles.fare}>KES {activeRide.fare_estimate?.toLocaleString()}</Text>
        <Text style={styles.label}>Payment</Text>
        <Text style={styles.value}>{activeRide.payment_method}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Coordinates</Text>
        <Text style={styles.coords}>Pickup: {activeRide.pickup_lat}, {activeRide.pickup_lng}</Text>
        <Text style={styles.coords}>Dropoff: {activeRide.dropoff_lat}, {activeRide.dropoff_lng}</Text>
      </View>

      {nextAction && (
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusUpdate(nextAction)}>
          <Text style={styles.actionText}>{actionLabels[nextAction]}</Text>
        </TouchableOpacity>
      )}

      {activeRide.status === 'started' && (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e74c3c', marginTop: 10 }]} onPress={() => Alert.alert('Cancel Trip', 'Are you sure?', [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', style: 'destructive', onPress: () => handleStatusUpdate('cancelled') },
        ])}>
          <Text style={styles.actionText}>Cancel Trip</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: '#f39c12', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16 },
  statusText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 12 },
  label: { color: '#8892b0', fontSize: 11, fontWeight: '600', marginTop: 8, textTransform: 'uppercase' },
  value: { color: '#fff', fontSize: 15, marginTop: 2 },
  fare: { color: '#e94560', fontSize: 20, fontWeight: '800', marginTop: 2 },
  coords: { color: '#555', fontSize: 12, marginTop: 2 },
  actionBtn: { backgroundColor: '#2ecc71', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  empty: { color: '#555', fontSize: 16, marginBottom: 8 },
  hint: { color: '#8892b0', fontSize: 12, textAlign: 'center' },
});
