/**
 * MTAA OS — Launcher Grid (React Native)
 * Core system apps loaded from registry. NOT hardcoded manually.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useInstalledApps } from '@/hooks/useInstalledApps';
import { AppManifest } from '@/lib/kernel/registry/kernel-registry';

export function OSLauncherGrid() {
  const router = useRouter();
  const { apps, isLoading } = useInstalledApps();

  if (isLoading) {
    return (
      <View style={styles.grid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={styles.skeleton}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonText} />
          </View>
        ))}
      </View>
    );
  }

  const sorted = [...apps].sort((a, b) => {
    if (a.systemApp && !b.systemApp) return -1;
    if (!a.systemApp && b.systemApp) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>APPS</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/launcher')}>
          <Text style={styles.seeAll}>See All →</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {sorted.slice(0, 10).map((app) => (
          <AppIcon key={app.id} app={app} onPress={() => router.push(`/${app.domain}`)} />
        ))}
      </View>
    </View>
  );
}

function AppIcon({ app, onPress }: { app: AppManifest; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.appBtn} activeOpacity={0.7}>
      <View style={[styles.appIcon, { backgroundColor: app.color || '#475569' }]}>
        <Text style={styles.appIconText}>{app.icon || '◆'}</Text>
      </View>
      <Text style={styles.appLabel}>{app.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 16, marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  seeAll: { fontSize: 12, color: '#60a5fa' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  appBtn: { width: '22%', alignItems: 'center', paddingVertical: 8 },
  appIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  appIconText: { fontSize: 20 },
  appLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  skeleton: { width: '22%', alignItems: 'center', paddingVertical: 8 },
  skeletonIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 4 },
  skeletonText: { width: 40, height: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
});
