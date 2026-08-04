// lib/transport/components/RideTracker.tsx
// Live ride tracking with driver info, status, and cancel action

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UnifiedMap from '@/lib/components/maps/UnifiedMap';
import type { TransportRide } from '../types';

interface Props { ride: TransportRide | null; onCancel: () => void; cancelling?: boolean; }

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  searching: { label: 'Finding driver...', color: '#f59e0b', icon: 'search' },
  accepted: { label: 'Driver on the way', color: '#3b82f6', icon: 'navigate' },
  arrived: { label: 'Driver has arrived', color: '#10b981', icon: 'location' },
  in_progress: { label: 'Ride in progress', color: '#8B5CF6', icon: 'car' },
  completed: { label: 'Ride completed', color: '#10b981', icon: 'checkmark-circle' },
  cancelled: { label: 'Ride cancelled', color: '#ef4444', icon: 'close-circle' },
  scheduled: { label: 'Scheduled ride', color: '#64748b', icon: 'calendar' },
};

export default function RideTracker({ ride, onCancel, cancelling }: Props) {
  if (!ride) {
    return (
      <View style={styles.empty}>
        <Ionicons name="car-outline" size={48} color="#475569" />
        <Text style={styles.emptyText}>No active ride</Text>
        <Text style={styles.emptySub}>Book a ride to see tracking here</Text>
      </View>
    );
  }

  const status = STATUS_LABELS[ride.status] || STATUS_LABELS.searching;
  const isActive = ['searching', 'accepted', 'arrived', 'in_progress'].includes(ride.status);

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <UnifiedMap
          origin={{ latitude: ride.pickup.lat, longitude: ride.pickup.lng }}
          destination={{ latitude: ride.dropoff.lat, longitude: ride.dropoff.lng }}
          showsUserLocation
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Status Card */}
      <View style={styles.card}>
        <View style={styles.handle} />
        <View style={[styles.statusBadge, { backgroundColor: `${status.color}15` }]}>
          <Ionicons name={status.icon} size={18} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>

        {ride.driver && (
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}><Ionicons name="person" size={24} color="#64748b" /></View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{ride.driver.full_name}</Text>
              <Text style={styles.driverMeta}>{ride.driver.vehicle_plate} · {ride.driver.vehicle_type}{ride.driver.rating && ` · ⭐ ${ride.driver.rating}`}</Text>
            </View>
            {ride.driver.phone && (
              <TouchableOpacity style={styles.callBtn}><Ionicons name="call" size={18} color="#3b82f6" /></TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.details}>
          <View style={styles.detailRow}><Ionicons name="location" size={16} color="#10b981" /><Text style={styles.detailText} numberOfLines={1}>{ride.pickup.address || 'Pickup location'}</Text></View>
          <View style={styles.detailRow}><Ionicons name="flag" size={16} color="#ef4444" /><Text style={styles.detailText} numberOfLines={1}>{ride.dropoff.address || 'Destination'}</Text></View>
          {ride.fare_estimate && <View style={styles.detailRow}><Ionicons name="cash" size={16} color="#f59e0b" /><Text style={styles.detailText}>Est. {ride.driver?.vehicle_type || ride.vehicle_type} · KES {ride.fare_estimate.toLocaleString()}</Text></View>}
        </View>

        {isActive && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={cancelling}>
            {cancelling ? <ActivityIndicator color="#ef4444" size="small" /> : (<><Ionicons name="close-circle" size={18} color="#ef4444" /><Text style={styles.cancelText}>Cancel Ride</Text></>)}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  mapContainer: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#94a3b8', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#475569', marginTop: 4 },
  card: { backgroundColor: '#1e293b', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, marginTop: -24 },
  handle: { width: 40, height: 4, backgroundColor: '#475569', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginBottom: 16, gap: 8 },
  statusText: { fontSize: 13, fontWeight: '700' },
  driverRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  driverAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  driverMeta: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  details: { marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  detailText: { fontSize: 14, color: '#e2e8f0', flex: 1 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: '#ef4444', gap: 8 },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
});
