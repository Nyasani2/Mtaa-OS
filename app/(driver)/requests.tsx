import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useLocation } from '@/lib/transport/hooks/useLocation';
import { useDriver } from '@/lib/transport/hooks/useDriver';
import { haversine } from '@/lib/transport/services/ride.service';

export default function DriverRequestsScreen() {
  const { user } = useAuthStore();
  const { position } = useLocation();
  const { loadDriverProfile, loadNearbyRequests, acceptRideRequest, driverProfile, loading } = useDriver();
  const [requests, setRequests] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    loadDriverProfile(user!.id).then(() => loadRequests());
  }, [user?.id]);

  const loadRequests = useCallback(async () => {
    if (!position) { Alert.alert('Location required'); return; }
    try {
      const reqs = await loadNearbyRequests(position.latitude, position.longitude, 15);
      setRequests(reqs);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }, [position, loadNearbyRequests]);

  const handleAccept = async (ride: any) => {
    if (!driverProfile?.id) { Alert.alert('Driver profile not loaded'); return; }
    try {
      await acceptRideRequest(ride.id, driverProfile.id, ride.passenger_id);
      Alert.alert('Ride Accepted!', 'Navigate to pickup location.');
      setRequests((prev) => prev.filter((r) => r.id !== ride.id));
    } catch (err: any) {
      Alert.alert('Failed', err.message);
    }
  };

  const distanceFromDriver = (ride: any) => {
    if (!position || !ride.pickup_lat || !ride.pickup_lng) return '—';
    const d = haversine(position.latitude, position.longitude, ride.pickup_lat, ride.pickup_lng);
    return `${d.toFixed(1)} km`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📥 Ride Requests</Text>
      {loading && requests.length === 0 ? (
        <ActivityIndicator color="#e94560" style={{ marginTop: 40 }} />
      ) : requests.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>No nearby requests</Text>
          <Text style={styles.hint}>Make sure you are online and near busy areas.</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadRequests} tintColor="#e94560" />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rideType}>{item.ride_type?.toUpperCase()}</Text>
                <Text style={styles.distance}>{distanceFromDriver(item)} away</Text>
              </View>
              <Text style={styles.address}>📍 {item.pickup_address || 'Pickup location'}</Text>
              <Text style={styles.address}>🏁 {item.dropoff_address || 'Destination'}</Text>
              <Text style={styles.fare}>KES {item.fare_estimate?.toLocaleString()}</Text>
              <Text style={styles.meta}>{item.distance_km} km • {item.payment_method}</Text>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item)}>
                <Text style={styles.acceptText}>ACCEPT RIDE</Text>
              </TouchableOpacity>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  empty: { color: '#555', fontSize: 16, marginBottom: 8 },
  hint: { color: '#8892b0', fontSize: 12, textAlign: 'center' },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rideType: { color: '#e94560', fontSize: 12, fontWeight: '700' },
  distance: { color: '#2ecc71', fontSize: 12, fontWeight: '600' },
  address: { color: '#fff', fontSize: 14, marginBottom: 4 },
  fare: { color: '#e94560', fontSize: 18, fontWeight: '800', marginTop: 4 },
  meta: { color: '#8892b0', fontSize: 12, marginTop: 2 },
  acceptBtn: { backgroundColor: '#2ecc71', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10 },
  acceptText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
