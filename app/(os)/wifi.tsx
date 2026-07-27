// app/(os)/wifi.tsx — MTAA OS Wi-Fi Manager
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '@/constants/theme';

interface Network {
  id: string;
  name: string;
  connected: boolean;
  signal: number;
  secured: boolean;
}

const NETWORKS: Network[] = [
  { id: '1', name: 'Home WiFi', connected: true, signal: 4, secured: true },
  { id: '2', name: 'Office 5G', connected: false, signal: 3, secured: true },
  { id: '3', name: 'Coffee Shop', connected: false, signal: 2, secured: false },
  { id: '4', name: 'Guest Network', connected: false, signal: 1, secured: true },
];

export default function WifiScreen() {
  const router = useRouter();
  const [wifiOn, setWifiOn] = useState(true);

  const renderSignalBars = (strength: number) => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
      {[1, 2, 3, 4].map((bar) => (
        <View
          key={bar}
          style={[
            styles.signalBar,
            bar <= strength && styles.signalActive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={COLORS?.text || '#1a1a1a'}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wi-Fi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Wi-Fi</Text>
          <Switch
            value={wifiOn}
            onValueChange={setWifiOn}
            trackColor={{ false: '#3A3A3C', true: COLORS?.primary || '#0A4DA6' }}
            thumbColor={wifiOn ? (COLORS?.primary || '#0A4DA6') : '#f4f3f4'}
          />
        </View>

        {wifiOn && (
          <View style={{ padding: SIZES?.md || 16 }}>
            <Text style={styles.sectionTitle}>Available Networks</Text>
            {NETWORKS.map((n) => (
              <TouchableOpacity key={n.id} style={styles.networkRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.networkName,
                      n.connected && styles.networkConnected,
                    ]}
                  >
                    {n.name}
                  </Text>
                  <Text style={styles.networkStatus}>
                    {n.connected ? 'Connected' : n.secured ? 'Secured' : 'Open'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {renderSignalBars(n.signal)}
                  <Ionicons
                    name="wifi"
                    size={20}
                    color={
                      n.connected
                        ? COLORS?.primary || '#0A4DA6'
                        : COLORS?.textLight || '#888888'
                    }
                  />
                  {n.secured && (
                    <Ionicons
                      name="lock-closed"
                      size={14}
                      color={COLORS?.textLight || '#888888'}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS?.background || '#f8f6f1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES?.md || 16,
    paddingTop: SIZES?.xl || 24,
    paddingBottom: SIZES?.md || 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: COLORS?.text || '#1a1a1a',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES?.lg || 20,
    backgroundColor: COLORS?.white || '#ffffff',
    marginHorizontal: SIZES?.md || 16,
    borderRadius: SIZES?.md || 16,
  },
  toggleLabel: {
    fontWeight: '700',
    fontSize: 16,
    color: COLORS?.text || '#1a1a1a',
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: COLORS?.text || '#1a1a1a',
    marginBottom: SIZES?.md || 16,
  },
  networkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES?.md || 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS?.border || '#e5e5e5',
  },
  networkName: {
    fontWeight: '500',
    fontSize: 15,
    color: COLORS?.text || '#1a1a1a',
  },
  networkConnected: {
    color: COLORS?.primary || '#0A4DA6',
    fontWeight: '700',
  },
  networkStatus: {
    fontWeight: '400',
    fontSize: 12,
    color: COLORS?.textLight || '#888888',
    marginTop: 2,
  },
  signalBar: {
    width: 4,
    height: 8,
    backgroundColor: COLORS?.border || '#e5e5e5',
    borderRadius: 1,
  },
  signalActive: {
    backgroundColor: COLORS?.primary || '#0A4DA6',
  },
});
