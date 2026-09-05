// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';

export default function NetworkSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [network, setNetwork] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [battery, setBattery] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const [netState, locState, batLevel] = await Promise.all([
          Network.getNetworkStateAsync(),
          Location.getPermissionsAsync().then(p => p.granted ? Location.getCurrentPositionAsync({}) : null),
          Battery.getBatteryLevelAsync(),
        ]);

        setNetwork({
          type: netState.type || 'unknown',
          isConnected: netState.isConnected || false,
          isInternetReachable: netState.isInternetReachable || false,
        });

        setLocation(locState ? {
          latitude: locState.coords.latitude.toFixed(4),
          longitude: locState.coords.longitude.toFixed(4),
          granted: true,
        } : { granted: false });

        setBattery({
          level: Math.round(batLevel * 100),
          isCharging: await Battery.isBatteryChargingAsync(),
        });
      } catch (err) {
        console.warn('Device API error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#0ea5e9" /></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Network & Device</Text>

      <View style={s.card}>
        <Text style={s.cardTitle}>Network</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>Type</Text>
          <Text style={s.rowValue}>{network?.type || 'Unknown'}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>Connected</Text>
          <Ionicons name={network?.isConnected ? 'checkmark-circle' : 'close-circle'} size={20} color={network?.isConnected ? '#10b981' : '#ef4444'} />
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>Internet</Text>
          <Ionicons name={network?.isInternetReachable ? 'wifi' : 'cloud-offline'} size={20} color={network?.isInternetReachable ? '#10b981' : '#ef4444'} />
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Location</Text>
        {location?.granted ? (
          <>
            <View style={s.row}>
              <Text style={s.rowLabel}>Latitude</Text>
              <Text style={s.rowValue}>{location.latitude}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLabel}>Longitude</Text>
              <Text style={s.rowValue}>{location.longitude}</Text>
            </View>
          </>
        ) : (
          <Text style={s.hint}>Location permission not granted</Text>
        )}
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Battery</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>Level</Text>
          <Text style={s.rowValue}>{battery?.level || 0}%</Text>
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>Charging</Text>
          <Ionicons name={battery?.isCharging ? 'flash' : 'battery-full'} size={20} color={battery?.isCharging ? '#f59e0b' : '#64748b'} />
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { color: '#64748b' },
  rowValue: { color: '#0f172a', fontWeight: '600' },
  hint: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic' },
});
