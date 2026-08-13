// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useDeviceManager } from '@/lib/hooks/useDeviceManager';
import { useRecording } from '@/lib/hooks/useRecording';
import { useIncident } from '@/lib/hooks/useIncident';

export default function FleetStatusScreen() {
  const { devices, loadDevices, isLoading: devLoading } = useDeviceManager();
  const { recordings, loadStorageStats, storageStats, isLoading: recLoading } = useRecording();
  const { incidents, getIncidentStats } = useIncident();

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ open: 0, critical: 0, today: 0 });

  useEffect(() => {
    loadDevices();
    loadStorageStats();
    getIncidentStats().then(setStats);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadDevices(), loadStorageStats(), getIncidentStats().then(setStats)]);
    setRefreshing(false);
  };

  const onlineDevices = devices.filter((d: any) => d.status === 'online');
  const offlineDevices = devices.filter((d: any) => d.status === 'offline');
  const errorDevices = devices.filter((d: any) => d.status === 'error');
  const degradedDevices = devices.filter((d: any) => d.camera_health === 'degraded' || d.camera_health === 'failed');

  const lowBattery = devices.filter((d: any) => (d.battery_level || 0) < 20);
  const lowStorage = devices.filter((d: any) => (d.storage_remaining_gb || 0) < 5);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚛 Fleet Status</Text>
        <Text style={styles.headerSubtitle}>Real-time fleet monitoring dashboard</Text>
      </View>

      {/* Top Stats */}
      <View style={styles.grid}>
        <StatusCard icon="🟢" label="Online" value={onlineDevices.length} color="#22c55e" />
        <StatusCard icon="🔴" label="Offline" value={offlineDevices.length} color="#ef4444" />
        <StatusCard icon="⚠️" label="Errors" value={errorDevices.length} color="#f59e0b" />
        <StatusCard icon="🎥" label="Recording" value={recordings.filter((r: any) => r.upload_status === 'uploading').length} color="#3b82f6" />
        <StatusCard icon="🚨" label="Incidents" value={stats.open} color="#dc2626" />
        <StatusCard icon="🔴" label="Critical" value={stats.critical} color="#dc2626" />
      </View>

      {/* Storage Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💾 Storage Overview</Text>
        <View style={styles.storageCard}>
          <View style={styles.storageBar}>
            <View style={[styles.storageFill, { width: `${storageStats ? (storageStats.totalGB / storageStats.totalGB) * 100 : 0}%` }]} />
          </View>
          <View style={styles.storageInfo}>
            <Text style={styles.storageText}>Used: {storageStats?.usedGB || 0} GB</Text>
            <Text style={styles.storageText}>Available: {storageStats?.availableGB || 0} GB</Text>
            <Text style={styles.storageText}>Total: {storageStats?.totalGB || 100} GB</Text>
          </View>
        </View>
      </View>

      {/* Device Health */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏥 Device Health</Text>
        {degradedDevices.length === 0 ? (
          <View style={styles.healthyCard}>
            <Text style={styles.healthyIcon}>✅</Text>
            <Text style={styles.healthyText}>All devices healthy</Text>
          </View>
        ) : (
          degradedDevices.map((d: any) => (
            <View key={d.id} style={styles.healthCard}>
              <Text style={styles.healthIcon}>⚠️</Text>
              <View style={styles.healthInfo}>
                <Text style={styles.healthName}>{d.name}</Text>
                <Text style={styles.healthStatus}>{d.camera_health} · {d.status}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Active Alerts</Text>
        {lowBattery.length === 0 && lowStorage.length === 0 ? (
          <View style={styles.healthyCard}>
            <Text style={styles.healthyIcon}>🔋</Text>
            <Text style={styles.healthyText}>No active alerts</Text>
          </View>
        ) : (
          <>
            {lowBattery.map((d: any) => (
              <AlertCard key={`bat-${d.id}`} icon="🔋" title={`${d.name} — Low Battery`} detail={`${d.battery_level}% remaining`} color="#ef4444" />
            ))}
            {lowStorage.map((d: any) => (
              <AlertCard key={`stor-${d.id}`} icon="💾" title={`${d.name} — Low Storage`} detail={`${d.storage_remaining_gb}GB remaining`} color="#f59e0b" />
            ))}
          </>
        )}
      </View>

      {/* Connectivity Map Placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗺️ Connectivity Map</Text>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapText}>Live fleet map</Text>
          <Text style={styles.mapSubtext}>Showing {onlineDevices.length} online vehicles</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function StatusCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={styles.statusCard}>
      <Text style={styles.statusIcon}>{icon}</Text>
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

function AlertCard({ icon, title, detail, color }: { icon: string; title: string; detail: string; color: string }) {
  return (
    <View style={[styles.alertCard, { borderLeftColor: color }]}>
      <Text style={styles.alertIcon}>{icon}</Text>
      <View style={styles.alertInfo}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertDetail}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 20 },
  statusCard: { width: '31%', backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 8 },
  statusIcon: { fontSize: 20, marginBottom: 4 },
  statusValue: { fontSize: 22, fontWeight: '800' },
  statusLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0', marginBottom: 12 },
  storageCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16 },
  storageBar: { height: 8, backgroundColor: '#334155', borderRadius: 4, marginBottom: 12, overflow: 'hidden' },
  storageFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 4 },
  storageInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  storageText: { fontSize: 12, color: '#94a3b8' },
  healthyCard: { backgroundColor: '#064e3b', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center' },
  healthyIcon: { fontSize: 20, marginRight: 10 },
  healthyText: { color: '#86efac', fontSize: 14, fontWeight: '600' },
  healthCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#f59e0b' },
  healthIcon: { fontSize: 20, marginRight: 10 },
  healthInfo: { flex: 1 },
  healthName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  healthStatus: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  alertCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderLeftWidth: 3 },
  alertIcon: { fontSize: 20, marginRight: 10 },
  alertInfo: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  alertDetail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  mapPlaceholder: { backgroundColor: '#1e293b', borderRadius: 16, height: 200, justifyContent: 'center', alignItems: 'center' },
  mapIcon: { fontSize: 40, marginBottom: 8 },
  mapText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  mapSubtext: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
});
