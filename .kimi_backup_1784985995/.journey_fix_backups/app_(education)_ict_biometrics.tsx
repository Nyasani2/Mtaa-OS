import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function BiometricsScreen() {
  const router = useRouter();
  const [devices] = useState([
    { id: '1', name: 'Main Gate FP', type: 'fingerprint', status: 'online', lastSync: '2 min ago', users: 1240 },
    { id: '2', name: 'Class Block A', type: 'fingerprint', status: 'online', lastSync: '5 min ago', users: 450 },
    { id: '3', name: 'Library', type: 'face', status: 'online', lastSync: '1 min ago', users: 800 },
    { id: '4', name: 'Dining Hall', type: 'fingerprint', status: 'offline', lastSync: '2 hrs ago', users: 1200 },
    { id: '5', name: 'Staff Room', type: 'card', status: 'online', lastSync: '3 min ago', users: 65 },
  ]);

  const getIcon = (type: string) => { switch(type) { case 'fingerprint': return 'finger-print-outline'; case 'face': return 'scan-outline'; case 'card': return 'card-outline'; default: return 'hardware-chip-outline'; } };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Biometrics</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#10b98115' }]}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>4/5</Text>
          <Text style={styles.statLabel}>Online</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#3b82f615' }]}>
          <Text style={[styles.statValue, { color: '#3b82f6' }]}>3,755</Text>
          <Text style={styles.statLabel}>Enrolled</Text>
        </View>
      </View>
      <ScrollView style={styles.content}>
        {devices.map((device) => (
          <View key={device.id} style={styles.deviceCard}>
            <View style={[styles.deviceIcon, { backgroundColor: device.status === 'online' ? '#10b98115' : '#ef444415' }]}>
              <Ionicons name={getIcon(device.type)} size={24} color={device.status === 'online' ? '#10b981' : '#ef4444'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceName}>{device.name}</Text>
              <Text style={styles.deviceMeta}>{device.type} · {device.users} users</Text>
              <Text style={styles.deviceSync}>Last sync: {device.lastSync}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: device.status === 'online' ? '#10b98120' : '#ef444420' }]}>
              <Text style={[styles.statusText, { color: device.status === 'online' ? '#10b981' : '#ef4444' }]}>{device.status}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e3a5f', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  content: { paddingHorizontal: 16 },
  deviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  deviceIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  deviceName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  deviceMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  deviceSync: { fontSize: 11, color: '#cbd5e1', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});
