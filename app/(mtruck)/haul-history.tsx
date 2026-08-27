import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useShipperStore } from '@/lib/mtruck/stores/useShipperStore';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useEffect } from 'react';
import { MapPin, Clock, Star, ChevronRight, Package, TrendingUp, TrendingDown } from 'lucide-react-native';

export default function HaulHistory() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { jobs, loadJobs, isLoading } = useShipperStore();

  useEffect(() => {
    if (user?.id) loadJobs(user.id);
  }, [user?.id]);

  const completed = jobs.filter((j) => ['delivered', 'completed'].includes(j.status));
  const cancelled = jobs.filter((j) => j.status === 'cancelled');
  const disputed = jobs.filter((j) => j.status === 'disputed');

  const renderJobCard = (job: any) => (
    <Pressable
      key={job.id}
      style={styles.card}
      onPress={() =>
        job.status === 'delivered'
          ? router.push({ pathname: '/settlement', params: { jobId: job.id } })
          : router.push({ pathname: '/haul-tracking', params: { jobId: job.id } })
      }
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cargoType}>{job.cargoType}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(job.status) }]}>
          <Text style={styles.badgeText}>{job.status}</Text>
        </View>
      </View>
      <View style={styles.routeRow}>
        <MapPin size={14} color="#4f46e5" />
        <Text style={styles.routeText} numberOfLines={1}>
          {job.origin.address} → {job.destination.address}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{job.weightKg.toLocaleString()} kg</Text>
        <Text style={styles.metaText}>•</Text>
        <Text style={styles.metaText}>{job.distanceKm} km</Text>
        <Text style={styles.metaText}>•</Text>
        <Text style={styles.metaText}>{job.currency} {job.finalRate?.toLocaleString() ?? '—'}</Text>
      </View>
      <View style={styles.bottomRow}>
        <View style={styles.dateRow}>
          <Clock size={12} color="#9ca3af" />
          <Text style={styles.dateText}>{new Date(job.createdAt).toLocaleDateString()}</Text>
        </View>
        {job.shipperRating && (
          <View style={styles.ratingRow}>
            <Star size={12} color="#f59e0b" />
            <Text style={styles.ratingText}>{job.shipperRating}/5</Text>
          </View>
        )}
        <ChevronRight size={16} color="#6b7280" />
      </View>
    </Pressable>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Haul History</Text>
        <Text style={styles.headerSubtitle}>{completed.length} completed, {cancelled.length} cancelled</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <TrendingUp size={20} color="#059669" />
          <Text style={styles.statValue}>{completed.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingDown size={20} color="#ef4444" />
          <Text style={styles.statValue}>{cancelled.length}</Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </View>
        <View style={styles.statCard}>
          <Package size={20} color="#d97706" />
          <Text style={styles.statValue}>{disputed.length}</Text>
          <Text style={styles.statLabel}>Disputed</Text>
        </View>
      </View>

      {completed.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed Deliveries</Text>
          {completed.map(renderJobCard)}
        </View>
      )}

      {cancelled.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cancelled</Text>
          {cancelled.map(renderJobCard)}
        </View>
      )}

      {disputed.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Under Dispute</Text>
          {disputed.map(renderJobCard)}
        </View>
      )}

      {completed.length === 0 && cancelled.length === 0 && disputed.length === 0 && (
        <View style={styles.emptyState}>
          <Package size={40} color="#6b7280" />
          <Text style={styles.emptyText}>No haul history yet</Text>
        </View>
      )}
    </ScrollView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return '#059669';
    case 'delivered': return '#0891b2';
    case 'cancelled': return '#ef4444';
    case 'disputed': return '#d97706';
    default: return '#6b7280';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#1a1a2e' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2d2d44' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2d2d44' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cargoType: { fontSize: 15, fontWeight: '700', color: '#fff', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'capitalize' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  routeText: { color: '#d1d5db', fontSize: 13, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  metaText: { color: '#9ca3af', fontSize: 12 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { color: '#9ca3af', fontSize: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: '#f59e0b', fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#9ca3af', marginTop: 12, fontSize: 14 },
});
