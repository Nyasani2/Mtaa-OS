// app/(mtaxi)/tracking.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import UnifiedMap from '@/lib/components/maps/UnifiedMap';
import { useLocation } from '@/lib/hooks/useLocation';

export default function RideTrackingScreen() {
  const router = useRouter();
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const { latitude, longitude } = useLocation();

  const route = [
    { latitude: latitude, longitude: longitude },
    { latitude: latitude + 0.01, longitude: longitude + 0.01 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <UnifiedMap
          latitude={latitude}
          longitude={longitude}
          zoom={14}
          markers={[
            { id: 'pickup', latitude, longitude, title: 'Pickup', color: '#3b82f6' },
            { id: 'dropoff', latitude: latitude + 0.01, longitude: longitude + 0.01, title: 'Destination', color: '#ef4444' },
          ]}
          route={route}
          showUserLocation
        />
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ride Tracking</Text>
          <View style={{ width: 24 }} />
        </View>

        {rideId ? (
          <View style={styles.rideInfo}>
            <Text style={styles.rideId}>Ride #{rideId}</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Driver is on the way</Text>
            </View>
            <Text style={styles.eta}>ETA: 5 minutes</Text>
          </View>
        ) : (
          <View style={styles.noRide}>
            <Ionicons name="navigate" size={32} color="#64748b" />
            <Text style={styles.noRideText}>No active ride</Text>
            <TouchableOpacity style={styles.bookBtn} onPress={() => router.push('/(mtaxi)/request')}>
              <Text style={styles.bookBtnText}>Book a Ride</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  mapContainer: { flex: 1 },
  bottomSheet: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    marginTop: -20,
  },
  handle: { width: 40, height: 4, backgroundColor: '#475569', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  rideInfo: { alignItems: 'center', paddingVertical: 20 },
  rideId: { fontSize: 14, color: '#94a3b8', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981' },
  statusText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  eta: { fontSize: 14, color: '#10b981' },
  noRide: { alignItems: 'center', paddingVertical: 30 },
  noRideText: { fontSize: 16, color: '#94a3b8', marginTop: 12, marginBottom: 20 },
  bookBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
