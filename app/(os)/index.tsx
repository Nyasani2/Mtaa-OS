// app/(os)/index.tsx — MTAA OS Home
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useIdentity } from '@/lib/auth/identity';
import { useOSShell } from '@/lib/shell/use-os-shell';
import { useLauncher } from '@/lib/mtaa/appstore/launcher';
import { listApps } from '@/lib/mtaa/appstore/registry';
import type { AppManifest } from '@/types/module.types';

const { width } = Dimensions.get('window');
const COLS = 4;
const TILE = (width - 48) / COLS;

export default function OSHomeScreen() {
  const { user, isAuthenticated } = useIdentity();
  const { isReady } = useOSShell();
  const { launchApp, recentApps } = useLauncher();
  const apps = listApps();

  const renderAppTile = (app: AppManifest) => (
    <TouchableOpacity key={app.id} style={styles.tile} onPress={() => launchApp(app)}>
      <View style={[styles.icon, { backgroundColor: app.color || '#333' }]}>
        <Text style={styles.iconText}>{app.name[0]}</Text>
      </View>
      <Text style={styles.appName} numberOfLines={1}>{app.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {isAuthenticated ? `Welcome, ${user?.email?.split('@')[0]}` : 'Welcome to MTAA'}
        </Text>
        <Text style={styles.status}>{isReady ? '● Online' : '○ Initializing...'}</Text>
      </View>

      {recentApps.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentApps.map((id) => {
              const app = apps.find((a) => a.id === id);
              if (!app) return null;
              return (
                <TouchableOpacity key={id} style={styles.recentTile} onPress={() => launchApp(app)}>
                  <View style={[styles.recentIcon, { backgroundColor: app.color || '#333' }]}>
                    <Text style={styles.recentIconText}>{app.name[0]}</Text>
                  </View>
                  <Text style={styles.recentName}>{app.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apps</Text>
        <View style={styles.grid}>
          {apps.map(renderAppTile)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 48 },
  header: { paddingHorizontal: 16, marginBottom: 24 },
  greeting: { color: '#fff', fontSize: 24, fontWeight: '700' },
  status: { color: '#10B981', fontSize: 12, marginTop: 4, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#888', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 16, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  tile: { width: TILE, alignItems: 'center', marginBottom: 20 },
  icon: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  iconText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  appName: { color: '#ccc', fontSize: 11, textAlign: 'center', width: TILE - 8 },
  recentTile: { alignItems: 'center', marginRight: 16, width: 72 },
  recentIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  recentIconText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  recentName: { color: '#ccc', fontSize: 10, textAlign: 'center', width: 72 },
});
