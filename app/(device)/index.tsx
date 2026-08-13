// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useDeviceManager } from '@/lib/hooks/useDeviceManager';
import CameraCard from '@/lib/components/device/CameraCard';
import DeviceTile from '@/lib/components/device/DeviceTile';

export default function DeviceManagerScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    devices, isLoading, error, loadDevices, createDevice, editDevice,
    removeDevice, reconnect, deviceTypes, connectionTypes, clearError
  } = useDeviceManager();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  useEffect(() => { loadDevices(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDevices();
    setRefreshing(false);
  };

  const filteredDevices = selectedType
    ? devices.filter((d: any) => d.device_type === selectedType)
    : devices;

  const onlineCount = devices.filter((d: any) => d.status === 'online').length;
  const offlineCount = devices.filter((d: any) => d.status === 'offline').length;
  const errorCount = devices.filter((d: any) => d.status === 'error').length;

  const handleAddDevice = () => {
    Alert.alert('Add Device', 'Select device type:', [
      ...deviceTypes.map((t: any) => ({
        text: `${t.icon} ${t.name}`,
        onPress: () => {
          const deviceId = `DEV-${Date.now()}`;
          createDevice({
            device_id: deviceId, name: t.name, device_type: t.id,
            connection_type: 'bluetooth', status: 'pairing',
            camera_health: 'healthy', resolution_preference: '1080p',
            frame_rate: 30, audio_enabled: true, microphone_enabled: true,
            auto_upload: false, wifi_only_upload: true, encryption_enabled: true,
            gps_available: true,
          metadata: {},
          });
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDeleteDevice = (device: any) => {
    Alert.alert('Delete Device', `Remove ${device.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeDevice(device.id) },
    ]);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📹 Device Manager</Text>
        <Text style={styles.headerSubtitle}>{devices.length} devices · {onlineCount} online</Text>
      </View>

      <View style={styles.statsRow}>
        <StatBox label="Online" value={onlineCount} color="#22c55e" />
        <StatBox label="Offline" value={offlineCount} color="#ef4444" />
        <StatBox label="Errors" value={errorCount} color="#dc2626" />
        <StatBox label="Total" value={devices.length} color="#3b82f6" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll} contentContainerStyle={styles.typeContent}>
        <TouchableOpacity style={[styles.typeChip, !selectedType && styles.typeChipActive]} onPress={() => setSelectedType(null)}>
          <Text style={[styles.typeChipText, !selectedType && styles.typeChipTextActive]}>All</Text>
        </TouchableOpacity>
        {deviceTypes.map((t: any) => (
          <TouchableOpacity key={t.id} style={[styles.typeChip, selectedType === t.id && styles.typeChipActive]} onPress={() => setSelectedType(t.id)}>
            <Text style={styles.typeChipIcon}>{t.icon}</Text>
            <Text style={[styles.typeChipText, selectedType === t.id && styles.typeChipTextActive]}>{t.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && devices.length === 0 ? (
        <ActivityIndicator style={styles.loader} color="#3b82f6" />
      ) : filteredDevices.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyTitle}>No devices found</Text>
          <Text style={styles.emptyText}>Add your first camera or sensor</Text>
        </View>
      ) : (
        <View style={styles.deviceList}>
          {filteredDevices.map((device: any) => (
            <CameraCard
              key={device.id}
              device={device}
              onPress={() => setSelectedDevice(selectedDevice === device.id ? null : device.id)}
              onToggleLive={() => Alert.alert('Live Preview', `Starting live preview for ${device.name}`)}
              onToggleRecord={() => Alert.alert('Recording', `Toggle recording for ${device.name}`)}
              onSettings={() => router.push(`/device/${device.id}` as any)}
            />
          ))}
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.addBtn} onPress={handleAddDevice}>
        <Text style={styles.addText}>+ Add Device</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statBox}>
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
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  typeScroll: { maxHeight: 50, marginBottom: 16 },
  typeContent: { paddingHorizontal: 16, gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#334155' },
  typeChipActive: { backgroundColor: '#1e3a5f', borderColor: '#3b82f6' },
  typeChipIcon: { fontSize: 16, marginRight: 6 },
  typeChipText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  typeChipTextActive: { color: '#3b82f6' },
  loader: { marginTop: 40 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#64748b' },
  deviceList: { paddingHorizontal: 16 },
  error: { color: '#ef4444', textAlign: 'center', marginVertical: 16, paddingHorizontal: 16 },
  addBtn: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, margin: 16, alignItems: 'center' },
  addText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
