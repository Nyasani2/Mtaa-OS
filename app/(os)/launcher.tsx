// @ts-nocheck
// app/(os)/launcher.tsx — App Launcher Screen
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppLock } from '@/lib/security/app-lock-provider';
import { Ionicons } from '@expo/vector-icons';
import { getAllApps, getAppById, AppManifest } from '@/lib/mtaa/appstore/unified-registry';

export default function LauncherScreen() {
  const { lock } = useAppLock(); {
  const router = useRouter();

  const launchApp = (app: AppManifest) => {
    console.log(`[Launcher] Opening ${app.name} at ${app.entry_route}`);
    router.push(app.entry_route as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>All Apps</Text>
        <View style={styles.grid}>
          {getAllApps().map((app) => (
            <TouchableOpacity
              key={app.id}
              style={styles.tile}
              onPress={() => launchApp(app)}
            >
              <View style={[styles.iconBox, { backgroundColor: app.color }]}>
                <Ionicons name={app.icon as any} size={28} color="#fff" />
              </View>
              <Text style={styles.appName} numberOfLines={1}>{app.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { padding: 16 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});

