// app/(os)/network/index.tsx — MTAA OS Network
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

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
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Network</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.statusCard}>
        <Ionicons name={connected ? "wifi" : "wifi-outline"} size={48} color={connected ? COLORS.primary : COLORS.textSecondary} />
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
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.md, paddingTop: SIZES.xl, paddingBottom: SIZES.md },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  statusCard: { alignItems: 'center', padding: SIZES.xl, margin: SIZES.md, backgroundColor: COLORS.surface, borderRadius: SIZES.lg },
  statusTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text, marginTop: SIZES.md },
  statusSub: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.textSecondary, marginTop: SIZES.sm },
  dataCard: { margin: SIZES.md, padding: SIZES.lg, backgroundColor: COLORS.surface, borderRadius: SIZES.lg },
  cardTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text, marginBottom: SIZES.md },
  progressWrap: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginBottom: SIZES.sm },
  progressBar: { height: 8, backgroundColor: COLORS.primary, borderRadius: 4 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dataText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textSecondary },
  actions: { padding: SIZES.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, paddingVertical: SIZES.md, borderRadius: SIZES.md },
  actionText: { fontFamily: FONTS.bold, fontSize: 16, color: '#fff' },
});
