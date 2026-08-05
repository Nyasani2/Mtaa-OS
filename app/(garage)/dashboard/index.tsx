import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useGarage } from '@/lib/hooks/useGarage';
import { useAppointments } from '@/lib/hooks/useAppointments';
import {
  Wrench, Calendar, Search, TrendingUp, AlertTriangle,
  ChevronRight, DollarSign, Clock, Car, Shield, FileText
} from 'lucide-react-native';

export default function GarageDashboard() {
  const router = useRouter();
  const { garage, loading: garageLoading } = useGarage();
  const { appointments, stats, loading: apptLoading, refreshAppointments } = useAppointments();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAppointments();
    setRefreshing(false);
  };

  const loading = garageLoading || apptLoading;

  const quickActions = [
    { icon: '\u{1F4C5}', label: 'New Appointment', color: '#3b82f6', route: '/(garage)/appointments' },
    { icon: '\u{1F50D}', label: 'Scan Vehicle', color: '#8b5cf6', route: '/(garage)/diagnostics' },
    { icon: '\u{1F468}\u{200D}\u{1F527}', label: 'Add Mechanic', color: '#06b6d4', alert: 'Mechanic management coming in v2.1' },
    { icon: '\u{1F4E6}', label: 'Order Parts', color: '#f59e0b', route: '/(garage)/inventory' },
    { icon: '\u{1F4CB}', label: 'Roadworthy', color: '#22c55e', alert: 'Compliance module coming in v2.1' },
    { icon: '\u{1F4CA}', label: 'Reports', color: '#ec4899', alert: 'Reports module coming in v2.1' },
  ];

  const handleAction = (action: typeof quickActions[0]) => {
    if (action.alert) { Alert.alert('Coming Soon', action.alert); return; }
    if (action.route) router.push(action.route as any);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.isLoadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!garage) {
    return (
      <View style={styles.center}>
        <Wrench size={48} color="#9ca3af" />
        <Text style={styles.emptyTitle}>No Garage Registered</Text>
        <Text style={styles.emptyText}>Register your garage to access the dashboard.</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/(garage)/onboarding')}>
          <Text style={styles.ctaText}>Register Garage</Text>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const inProgressCount = appointments.filter(a => a.status === 'in_progress').length;
  const readyCount = appointments.filter(a => a.status === 'ready_for_pickup').length;
  const todayCount = appointments.filter(a => {
    const today = new Date().toISOString().split('T')[0];
    return a.scheduled_date === today;
  }).length;

  const recentAppointments = appointments
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Garage Dashboard</Text>
            <Text style={styles.myGarageName}>{garage.name}</Text>
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={() => router.push('/(garage)/appointments')}>
            <Search size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsGrid}>
          <StatCard icon={<Clock size={20} color="#f59e0b" />} label="Pending" value={pendingCount} color="#f59e0b" />
          <StatCard icon={<Wrench size={20} color="#3b82f6" />} label="In Progress" value={inProgressCount} color="#3b82f6" />
          <StatCard icon={<Car size={20} color="#22c55e" />} label="Ready" value={readyCount} color="#22c55e" />
          <StatCard icon={<Calendar size={20} color="#8b5cf6" />} label="Today" value={todayCount} color="#8b5cf6" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, i) => (
            <TouchableOpacity key={i} style={[styles.actionBtn, { backgroundColor: action.color + '15', borderColor: action.color + '30' }]} onPress={() => handleAction(action)}>
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alerts</Text>
        {pendingCount > 0 ? (
          <TouchableOpacity style={[styles.alertCard, { borderLeftColor: '#f59e0b' }]} onPress={() => router.push('/(garage)/appointments')}>
            <AlertTriangle size={20} color="#f59e0b" />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{pendingCount} Pending Approval</Text>
              <Text style={styles.alertText}>Work orders awaiting customer approval</Text>
            </View>
            <ChevronRight size={18} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
        {readyCount > 0 ? (
          <TouchableOpacity style={[styles.alertCard, { borderLeftColor: '#ef4444' }]} onPress={() => router.push('/(garage)/appointments')}>
            <Car size={20} color="#ef4444" />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{readyCount} Ready for Pickup</Text>
              <Text style={styles.alertText}>Vehicles completed, awaiting customer</Text>
            </View>
            <ChevronRight size={18} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
        {pendingCount === 0 && readyCount === 0 && (
          <View style={styles.emptyAlert}>
            <Shield size={24} color="#22c55e" />
            <Text style={styles.emptyAlertText}>All clear - no alerts</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Work Orders</Text>
          <TouchableOpacity onPress={() => router.push('/(garage)/appointments')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {recentAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={32} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No work orders yet</Text>
            <TouchableOpacity style={styles.emptyCta} onPress={() => router.push('/(garage)/appointments')}>
              <Text style={styles.emptyCtaText}>Create First Work Order</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentAppointments.map((appt) => (
            <TouchableOpacity key={appt.id} style={styles.apptCard} onPress={() => router.push(`/(garage)/appointments/${appt.id}` as any)}>
              <View style={styles.apptLeft}>
                <View style={[styles.apptIcon, { backgroundColor: getStatusColor(appt.status) + '15' }]}>
                  <Car size={18} color={getStatusColor(appt.status)} />
                </View>
                <View>
                  <Text style={styles.apptPlate}>{appt.vehicle_plate || 'Unknown'}</Text>
                  <Text style={styles.apptService}>{appt.service_type}</Text>
                  <Text style={styles.apptDate}>{formatDate(appt.scheduled_date)}</Text>
                </View>
              </View>
              <View style={styles.apptRight}>
                <StatusBadge status={appt.status} />
                <ChevronRight size={16} color="#d1d5db" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Revenue Summary</Text>
        <View style={styles.revenueCard}>
          <View style={styles.revenueRow}>
            <View style={styles.revenueItem}>
              <DollarSign size={18} color="#22c55e" />
              <Text style={styles.revenueLabel}>This Month</Text>
              <Text style={styles.revenueValue}>KES {stats?.monthlyRevenue?.toLocaleString() || '0'}</Text>
            </View>
            <View style={styles.revenueDivider} />
            <View style={styles.revenueItem}>
              <TrendingUp size={18} color="#3b82f6" />
              <Text style={styles.revenueLabel}>Total Jobs</Text>
              <Text style={styles.revenueValue}>{stats?.totalJobs || '0'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      {icon}
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: '#f59e0b', in_progress: '#3b82f6', ready_for_pickup: '#22c55e',
    completed: '#6b7280', cancelled: '#ef4444',
  };
  const labels: Record<string, string> = {
    pending: 'Pending', in_progress: 'In Progress', ready_for_pickup: 'Ready',
    completed: 'Done', cancelled: 'Cancelled',
  };
  return (
    <View style={[styles.badge, { backgroundColor: colors[status] + '15' }]}>
      <Text style={[styles.badgeText, { color: colors[status] }]}>{labels[status] || status}</Text>
    </View>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#f59e0b', in_progress: '#3b82f6', ready_for_pickup: '#22c55e',
    completed: '#6b7280', cancelled: '#ef4444',
  };
  return colors[status] || '#6b7280';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 8, textAlign: 'center' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 14, color: '#6b7280' },
  garageName: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 2 },
  searchBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, alignItems: 'center', borderTopWidth: 3 },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { fontSize: 13, color: '#3b82f6', fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { width: '30%', aspectRatio: 1, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 11, fontWeight: '600', marginTop: 6, textAlign: 'center' },
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  alertContent: { flex: 1, marginLeft: 12 },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  alertText: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  emptyAlert: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#f0fdf4', borderRadius: 12 },
  emptyAlertText: { fontSize: 14, color: '#22c55e', marginLeft: 8, fontWeight: '600' },
  apptCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  apptLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  apptIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  apptPlate: { fontSize: 14, fontWeight: '700', color: '#111827' },
  apptService: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  apptDate: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  apptRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderRadius: 16 },
  emptyStateText: { fontSize: 14, color: '#9ca3af', marginTop: 12 },
  emptyCta: { marginTop: 16, backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyCtaText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  revenueCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  revenueRow: { flexDirection: 'row', alignItems: 'center' },
  revenueItem: { flex: 1, alignItems: 'center' },
  revenueDivider: { width: 1, height: 40, backgroundColor: '#e5e7eb' },
  revenueLabel: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  revenueValue: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 2 },
  ctaButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 20 },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 15, marginRight: 8 },
});
