import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface PairedDevice {
  id: string;
  name: string;
  status: 'connected' | 'pairing' | 'disconnected';
  battery: number;
  isMain: boolean;
}

export default function MultiPhonePairingScreen() {
  const router = useRouter();
  const [devices, setDevices] = useState<PairedDevice[]>([
    { id: 'local', name: 'This Phone', status: 'connected', battery: 85, isMain: true },
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  const maxDevices = 6; // Based on tier

  const startScan = () => {
    setIsScanning(true);
    // Simulate finding devices
    setTimeout(() => {
      const newDevice: PairedDevice = {
        id: `device_${Date.now()}`,
        name: `Phone ${devices.length + 1}`,
        status: 'pairing',
        battery: 72,
        isMain: false,
      };
      setDevices((prev) => [...prev, newDevice]);
      setIsScanning(false);

      setTimeout(() => {
        setDevices((prev) =>
          prev.map((d) => (d.id === newDevice.id ? { ...d, status: 'connected' } : d))
        );
      }, 2000);
    }, 3000);
  };

  const disconnectDevice = (deviceId: string) => {
    Alert.alert('Disconnect?', 'Remove this phone from the studio?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => setDevices((prev) => prev.filter((d) => d.id !== deviceId)),
      },
    ]);
  };

  const setMainDevice = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) => ({ ...d, isMain: d.id === deviceId }))
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#22C55E';
      case 'pairing': return '#F59E0B';
      case 'disconnected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📱 Connect Phones</Text>
        <Text style={styles.headerSubtitle}>{devices.length}/{maxDevices} connected</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* QR Code Section */}
        <View style={styles.qrCard}>
          <Ionicons name="qr-code" size={48} color="#3B82F6" />
          <Text style={styles.qrTitle}>Scan to Join Studio</Text>
          <Text style={styles.qrSubtitle}>
            Other phones scan this QR to connect as a camera angle
          </Text>
          <TouchableOpacity style={styles.qrBtn} onPress={() => setQrVisible(!qrVisible)}>
            <Ionicons name={qrVisible ? "eye-off" : "eye"} size={18} color="#3B82F6" />
            <Text style={styles.qrBtnText}>{qrVisible ? 'Hide QR' : 'Show QR Code'}</Text>
          </TouchableOpacity>
          {qrVisible && (
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderText}>QR_CODE_PLACEHOLDER</Text>
            </View>
          )}
        </View>

        {/* Device List */}
        <Text style={styles.sectionTitle}>Connected Devices</Text>
        {devices.map((device) => (
          <View key={device.id} style={styles.deviceCard}>
            <View style={styles.deviceLeft}>
              <View style={[styles.deviceIcon, { backgroundColor: getStatusColor(device.status) + '20' }]}>
                <Ionicons name="phone-portrait" size={22} color={getStatusColor(device.status)} />
              </View>
              <View>
                <Text style={styles.deviceName}>{device.name}</Text>
                <View style={styles.deviceMeta}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(device.status) }]} />
                  <Text style={styles.deviceStatus}>{device.status}</Text>
                  <Text style={styles.deviceDot}>•</Text>
                  <Ionicons name="battery-half" size={12} color="#64748B" />
                  <Text style={styles.deviceBattery}>{device.battery}%</Text>
                </View>
              </View>
            </View>
            <View style={styles.deviceActions}>
              {device.isMain ? (
                <View style={styles.mainBadge}>
                  <Text style={styles.mainBadgeText}>MAIN</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.actionBtn} onPress={() => setMainDevice(device.id)}>
                  <Text style={styles.actionBtnText}>Set Main</Text>
                </TouchableOpacity>
              )}
              {device.id !== 'local' && (
                <TouchableOpacity style={styles.disconnectBtn} onPress={() => disconnectDevice(device.id)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* Scan Button */}
        {devices.length < maxDevices && (
          <TouchableOpacity
            style={[styles.scanBtn, isScanning && styles.scanBtnActive]}
            onPress={startScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <Ionicons name="radio" size={20} color="#3B82F6" />
                <Text style={styles.scanBtnText}>Scanning for devices...</Text>
              </>
            ) : (
              <>
                <Ionicons name="scan" size={20} color="#22C55E" />
                <Text style={styles.scanBtnText}>Scan for Nearby Phones</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {devices.length >= maxDevices && (
          <View style={styles.limitCard}>
            <Ionicons name="lock-closed" size={20} color="#F59E0B" />
            <Text style={styles.limitText}>Maximum {maxDevices} devices reached. Upgrade to add more.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  backBtn: { padding: 8, alignSelf: 'flex-start' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', marginTop: 4 },
  headerSubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  qrCard: {
    backgroundColor: '#1E293B', borderRadius: 16,
    marginHorizontal: 16, marginTop: 12, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#334155',
  },
  qrTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginTop: 12 },
  qrSubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  qrBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 14, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#0F172A', borderRadius: 10, borderWidth: 1, borderColor: '#334155',
  },
  qrBtnText: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },
  qrPlaceholder: {
    marginTop: 14, width: 180, height: 180,
    backgroundColor: '#0F172A', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#334155',
  },
  qrPlaceholderText: { fontSize: 11, color: '#475569', fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  deviceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1E293B', marginHorizontal: 16, marginBottom: 10,
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#334155',
  },
  deviceLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deviceIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  deviceName: { fontSize: 15, fontWeight: '600', color: '#F1F5F9' },
  deviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  deviceStatus: { fontSize: 12, color: '#94A3B8', textTransform: 'capitalize' },
  deviceDot: { fontSize: 12, color: '#475569' },
  deviceBattery: { fontSize: 12, color: '#64748B' },
  deviceActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mainBadge: {
    backgroundColor: '#3B82F620', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, borderColor: '#3B82F640',
  },
  mainBadgeText: { fontSize: 10, color: '#3B82F6', fontWeight: '800' },
  actionBtn: {
    backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: '#334155',
  },
  actionBtnText: { fontSize: 12, color: '#3B82F6', fontWeight: '600' },
  disconnectBtn: { padding: 4 },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginTop: 16,
    paddingVertical: 16, backgroundColor: '#1E293B', borderRadius: 14,
    borderWidth: 1, borderColor: '#22C55E40',
  },
  scanBtnActive: { borderColor: '#3B82F640' },
  scanBtnText: { fontSize: 15, color: '#22C55E', fontWeight: '600' },
  limitCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 16, padding: 14,
    backgroundColor: '#F59E0B15', borderRadius: 12, borderWidth: 1, borderColor: '#F59E0B30',
  },
  limitText: { flex: 1, fontSize: 13, color: '#F59E0B', fontWeight: '600' },
});
