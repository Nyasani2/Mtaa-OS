// @ts-nocheck
import { supabase } from '@/lib/supabase';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Car,
  Video,
  AlertTriangle,
  Activity,
  Plus,
  Camera,
  Wrench,
  ClipboardList,
  Truck,
  Package,
  User,
  TrendingUp,
  Settings,
  ChevronRight,
  QrCode,
  BarChart3,
  Shield,
  Clock,
} from 'lucide-react-native';
import { useDeviceManager } from '@/lib/hooks/useDeviceManager';
import { useRecording } from '@/lib/hooks/useRecording';
import { useIncident } from '@/lib/hooks/useIncident';
import { useGarage } from '@/lib/hooks/useGarage';
import { useAuthStore } from '@/lib/auth/store/auth.store';

/* ─────────────────────────── Types ─────────────────────────── */

type TabKey = 'vehicles' | 'recordings' | 'incidents' | 'diagnostics';

/* ─────────────────────────── Main Screen ─────────────────────────── */

export default function GarageHomeScreen() {


  const router = useRouter();
  const { user } = useAuthStore();
  const [myGarage, setMyGarage] = React.useState<any>(null);
  const [debugMsg, setDebugMsg] = useState('');
  React.useEffect(() => { (async () => {
    try {
      console.log('🔍 checking garage for user:', user?.id);
      const { data, error } = await supabase.from('mtaxi_garages').select('*').eq('owner_id', user?.id).maybeSingle();
      console.log('🔍 result:', { data, error });
      if (error) setDebugMsg('Error: ' + error.message);
      else if (data) { setMyGarage(data); setDebugMsg('Found: ' + data.name); }
      else setDebugMsg('No garage for user ' + user?.id);
    } catch (e) { setDebugMsg('Catch: ' + String(e)); }
  })(); }, [user?.id]);

  const { garage, loading: garageLoading, loadGarage } = useGarage();

  const [activeTab, setActiveTab] = useState<TabKey>('vehicles');
  const [refreshing, setRefreshing] = useState(false);

  /* ── Device / Recording / Incident hooks ── */
  const {
    devices,
    isLoading: deviceLoading,
    error: deviceError,
    loadDevices,
  } = useDeviceManager();

  const {
    recordings,
    isLoading: recordingLoading,
    error: recordingError,
    loadRecordings,
  } = useRecording();

  const {
    incidents,
    stats: incidentStats,
    isLoading: incidentLoading,
    error: incidentError,
    loadIncidents,
    getIncidentStats,
  } = useIncident();

  /* ── Load data ── */
  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      
      loadDevices({ status: 'online' }),
      loadRecordings({ limit: 10 }),
      loadIncidents({ limit: 10 }),
      getIncidentStats(),
    ]);
    setRefreshing(false);
  }, [loadGarage, loadDevices, loadRecordings, loadIncidents, getIncidentStats]);

  useEffect(() => {
    refreshAll();
  }, []);

  /* ── Stats ── */
  const stats = [
    { label: 'Devices', value: devices.length, icon: Car, color: '#3b82f6' },
    { label: 'Recordings', value: recordings.length, icon: Video, color: '#8b5cf6' },
    { label: 'Incidents', value: incidents.length, icon: AlertTriangle, color: '#ef4444' },
    { label: 'Open Cases', value: incidentStats?.open || 0, icon: Activity, color: '#f59e0b' },
  ];

  /* ── Quick Actions</Text>
      <TouchableOpacity onPress={() => router.push('/inspections')} style={{ backgroundColor: '#16a34a', borderRadius: 12, padding: 14, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>🔍 Vehicle Inspections — earn 50% per job</Text>
        <Text style={{ color: '#fff', fontSize: 18 }}>›</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 17, fontWeight: '700', marginBottom: 10 }}> ── */
  const quickActions = [
    {
      label: 'New Work Order',
      icon: ClipboardList,
      color: '#3b82f6',
      route: '/(garage)/appointments',
      badge: null,
    },
    {
      label: 'Diagnostics',
      icon: Wrench,
      color: '#8b5cf6',
      route: '/(garage)/diagnostics',
      badge: null,
    },
    {
      label: 'Inventory',
      icon: Package,
      color: '#22c55e',
      route: '/(garage)/inventory',
      badge: null,
    },
    {
      label: 'Fleet',
      icon: Truck,
      color: '#f59e0b',
      route: '/(garage)/fleet',
      badge: null,
    },
    {
      label: 'Dashboard',
      icon: BarChart3,
      color: '#06b6d4',
      route: '/(garage)/dashboard',
      badge: null,
    },
    {
      label: 'My Portal',
      icon: User,
      color: '#ec4899',
      route: '/(garage)/customer',
      badge: null,
    },
  ];

  /* ── Tab Content ── */
  const renderVehiclesTab = () => {
    if (deviceLoading && devices.length === 0) {
      return <ActivityIndicator style={styles.tabSpinner} color="#3b82f6" />;
    }
    if (deviceError) {
      return (
        <View style={styles.errorBox}>
          <AlertTriangle size={20} color="#ef4444" />
          <Text style={styles.errorText}>{deviceError}</Text>
        </View>
      );
    }
    if (devices.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <Car size={40} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Devices (optional add-on) — no cameras registered</Text>
          <Text style={styles.emptySubtitle}>Add a dashcam or security camera to monitor your vehicle.</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(garage)/onboarding' as any)}
          >
            <Plus size={16} color="#fff" />
            <Text style={styles.emptyButtonText}>Register Device</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.listContainer}>
        {devices.map((device) => (
          <View key={device.id} style={styles.deviceCard}>
            <View style={styles.deviceHeader}>
              <Car size={18} color="#3b82f6" />
              <Text style={styles.deviceName}>{device.name || 'Unnamed Device'}</Text>
              <View style={[styles.deviceStatus, { backgroundColor: device.status === 'online' ? '#dcfce7' : '#fee2e2' }]}>
                <View style={[styles.statusDot, { backgroundColor: device.status === 'online' ? '#22c55e' : '#ef4444' }]} />
                <Text style={[styles.statusLabel, { color: device.status === 'online' ? '#16a34a' : '#dc2626' }]}>
                  {device.status || 'offline'}
                </Text>
              </View>
            </View>
            <Text style={styles.deviceMeta}>{device.model || 'Unknown model'} · {device.location || 'No location'}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderRecordingsTab = () => {
    if (recordingLoading && recordings.length === 0) {
      return <ActivityIndicator style={styles.tabSpinner} color="#3b82f6" />;
    }
    if (recordingError) {
      return (
        <View style={styles.errorBox}>
          <AlertTriangle size={20} color="#ef4444" />
          <Text style={styles.errorText}>{recordingError}</Text>
        </View>
      );
    }
    if (recordings.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <Video size={40} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No recordings yet</Text>
          <Text style={styles.emptySubtitle}>Recordings from your cameras will appear here.</Text>
        </View>
      );
    }
    return (
      <View style={styles.listContainer}>
        {recordings.map((rec) => (
          <TouchableOpacity key={rec.id} style={styles.recordingCard}>
            <Video size={18} color="#8b5cf6" />
            <View style={styles.recordingInfo}>
              <Text style={styles.recordingTitle}>{rec.title || 'Recording'}</Text>
              <Text style={styles.recordingMeta}>{rec.duration || '—'} · {rec.file_size || '—'}</Text>
            </View>
            <ChevronRight size={16} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderIncidentsTab = () => {
    if (incidentLoading && incidents.length === 0) {
      return <ActivityIndicator style={styles.tabSpinner} color="#3b82f6" />;
    }
    if (incidentError) {
      return (
        <View style={styles.errorBox}>
          <AlertTriangle size={20} color="#ef4444" />
          <Text style={styles.errorText}>{incidentError}</Text>
        </View>
      );
    }
    if (incidents.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <Shield size={40} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No incidents reported</Text>
          <Text style={styles.emptySubtitle}>Your vehicles are safe. Incidents will appear here if detected.</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(garage)/appointments' as any)}
          >
            <Plus size={16} color="#fff" />
            <Text style={styles.emptyButtonText}>Report Incident</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.listContainer}>
        {incidents.map((inc) => (
          <View key={inc.id} style={styles.incidentCard}>
            <AlertTriangle size={18} color="#ef4444" />
            <View style={styles.incidentInfo}>
              <Text style={styles.incidentTitle}>{inc.type || 'Incident'}</Text>
              <Text style={styles.incidentMeta}>{inc.severity || 'unknown severity'} · {inc.status || 'open'}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderDiagnosticsTab = () => (
    <View style={styles.emptyTab}>
      <Wrench size={40} color="#d1d5db" />
      <Text style={styles.emptyTitle}>OBD-II Diagnostics</Text>
      <Text style={styles.emptySubtitle}>Connect to your vehicle and run full diagnostics.</Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/(garage)/diagnostics' as any)}
      >
        <Activity size={16} color="#fff" />
        <Text style={styles.emptyButtonText}>Launch Diagnostics</Text>
      </TouchableOpacity>
    </View>
  );

  /* ── Main Render ── */
  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor="#3b82f6" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Garage OS</Text>
            <Text style={styles.headerSubtitle}>
              {myGarage ? '✅ ' + myGarage.name + (myGarage.inspection_partner ? ' · Inspection Partner' : ' · Registered') : (garage?.name || (garageLoading ? 'Loading...' : 'Not registered'))}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/(garage)/onboarding' as any)}
          >
            <Settings size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <View key={stat.label} style={styles.statCard}>
                <Icon size={20} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <TouchableOpacity
                key={action.label}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                  <Icon size={22} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
                {action.badge && (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>{action.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {([
          { key: 'vehicles' as TabKey, label: 'Vehicles', icon: Car },
          { key: 'recordings' as TabKey, label: 'Recordings', icon: Video },
          { key: 'incidents' as TabKey, label: 'Incidents', icon: AlertTriangle },
          { key: 'diagnostics' as TabKey, label: 'Diagnostics', icon: Wrench },
        ]).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Icon size={16} color={isActive ? '#3b82f6' : '#9ca3af'} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'vehicles' && renderVehiclesTab()}
        {activeTab === 'recordings' && renderRecordingsTab()}
        {activeTab === 'incidents' && renderIncidentsTab()}
        {activeTab === 'diagnostics' && renderDiagnosticsTab()}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ─────────────────────────── Styles ─────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },

  /* Header */
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1f2937' },
  headerSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },

  /* Stats */
  statsGrid: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1f2937', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },

  /* Section */
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 },

  /* Quick Actions */
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '31%', backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', position: 'relative' },
  actionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },
  actionBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  actionBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  /* Tabs */
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
  tabItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginBottom: 8 },
  tabItemActive: { backgroundColor: '#eff6ff' },
  tabLabel: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
  tabLabelActive: { color: '#3b82f6' },
  tabContent: { minHeight: 200 },

  /* Tab Content */
  tabSpinner: { marginTop: 40 },
  listContainer: { padding: 16, gap: 10 },
  emptyTab: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#6b7280', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#9ca3af', marginTop: 6, textAlign: 'center' },
  emptyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 16 },
  emptyButtonText: { color: '#fff', fontWeight: '700', marginLeft: 8 },

  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', margin: 16, padding: 12, borderRadius: 10, gap: 8 },
  errorText: { fontSize: 13, color: '#ef4444', flex: 1 },

  /* Device Card */
  deviceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  deviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deviceName: { fontSize: 14, fontWeight: '700', color: '#1f2937', flex: 1 },
  deviceStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11, fontWeight: '600' },
  deviceMeta: { fontSize: 12, color: '#9ca3af', marginTop: 4, marginLeft: 26 },

  /* Recording Card */
  recordingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', gap: 12 },
  recordingInfo: { flex: 1 },
  recordingTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  recordingMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  /* Incident Card */
  incidentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', gap: 12 },
  incidentInfo: { flex: 1 },
  incidentTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  incidentMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
});
