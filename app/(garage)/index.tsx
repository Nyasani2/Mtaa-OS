import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useDeviceManager } from '@/lib/hooks/useDeviceManager';
import { useRecording } from '@/lib/hooks/useRecording';
import { useIncident } from '@/lib/hooks/useIncident';
import CameraCard from '@/lib/components/device/CameraCard';
import RecordingCard from '@/lib/components/device/RecordingCard';

export default function GarageScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { devices, vehicleDevices, loadDevices, loadVehicleDevices, isLoading: deviceLoading, error: deviceError } = useDeviceManager();
  const { recordings, loadRecordings, isLoading: recLoading, error: recError } = useRecording();
  const { incidents, loadIncidents, getIncidentStats, isLoading: incidentLoading, error: incidentError } = useIncident();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'recordings' | 'incidents' | 'diagnostics'>('vehicles');
  const [stats, setStats] = useState({ open: 0, critical: 0, today: 0 });

  useEffect(() => {
    loadDevices({ status: 'online' });
    loadRecordings({ limit: 10 });
    loadIncidents({ limit: 10 });
    getIncidentStats().then(setStats).catch(() => setStats({ open: 0, critical: 0, today: 0 }));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([
      loadDevices({ status: 'online' }),
      loadRecordings({ limit: 10 }),
      loadIncidents({ limit: 10 }),
      getIncidentStats().then(setStats).catch(() => setStats({ open: 0, critical: 0, today: 0 })),
    ]);
    setRefreshing(false);
  };

  const handleViewDiagnostics = (vehicleId: string) => {
    router.push(`/garage/diagnostics/${vehicleId}`);
  };

  const handleViewRecording = (recordingId: string) => {
    router.push(`/device/recording/${recordingId}`);
  };

  const handleReportIncident = () => {
    router.push('/garage/report-incident');
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔧 Garage</Text>
        <Text style={styles.headerSubtitle}>Vehicle diagnostics & camera management</Text>
      </View>

      <View style={styles.statsRow}>
        <StatBox label="Vehicles" value={devices.length} color="#3b82f6" icon="🚗" />
        <StatBox label="Recordings" value={recordings.length} color="#8b5cf6" icon="📹" />
        <StatBox label="Incidents" value={stats.open} color="#ef4444" icon="⚠️" />
        <StatBox label="Critical" value={stats.critical} color="#dc2626" icon="🚨" />
      </View>

      <View style={styles.tabRow}>
        {(['vehicles', 'recordings', 'incidents', 'diagnostics'] as const).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'vehicles' ? '🚗 Vehicles' : tab === 'recordings' ? '📹 Recordings' : tab === 'incidents' ? '⚠️ Incidents' : '🔍 Diagnostics'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'vehicles' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Cameras</Text>
          {deviceError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {deviceError}</Text>
            </View>
          )}
          {deviceLoading && devices.length === 0 ? (
            <ActivityIndicator color="#3b82f6" />
          ) : devices.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No vehicle cameras registered</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/device/register')}>
                <Text style={styles.actionBtnText}>+ Register Device</Text>
              </TouchableOpacity>
            </View>
          ) : (
            devices.map(device => (
              <CameraCard
                key={device.id}
                device={device}
                onPress={() => handleViewDiagnostics(device.id)}
                onSettings={() => router.push(`/device/${device.id}`)}
              />
            ))
          )}
        </View>
      )}

      {activeTab === 'recordings' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Recordings</Text>
          {recError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {recError}</Text>
            </View>
          )}
          {recLoading && recordings.length === 0 ? (
            <ActivityIndicator color="#3b82f6" />
          ) : recordings.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No recordings found</Text>
              <Text style={styles.emptySubtext}>Recordings appear automatically when trips start</Text>
            </View>
          ) : (
            recordings.map(rec => (
              <RecordingCard
                key={rec.id}
                recording={rec}
                onPress={() => handleViewRecording(rec.id)}
                onDownload={() => Alert.alert('Download', 'Downloading recording...')}
                onShare={() => Alert.alert('Share', 'Generating share link...')}
                onDelete={() => Alert.alert('Delete', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => {} },
                ])}
              />
            ))
          )}
        </View>
      )}

      {activeTab === 'incidents' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Incidents</Text>
          {incidentError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {incidentError}</Text>
            </View>
          )}
          {incidents.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No incidents reported</Text>
            </View>
          ) : (
            incidents.map(incident => (
              <TouchableOpacity key={incident.id} style={styles.incidentCard} onPress={() => router.push(`/incident/${incident.id}`)}>
                <View style={styles.incidentHeader}>
                  <Text style={styles.incidentIcon}>💥</Text>
                  <View style={styles.incidentInfo}>
                    <Text style={styles.incidentTitle} numberOfLines={1}>{incident.title}</Text>
                    <Text style={styles.incidentType}>{incident.incident_type} · {incident.severity}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: incident.status === 'open' ? '#ef4444' : '#22c55e' }]}>
                    <Text style={styles.statusText}>{incident.status}</Text>
                  </View>
                </View>
                <Text style={styles.incidentTime}>{new Date(incident.created_at).toLocaleString()}</Text>
              </TouchableOpacity>
            ))
          )}
          <TouchableOpacity style={styles.reportBtn} onPress={handleReportIncident}>
            <Text style={styles.reportText}>+ Report Incident</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'diagnostics' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OBD-II Diagnostics</Text>
          <View style={styles.diagCard}>
            <Text style={styles.diagIcon}>🔌</Text>
            <Text style={styles.diagTitle}>Connect OBD-II Scanner</Text>
            <Text style={styles.diagText}>Plug in your OBD-II device to read fault codes, monitor engine health, and view real-time vehicle data.</Text>
            <TouchableOpacity style={styles.diagBtn} onPress={() => Alert.alert('OBD-II', 'Scanning for OBD-II devices...')}>
              <Text style={styles.diagBtnText}>Scan for Devices</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.diagCard}>
            <Text style={styles.diagIcon}>📊</Text>
            <Text style={styles.diagTitle}>Diagnostic History</Text>
            <Text style={styles.diagText}>View past diagnostic reports, fault codes, and maintenance recommendations.</Text>
            <TouchableOpacity style={styles.diagBtn} onPress={() => router.push('/garage/diagnostics-history')}>
              <Text style={styles.diagBtnText}>View History</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function StatBox({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center' },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  tab: { flex: 1, backgroundColor: '#1e293b', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  tabActive: { backgroundColor: '#1e3a5f', borderColor: '#3b82f6' },
  tabText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: '#3b82f6' },
  section: { paddingHorizontal: 16, paddingBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0', marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#64748b', fontSize: 14 },
  emptySubtext: { color: '#475569', fontSize: 12, marginTop: 4 },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 10, padding: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  errorText: { color: '#fca5a5', fontSize: 13 },
  actionBtn: { backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, marginTop: 12 },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  incidentCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  incidentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  incidentIcon: { fontSize: 20, marginRight: 10 },
  incidentInfo: { flex: 1 },
  incidentTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  incidentType: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  incidentTime: { fontSize: 11, color: '#64748b' },
  reportBtn: { backgroundColor: '#ef4444', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 },
  reportText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  diagCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 12, alignItems: 'center' },
  diagIcon: { fontSize: 40, marginBottom: 10 },
  diagTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 6 },
  diagText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 14, lineHeight: 20 },
  diagBtn: { backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },
  diagBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
