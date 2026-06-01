import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { useShipperStore } from '@/lib/mtruck/stores/useShipperStore';
import { useIdentity } from '@/lib/auth/identity';
import { Truck, Package, MapPin, Clock, TrendingUp, ChevronRight, AlertCircle } from 'lucide-react-native';

export default function MTruckHome() {
  const router = useRouter();
  const { user } = useIdentity();
  const { requests, jobs, isLoading, error, loadRequests, loadJobs, clearError } = useShipperStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user?.id) {
      await loadRequests(user.id);
      await loadJobs(user.id);
    }
    setRefreshing(false);
  }, [user?.id]);

  const activeJobs = jobs.filter((j) => ['accepted','assigned','pickup','in_transit'].includes(j.status));
  const completedJobs = jobs.filter((j) => ['delivered','completed'].includes(j.status));
  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MTruck</Text>
        <Text style={styles.headerSubtitle}>Freight & Heavy Haulage</Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionCard} onPress={() => router.push('/request-haul')}>
          <Truck size={28} color="#4f46e5" />
          <Text style={styles.actionText}>Request Haul</Text>
        </Pressable>
        <Pressable style={styles.actionCard} onPress={() => router.push('/haul-history')}>
          <Clock size={28} color="#d97706" />
          <Text style={styles.actionText}>History</Text>
        </Pressable>
        <Pressable style={styles.actionCard} onPress={() => router.push('/equipment')}>
          <Package size={28} color="#059669" />
          <Text style={styles.actionText}>Equipment</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{activeJobs.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{completedJobs.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{pendingRequests.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <AlertCircle size={16} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={clearError}><Text style={styles.errorDismiss}>Dismiss</Text></Pressable>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Deliveries</Text>
        {activeJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <MapPin size={32} color="#6b7280" />
            <Text style={styles.emptyText}>No active deliveries</Text>
            <Pressable style={styles.emptyButton} onPress={() => router.push('/request-haul')}>
              <Text style={styles.emptyButtonText}>Request a Haul</Text>
            </Pressable>
          </View>
        ) : (
          activeJobs.map((job) => (
            <Pressable key={job.id} style={styles.jobCard}
              onPress={() => router.push({ pathname: '/haul-tracking', params: { jobId: job.id } })}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobCargo}>{job.cargoType}</Text>
                <View style={[styles.badge, { backgroundColor: getStatusColor(job.status) }]}>
                  <Text style={styles.badgeText}>{job.status.replace('_', ' ')}</Text>
                </View>
              </View>
              <View style={styles.jobRoute}>
                <MapPin size={14} color="#4f46e5" />
                <Text style={styles.routeText} numberOfLines={1}>
                  {job.origin.address} → {job.destination.address}
                </Text>
              </View>
              <View style={styles.jobMeta}>
                <Text style={styles.metaText}>{job.weightKg.toLocaleString()} kg</Text>
                <Text style={styles.metaText}>•</Text>
                <Text style={styles.metaText}>{job.distanceKm} km</Text>
                {job.etaMinutes && (
                  <><Text style={styles.metaText}>•</Text>
                  <Text style={styles.metaText}>ETA {Math.round(job.etaMinutes)} min</Text></>
                )}
              </View>
              <ChevronRight size={16} color="#6b7280" style={styles.chevron} />
            </Pressable>
          ))
        )}
      </View>

      {pendingRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Quotes</Text>
          {pendingRequests.map((req) => (
            <View key={req.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestCargo}>{req.cargoType}</Text>
                <Text style={styles.requestWeight}>{req.weightKg.toLocaleString()} kg</Text>
              </View>
              <Text style={styles.requestRoute}>{req.originAddress} → {req.destAddress}</Text>
              <Text style={styles.requestDate}>Pickup: {new Date(req.pickupDate).toLocaleDateString()}</Text>
              {req.quotes.length > 0 && (
                <View style={styles.quoteBadge}>
                  <TrendingUp size={12} color="#059669" />
                  <Text style={styles.quoteText}>{req.quotes.length} quote{req.quotes.length > 1 ? 's' : ''} received</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
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
  header: { padding: 20, paddingTop: 60, backgroundColor: '#1a1a2e' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  actionsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  actionCard: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2d2d44' },
  actionText: { fontSize: 12, color: '#e5e7eb', marginTop: 8, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2d2d44' },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  errorBox: { margin: 16, backgroundColor: '#450a0a', borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { flex: 1, color: '#fca5a5', fontSize: 13 },
  errorDismiss: { color: '#f87171', fontSize: 12, fontWeight: '600' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
  emptyState: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#2d2d44' },
  emptyText: { color: '#9ca3af', marginTop: 12, fontSize: 14 },
  emptyButton: { marginTop: 16, backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  emptyButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  jobCard: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2d2d44' },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  jobCargo: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'capitalize' },
  jobRoute: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  routeText: { color: '#d1d5db', fontSize: 13, flex: 1 },
  jobMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { color: '#9ca3af', fontSize: 12 },
  chevron: { position: 'absolute', right: 16, top: '50%', marginTop: -8 },
  requestCard: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2d2d44' },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  requestCargo: { fontSize: 15, fontWeight: '700', color: '#fff' },
  requestWeight: { fontSize: 13, color: '#9ca3af' },
  requestRoute: { color: '#d1d5db', fontSize: 13, marginBottom: 4 },
  requestDate: { color: '#9ca3af', fontSize: 12 },
  quoteBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  quoteText: { color: '#059669', fontSize: 12, fontWeight: '600' },
});
