// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useASIS } from '@/lib/asis-v7/hooks/useAsis';
import { asisObserver } from '@/lib/kernel/asis/observer';

export default function ASISHUDScreen() {
  const router = useRouter();
  const { systemStatus, activeEngines, toolHealth } = useASIS();
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const orbScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    asisObserver.startObserving();
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbScale, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        Animated.timing(orbScale, { toValue: 1.0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    setActivityLog([
      { id: 1, type: 'SYS', message: 'ASIS v7 intelligence engine initialized', time: 'Now' },
      { id: 2, type: 'TOOL', message: 'kernel.launchApp(/(os)/wallet)', time: '2m ago' },
    ]);

    return () => { asisObserver.stopObserving(); };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ASIS Command Centre</Text>
        <Ionicons name="close" size={24} color="#94a3b8" onPress={() => router.back()} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.orbContainer}>
          <Animated.View style={[styles.orb, { transform: [{ scale: orbScale }] }]}>
            <Ionicons name="sparkles" size={48} color="#fff" />
          </Animated.View>
          <Text style={styles.status}>{systemStatus || 'Standby'}</Text>
          <Text style={styles.engines}>{activeEngines.join(' • ') || 'Standby'}</Text>
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>System Telemetry</Text>
          <View style={styles.statsRow}>
            <StatBox icon="battery-charging" label="Battery" value="72%" color="#10b981" />
            <StatBox icon="wifi" label="Network" value="5ms" color="#3b82f6" />
            <StatBox icon="server" label="Edge Health" value="100%" color="#8b5cf6" />
          </View>
        </View>
        <View style={styles.logPanel}>
          <Text style={styles.panelTitle}>Activity Stream</Text>
          <ScrollView style={styles.logScroll} showsVerticalScrollIndicator={false}>
            {activityLog.map((log) => (
              <View key={log.id} style={styles.logEntry}>
                <Text style={[styles.logType, log.type === 'SYS' ? styles.sysType : styles.toolType]}>{log.type}</Text>
                <Text style={styles.logMessage}>{log.message}</Text>
                <Text style={styles.logTime}>{log.time}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

function StatBox({ icon, label, value, color }: any) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#f8fafc', letterSpacing: 1 },
  content: { flex: 1, padding: 20 },
  orbContainer: { alignItems: 'center', marginVertical: 30 },
  orb: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', shadowColor: '#3b82f6', shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  status: { color: '#3b82f6', fontSize: 16, fontWeight: '700', marginTop: 16, letterSpacing: 1 },
  engines: { color: '#64748b', fontSize: 12, marginTop: 4 },
  panel: { backgroundColor: '#0f172a', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#1e293b' },
  panelTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statBox: { alignItems: 'center', width: '30%' },
  statValue: { color: '#f8fafc', fontSize: 16, fontWeight: '800', marginTop: 6 },
  statLabel: { color: '#64748b', fontSize: 10, marginTop: 2 },
  logPanel: { backgroundColor: '#0f172a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e293b', height: 300 },
  logScroll: { flex: 1 },
  logEntry: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  logType: { fontSize: 10, fontWeight: '800', width: 40, letterSpacing: 0.5 },
  sysType: { color: '#8b5cf6' },
  toolType: { color: '#3b82f6' },
  logMessage: { color: '#cbd5e1', fontSize: 13, flex: 1, marginLeft: 8 },
  logTime: { color: '#475569', fontSize: 11 },
});
