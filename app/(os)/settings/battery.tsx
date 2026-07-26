import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function BatterySettingsScreen() {
  const router = useRouter();
  const [batteryLevel, setBatteryLevel] = useState(72);
  const [isCharging, setIsCharging] = useState(false);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [batteryHealth] = useState('Good');
  const [screenOnTime] = useState('4h 23m');

  const appUsage = [
    { name: 'Streets', percent: 28, time: '1h 12m', color: '#3B82F6' },
    { name: 'Wallet', percent: 22, time: '58m', color: '#10B981' },
    { name: 'MTaxi', percent: 15, time: '39m', color: '#06B6D4' },
    { name: 'Health', percent: 12, time: '31m', color: '#EF4444' },
    { name: 'System', percent: 23, time: '1h 3m', color: '#64748B' },
  ];

  useEffect(() => {
    async function loadBattery() {
      try {
// eslint-disable-next-line @typescript-eslint/no-var-requires
        const Battery = require('expo-battery');
        const level = await Battery.getBatteryLevelAsync?.().catch(() => 0.72);
        const state = await Battery.getBatteryStateAsync?.().catch(() => 1);
        const lowPower = await Battery.isLowPowerModeEnabledAsync?.().catch(() => false);
        setBatteryLevel(Math.round((level ?? 0.72) * 100));
        setIsCharging(state === 2);
        setLowPowerMode(lowPower ?? false);
      } catch {}
    }
    loadBattery();
  }, []);

  const getBatteryColor = () => {
    if (batteryLevel <= 20) return '#EF4444';
    if (batteryLevel <= 50) return '#F59E0B';
    return '#10B981';
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Battery</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.statusCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[s.batteryIcon, { borderColor: getBatteryColor() }]}>
              <Text style={[s.batteryPercent, { color: getBatteryColor() }]}>{batteryLevel}%</Text>
            </View>
            <View style={{ marginLeft: 20 }}>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>
                {isCharging ? 'Charging' : batteryLevel <= 20 ? 'Low Battery' : 'Normal'}
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 4 }}>
                {isCharging ? 'Plugged in · Fast charging' : `${screenOnTime} screen on time`}
              </Text>
            </View>
          </View>
          <View style={{ height: 8, backgroundColor: '#334155', borderRadius: 4, marginTop: 20, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${batteryLevel}%`, backgroundColor: getBatteryColor(), borderRadius: 4 }} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>BATTERY HEALTH</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Ionicons name="heart-outline" size={20} color="#EF4444" style={{ marginRight: 12 }} />
              <Text style={s.rowText}>Battery Health</Text>
              <Text style={{ color: '#10B981', fontSize: 14 }}>{batteryHealth}</Text>
            </View>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Ionicons name="time-outline" size={20} color="#64748B" style={{ marginRight: 12 }} />
              <Text style={s.rowText}>Last Full Charge</Text>
              <Text style={{ color: '#94A3B8', fontSize: 14 }}>Today, 6:00 AM</Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>POWER SAVING</Text>
          <View style={s.card}>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Ionicons name="flash-outline" size={20} color="#F59E0B" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>Low Power Mode</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Reduce background activity</Text>
              </View>
              <Switch value={lowPowerMode} onValueChange={setLowPowerMode}
                trackColor={{ false: '#334155', true: '#F59E0B' }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>APP BATTERY USAGE (LAST 24H)</Text>
          <View style={s.card}>
            {appUsage.map((app, i) => (
              <View key={app.name} style={[s.row, i === appUsage.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: app.color, marginRight: 12 }} />
                <Text style={s.rowText}>{app.name}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 14 }}>{app.time}</Text>
                <View style={{ width: 40, alignItems: 'flex-end' }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{app.percent}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  statusCard: { marginHorizontal: 16, marginTop: 8, padding: 24, backgroundColor: '#1E293B', borderRadius: 16 },
  batteryIcon: { width: 64, height: 100, borderRadius: 12, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  batteryPercent: { fontSize: 20, fontWeight: '700' },
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  card: { backgroundColor: '#1E293B', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#334155' },
  rowText: { flex: 1, fontSize: 16, color: '#fff' },
});