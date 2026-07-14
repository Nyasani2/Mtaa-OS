// app/(os)/wifi/index.tsx — MTAA OS WiFi Manager
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

const NETWORKS = [
  { ssid: 'MTAA_Home_5G', secure: true, strength: 4, connected: true },
  { ssid: 'MTAA_Office', secure: true, strength: 3, connected: false },
  { ssid: 'Safaricom_WiFi', secure: false, strength: 2, connected: false },
  { ssid: 'Airtel_Free', secure: false, strength: 1, connected: false },
];

export default function WiFiScreen() {
  const router = useRouter();
  const [wifiOn, setWifiOn] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wi-Fi</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Wi-Fi</Text>
        <Switch value={wifiOn} onValueChange={setWifiOn} trackColor={{ false: '#3A3A3C', true: COLORS.primary }} />
      </View>

      {wifiOn && (
        <View style={styles.networks}>
          <Text style={styles.sectionTitle}>Available Networks</Text>
          {NETWORKS.map(n => (
            <TouchableOpacity key={n.ssid} style={styles.networkRow}>
              <View style={styles.networkInfo}>
                <Ionicons name="wifi" size={20} color={n.connected ? COLORS.primary : COLORS.textSecondary} />
                <View style={{ marginLeft: SIZES.md }}>
                  <Text style={[styles.networkName, n.connected && styles.networkConnected]}>{n.ssid}</Text>
                  <Text style={styles.networkStatus}>{n.connected ? 'Connected' : n.secure ? 'Secured' : 'Open'}</Text>
                </View>
              </View>
              <View style={styles.signal}>
                {[1,2,3,4].map(bar => (
                  <View key={bar} style={[styles.signalBar, bar <= n.strength && styles.signalActive]} />
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.md, paddingTop: SIZES.xl, paddingBottom: SIZES.md },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.lg, backgroundColor: COLORS.surface, marginHorizontal: SIZES.md, borderRadius: SIZES.md },
  toggleLabel: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text },
  networks: { marginTop: SIZES.lg, paddingHorizontal: SIZES.md },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text, marginBottom: SIZES.md },
  networkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  networkInfo: { flexDirection: 'row', alignItems: 'center' },
  networkName: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.text },
  networkConnected: { color: COLORS.primary, fontFamily: FONTS.bold },
  networkStatus: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  signal: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  signalBar: { width: 4, height: 8, backgroundColor: COLORS.border, borderRadius: 1 },
  signalActive: { backgroundColor: COLORS.primary },
});
