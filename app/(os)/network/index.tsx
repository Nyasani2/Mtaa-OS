// app/(os)/network/index.tsx — MTAA OS Network
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NetworkScreen() {
  const router = useRouter();
  const [connected, setConnected] = useState(true);
  const [networkType, setNetworkType] = useState('Wi-Fi');
  const [signalStrength, setSignalStrength] = useState(4);
  const [dataUsage, setDataUsage] = useState({ used: 12.4, total: 50 });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Network</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.statusCard}>
        <Ionicons name={connected ? "wifi" : "wifi-outline"} size={48} color={connected ? "#2563eb" : "#9ca3af"} />
        <Text style={styles.statusTitle}>{connected ? 'Connected' : 'Disconnected'}</Text>
        <Text style={styles.statusSub}>{networkType} • {signalStrength}/5 bars</Text>
      </View>

      <View style={styles.dataCard}>
        <Text style={styles.cardTitle}>Data Usage</Text>
        <View style={styles.progressWrap}>
          <View style={[styles.progressBar, { width: `${(dataUsage.used / dataUsage.total) * 100}%` }]} />
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataText}>Used: {dataUsage.used} GB</Text>
          <Text style={styles.dataText}>Total: {dataUsage.total} GB</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setConnected(!connected)}>
          <Ionicons name={connected ? "wifi-off" : "wifi"} size={20} color="#fff" />
          <Text style={styles.actionText}>{connected ? 'Disconnect' : 'Connect'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  statusCard: { alignItems: 'center', padding: 24, margin: 16, backgroundColor: '#1e293b', borderRadius: 16 },
  statusTitle: { fontSize: 20, fontWeight: '700', color: '#f8fafc', marginTop: 16 },
  statusSub: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
  dataCard: { margin: 16, padding: 20, backgroundColor: '#1e293b', borderRadius: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginBottom: 16 },
  progressWrap: { height: 8, backgroundColor: '#334155', borderRadius: 4, marginBottom: 12 },
  progressBar: { height: 8, backgroundColor: '#2563eb', borderRadius: 4 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dataText: { fontSize: 13, color: '#94a3b8' },
  actions: { padding: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12 },
  actionText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
