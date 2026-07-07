import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGarage } from '@/lib/hooks/useGarage';
import { useAppointments } from '@/lib/hooks/useAppointments';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  vehicle_received: '#8b5cf6',
  diagnosing: '#ec4899',
  awaiting_approval: '#f97316',
  in_progress: '#3b82f6',
  waiting_parts: '#f59e0b',
  quality_check: '#06b6d4',
  ready_for_pickup: '#22c55e',
  completed: '#22c55e',
  cancelled: '#ef4444',
  no_show: '#64748b',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  vehicle_received: 'Received',
  diagnosing: 'Diagnosing',
  awaiting_approval: 'Awaiting Approval',
  in_progress: 'In Progress',
  waiting_parts: 'Waiting Parts',
  quality_check: 'Quality Check',
  ready_for_pickup: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export default function GarageDashboardScreen() {
  const router = useRouter();
  const { myGarage, loadMyGarage, stats, loadStats, isLoading: garageLoading, error: garageError } = useGarage();
  const { appointments, loadGarageAppointments, isLoading: apptLoading } = useAppointments();

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    loadMyGarage().then(g => {
      if (g) {
        loadStats(g.id);
        loadGarageAppointments(g.id);
      }
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const g = await loadMyGarage();
    if (g) {
      await Promise.all([
        loadStats(g.id),
        loadGarageAppointments(g.id),
      ]);
    }
    setRefreshing(false);
  }, [loadMyGarage, loadStats, loadGarageAppointments]);

  const filteredAppointments = appointments.filter(a => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return a.scheduled_date === today;
    }
    if (activeFilter === 'active') {
      return ['confirmed', 'vehicle_received', 'diagnosing', 'awaiting_approval', 'in_progress', 'waiting_parts', 'quality_check'].includes(a.status);
    }
    if (activeFilter === 'completed') return a.status === 'completed';
    if (activeFilter === 'pending') return a.status === 'pending';
    return true;
  });

  const todayAppointments = appointments.filter(a => {
    const today = new Date().toISOString().split('T')[0];
    return a.scheduled_date === today;
  });

  if (garageLoading && !myGarage) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading your garage...</Text>
      </View>
    );
  }

  if (!myGarage) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🔧</Text>
        <Text style={styles.emptyTitle}>No Garage Found</Text>
        <Text style={styles.emptyText}>You haven't registered a garage yet.</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/garage/onboarding')}>
          <Text style={styles.ctaText}>Register Your Garage →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (myGarage.status === 'pending') {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>⏳</Text>
        <Text style={styles.emptyTitle}>Under Review</Text>
        <Text style={styles.emptyText}>Your garage application is being reviewed by MTAA. You'll be notified once approved.</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/garage')}>
          <Text style={styles.ctaText}>Back to Garage →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (myGarage.status === 'rejected') {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>❌</Text>
        <Text style={styles.emptyTitle}>Application Rejected</Text>
        <Text style={styles.emptyText}>{myGarage.rejection_reason || 'Your application was rejected. Please contact MTAA support.'}</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/garage/onboarding')}>
          <Text style={styles.ctaText}>Reapply →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>{myGarage.business_name}</Text>
            <Text style={styles.headerSubtitle}>{myGarage.city}, {myGarage.county}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: myGarage.status === 'approved' ? '#14532d' : '#1e3a5f' }]}>
            <Text style={styles.statusText}>{myGarage.status}</Text>
          </View>
        </View>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingStars}>{'⭐'.repeat(Math.round(myGarage.rating || 0))}</Text>
          <Text style={styles.ratingText}>{myGarage.rating?.toFixed(1) || '0.0'} ({myGarage.review_count || 0} reviews)</Text>
          <Text style={styles.tierBadge}>{myGarage.subscription_tier}</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard label="Today's Revenue" value={`KES ${(stats?.revenueToday || 0).toLocaleString()}`} color="#22c55e" icon="💰" />
        <StatCard label="Active Jobs" value={String(stats?.activeJobs || 0)} color="#3b82f6" icon="🔧" />
        <StatCard label="Pending" value={String(stats?.pendingJobs || 0)} color="#f59e0b" icon="⏳" />
        <StatCard label="Completed" value={String(stats?.completedJobs || 0)} color="#8b5cf6" icon="✅" />
        <StatCard label="Mechanics" value={String(stats?.mechanicsCount || 0)} color="#06b6d4" icon="👨‍🔧" />
        <StatCard label="Fleet Contracts" value={String(stats?.fleetContracts || 0)} color="#ec4899" icon="🚛" />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.actionGrid}>
          <ActionButton icon="📅" label="New Appointment" color="#3b82f6" onPress={() => router.push('/garage/appointments/new')} />
          <ActionButton icon="🔍" label="Scan Vehicle" color="#8b5cf6" onPress={() => router.push('/garage/diagnostics/scan')} />
          <ActionButton icon="👨‍🔧" label="Add Mechanic" color="#06b6d4" onPress={() => router.push('/garage/mechanics/new')} />
          <ActionButton icon="📦" label="Order Parts" color="#f59e0b" onPress={() => router.push('/garage/inventory')} />
          <ActionButton icon="📋" label="Roadworthy" color="#22c55e" onPress={() => router.push('/garage/compliance/roadworthy')} />
          <ActionButton icon="📊" label="Reports" color="#ec4899" onPress={() => router.push('/garage/reports')} />
        </View>
      </View>

      {/* Alerts */}
      {(stats?.lowStockItems || 0) > 0 && (
        <TouchableOpacity style={[styles.alertCard, { borderLeftColor: '#f59e0b' }]} onPress={() => router.push('/garage/inventory')}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Low Stock Alert</Text>
            <Text style={styles.alertText}>{stats?.lowStockItems} items below reorder point</Text>
          </View>
          <Text style={styles.alertAction}>View →</Text>
        </TouchableOpacity>
      )}

      {(stats?.outOfStockItems || 0) > 0 && (
        <TouchableOpacity style={[styles.alertCard, { borderLeftColor: '#ef4444' }]} onPress={() => router.push('/garage/inventory')}>
          <Text style={styles.alertIcon}>🚨</Text>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Out of Stock</Text>
            <Text style={styles.alertText}>{stats?.outOfStockItems} items need immediate restocking</Text>
          </View>
          <Text style={styles.alertAction}>View →</Text>
        </TouchableOpacity>
      )}

      {/* Today's Schedule */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📅 Today's Schedule ({todayAppointments.length})</Text>
          <TouchableOpacity onPress={() => router.push('/garage/appointments')}>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>

        {todayAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No appointments scheduled for today</Text>
          </View>
        ) : (
          todayAppointments.slice(0, 5).map(appt => (
            <TouchableOpacity
              key={appt.id}
              style={styles.appointmentCard}
              onPress={() => router.push(`/garage/appointments/${appt.id}`)}
            >
              <View style={styles.appointmentTime}>
                <Text style={styles.appointmentTimeText}>{appt.scheduled_time?.slice(0, 5)}</Text>
              </View>
              <View style={styles.appointmentBody}>
                <Text style={styles.appointmentVehicle}>
                  {appt.vehicle?.make} {appt.vehicle?.model} · {appt.vehicle?.plate_number}
                </Text>
                <Text style={styles.appointmentService} numberOfLines={1}>
                  {appt.service_notes || 'General service'}
                </Text>
                <View style={styles.appointmentMeta}>
                  <Text style={styles.appointmentCustomer}>{appt.customer?.full_name}</Text>
                  <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[appt.status] || '#64748b' }]}>
                    <Text style={styles.statusPillText}>{STATUS_LABELS[appt.status] || appt.status}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* All Appointments Filter */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 All Jobs</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {['all', 'today', 'active', 'completed', 'pending'].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No appointments match this filter</Text>
          </View>
        ) : (
          filteredAppointments.slice(0, 10).map(appt => (
            <TouchableOpacity
              key={appt.id}
              style={styles.appointmentCard}
              onPress={() => router.push(`/garage/appointments/${appt.id}`)}
            >
              <View style={styles.appointmentTime}>
                <Text style={styles.appointmentTimeText}>{appt.scheduled_date?.slice(5)}</Text>
                <Text style={styles.appointmentTimeSub}>{appt.scheduled_time?.slice(0, 5)}</Text>
              </View>
              <View style={styles.appointmentBody}>
                <Text style={styles.appointmentVehicle}>
                  {appt.vehicle?.make} {appt.vehicle?.model} · {appt.vehicle?.plate_number}
                </Text>
                <View style={styles.appointmentMeta}>
                  <Text style={styles.appointmentCustomer}>{appt.customer?.full_name}</Text>
                  <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[appt.status] || '#64748b' }]}>
                    <Text style={styles.statusPillText}>{STATUS_LABELS[appt.status] || appt.status}</Text>
                  </View>
                </View>
                {appt.final_cost && (
                  <Text style={styles.appointmentCost}>KES {appt.final_cost.toLocaleString()}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Monthly Revenue */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 This Month</Text>
        <View style={styles.revenueCard}>
          <View style={styles.revenueItem}>
            <Text style={styles.revenueLabel}>Revenue</Text>
            <Text style={styles.revenueValue}>KES {(stats?.revenueThisMonth || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.revenueDivider} />
          <View style={styles.revenueItem}>
            <Text style={styles.revenueLabel}>This Week</Text>
            <Text style={styles.revenueValue}>KES {(stats?.revenueThisWeek || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.revenueDivider} />
          <View style={styles.revenueItem}>
            <Text style={styles.revenueLabel}>Total Jobs</Text>
            <Text style={styles.revenueValue}>{stats?.totalAppointments || 0}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <View style={[styles.actionIconBg, { backgroundColor: color + '20' }]}>
        <Text style={[styles.actionIcon, { color }]}>{icon}</Text>
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#0f172a' },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  ctaButton: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28 },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  header: { padding: 20, paddingTop: 60, backgroundColor: '#1e293b', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingStars: { fontSize: 14 },
  ratingText: { fontSize: 13, color: '#94a3b8' },
  tierBadge: { backgroundColor: '#334155', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontSize: 11, color: '#cbd5e1', fontWeight: '700' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: { width: '31%', backgroundColor: '#1e293b', borderRadius: 14, padding: 14, alignItems: 'center' },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 9, color: '#64748b', marginTop: 2, textAlign: 'center' },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0', marginBottom: 12 },
  seeAll: { color: '#3b82f6', fontSize: 13, fontWeight: '600' },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionButton: { width: '31%', backgroundColor: '#1e293b', borderRadius: 14, padding: 14, alignItems: 'center' },
  actionIconBg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionIcon: { fontSize: 22 },
  actionLabel: { fontSize: 11, color: '#94a3b8', textAlign: 'center', fontWeight: '600' },

  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 12, borderLeftWidth: 3 },
  alertIcon: { fontSize: 22, marginRight: 12 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  alertText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  alertAction: { color: '#3b82f6', fontSize: 13, fontWeight: '600' },

  emptyState: { backgroundColor: '#1e293b', borderRadius: 12, padding: 20, alignItems: 'center' },
  emptyStateText: { color: '#64748b', fontSize: 13 },

  appointmentCard: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 10, alignItems: 'flex-start' },
  appointmentTime: { width: 50, alignItems: 'center', marginRight: 12 },
  appointmentTimeText: { fontSize: 13, fontWeight: '700', color: '#3b82f6' },
  appointmentTimeSub: { fontSize: 10, color: '#64748b', marginTop: 2 },
  appointmentBody: { flex: 1 },
  appointmentVehicle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  appointmentService: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  appointmentMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  appointmentCustomer: { fontSize: 11, color: '#64748b' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  appointmentCost: { fontSize: 12, color: '#22c55e', fontWeight: '700', marginTop: 4 },

  filterRow: { flexDirection: 'row', marginBottom: 12 },
  filterChip: { backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: '#334155' },
  filterChipActive: { backgroundColor: '#1e3a5f', borderColor: '#3b82f6' },
  filterChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#3b82f6' },

  revenueCard: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 16, padding: 18 },
  revenueItem: { flex: 1, alignItems: 'center' },
  revenueDivider: { width: 1, backgroundColor: '#334155', marginHorizontal: 8 },
  revenueLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 4 },
  revenueValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
