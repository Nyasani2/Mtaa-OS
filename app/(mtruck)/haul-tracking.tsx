import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useShipperStore } from '@/lib/mtruck/stores/useShipperStore';
import { MapPin, Navigation, Clock, Package, Truck, Phone, AlertCircle, CheckCircle } from 'lucide-react-native';

export default function HaulTracking() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { activeJob, trackJob, isLoading, error } = useShipperStore();
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (jobId) {
      trackJob(jobId);
      const interval = setInterval(() => trackJob(jobId), 10000);
      return () => clearInterval(interval);
    }
  }, [jobId]);

  const job = activeJob;
  if (!job && isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading tracking data...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <AlertCircle size={32} color="#ef4444" />
        <Text style={styles.errorText}>Job not found</Text>
      </View>
    );
  }

  const statusSteps = [
    { key: 'accepted', label: 'Accepted', icon: CheckCircle },
    { key: 'assigned', label: 'Assigned', icon: Truck },
    { key: 'pickup', label: 'Pickup', icon: Package },
    { key: 'in_transit', label: 'In Transit', icon: Navigation },
    { key: 'delivered', label: 'Delivered', icon: MapPin },
    { key: 'completed', label: 'Completed', icon: CheckCircle },
  ];

  const currentStepIndex = statusSteps.findIndex((s) => s.key === job.status);

  return (
    <ScrollView style={styles.container}>
      {/* Status Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{job.cargoType}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
          <Text style={styles.statusText}>{job.status.replace('_', ' ')}</Text>
        </View>
      </View>

      {/* Progress Steps */}
      <View style={styles.stepsContainer}>
        {statusSteps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={[styles.stepDot, isActive && styles.stepDotActive, isCurrent && styles.stepDotCurrent]}>
                <Icon size={14} color={isActive ? '#fff' : '#6b7280'} />
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{step.label}</Text>
                {isCurrent && job.etaMinutes && (
                  <Text style={styles.stepEta}>ETA {Math.round(job.etaMinutes)} min</Text>
                )}
              </View>
              {index < statusSteps.length - 1 && (
                <View style={[styles.stepLine, index < currentStepIndex && styles.stepLineActive]} />
              )}
            </View>
          );
        })}
      </View>

      {/* Route Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Route</Text>
        <View style={styles.routeRow}>
          <MapPin size={16} color="#4f46e5" />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>From</Text>
            <Text style={styles.routeValue}>{job.origin.address}</Text>
          </View>
        </View>
        <View style={styles.routeDivider} />
        <View style={styles.routeRow}>
          <MapPin size={16} color="#ef4444" />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>To</Text>
            <Text style={styles.routeValue}>{job.destination.address}</Text>
          </View>
        </View>
        <View style={styles.routeMeta}>
          <Text style={styles.metaItem}>{job.distanceKm} km</Text>
          <Text style={styles.metaItem}>•</Text>
          <Text style={styles.metaItem}>{job.weightKg.toLocaleString()} kg</Text>
          <Text style={styles.metaItem}>•</Text>
          <Text style={styles.metaItem}>{job.tonnageCategory}</Text>
        </View>
      </View>

      {/* Timing */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Timing</Text>
        <View style={styles.timingRow}>
          <Clock size={14} color="#9ca3af" />
          <Text style={styles.timingLabel}>Pickup</Text>
          <Text style={styles.timingValue}>{new Date(job.pickupDate).toLocaleString()}</Text>
        </View>
        <View style={styles.timingRow}>
          <Clock size={14} color="#9ca3af" />
          <Text style={styles.timingLabel}>Deadline</Text>
          <Text style={styles.timingValue}>{new Date(job.deliveryDeadline).toLocaleString()}</Text>
        </View>
        {job.etaMinutes && (
          <View style={styles.timingRow}>
            <Navigation size={14} color="#059669" />
            <Text style={styles.timingLabel}>ETA</Text>
            <Text style={[styles.timingValue, { color: '#059669' }]}>
              {Math.round(job.etaMinutes)} minutes remaining
            </Text>
          </View>
        )}
      </View>

      {/* Current Location */}
      {job.currentLocation && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Live Location</Text>
          <View style={styles.locationBox}>
            <Navigation size={20} color="#4f46e5" />
            <View>
              <Text style={styles.locationLabel}>Truck is currently at</Text>
              <Text style={styles.locationCoords}>
                {job.currentLocation.lat.toFixed(5)}, {job.currentLocation.lng.toFixed(5)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.actionButton}>
          <Phone size={16} color="#fff" />
          <Text style={styles.actionText}>Call Driver</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.actionButtonSecondary]}>
          <AlertCircle size={16} color="#f59e0b" />
          <Text style={[styles.actionText, { color: '#f59e0b' }]}>Report Issue</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'accepted': return '#4f46e5';
    case 'assigned': return '#7c3aed';
    case 'pickup': return '#d97706';
    case 'in_transit': return '#059669';
    case 'delivered': return '#0891b2';
    case 'completed': return '#10b981';
    default: return '#6b7280';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f23' },
  loadingText: { color: '#9ca3af', fontSize: 14, marginTop: 12 },
  errorText: { color: '#ef4444', fontSize: 16, marginTop: 12 },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#1a1a2e', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  stepsContainer: { padding: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1f2937', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepDotActive: { backgroundColor: '#4f46e5' },
  stepDotCurrent: { backgroundColor: '#059669', borderWidth: 2, borderColor: '#10b981' },
  stepContent: { flex: 1 },
  stepLabel: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
  stepLabelActive: { color: '#fff' },
  stepEta: { color: '#059669', fontSize: 12, marginTop: 2 },
  stepLine: { position: 'absolute', left: 15, top: 32, width: 2, height: 28, backgroundColor: '#374151' },
  stepLineActive: { backgroundColor: '#4f46e5' },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2d2d44' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  routeInfo: { flex: 1 },
  routeLabel: { color: '#9ca3af', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  routeValue: { color: '#e5e7eb', fontSize: 14, marginTop: 2 },
  routeDivider: { height: 1, backgroundColor: '#2d2d44', marginVertical: 10 },
  routeMeta: { flexDirection: 'row', gap: 8, marginTop: 10 },
  metaItem: { color: '#9ca3af', fontSize: 12 },
  timingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  timingLabel: { color: '#9ca3af', fontSize: 12, width: 70 },
  timingValue: { color: '#e5e7eb', fontSize: 13, flex: 1 },
  locationBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0f0f23', borderRadius: 8, padding: 12 },
  locationLabel: { color: '#9ca3af', fontSize: 12 },
  locationCoords: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12, padding: 16, marginBottom: 20 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4f46e5', borderRadius: 10, padding: 14 },
  actionButtonSecondary: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#f59e0b' },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
