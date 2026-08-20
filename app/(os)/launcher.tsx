// @ts-nocheck
// app/(os)/launcher.tsx — All Apps screen (reads canonical catalog)
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppLock } from '@/lib/security/app-lock-provider';
import { Ionicons } from '@expo/vector-icons';
import { ALL_APPS, AppTile } from '@/lib/catalog/app-catalog';

export default function LauncherScreen() {
  const { lock } = useAppLock();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const groups: Record<string, AppTile[]> = {};
    ALL_APPS.forEach((app) => {
      if (query && !app.name.toLowerCase().includes(query.toLowerCase())) return;
      (groups[app.category] = groups[app.category] || []).push(app);
    });
    return groups;
  }, [query]);

  const launchApp = (app: AppTile) => {
    // Action handlers (non-navigation)
    if (app.action === 'lock') { lock(); return; }
    // Guard: skip entries with no route (instead of crashing)
    if (!app.route) {
      console.log(`[Launcher] ${app.name} has no route — skipped`);
      return;
    }
    router.push(app.route as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Apps</Text>
        <TextInput
          style={styles.search}
          placeholder="Search apps..."
          placeholderTextColor="#94a3b8"
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {Object.entries(categories).map(([cat, apps]) => (
          <View key={cat} style={styles.section}>
            <Text style={styles.catTitle}>{cat}</Text>
            <View style={styles.grid}>
              {apps.map((app) => (
                <TouchableOpacity
                  key={app.id}
                  style={styles.tile}
                  onPress={() => launchApp(app)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: app.bgColor }]}>
                    <Ionicons name={app.icon as any} size={28} color={app.color} />
                  </View>
                  <Text style={styles.appName} numberOfLines={1}>{app.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        {Object.keys(categories).length === 0 && (
          <Text style={styles.empty}>No apps match "{query}"</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 10 },
  search: { backgroundColor: '#1a1a2e', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 15 },
  scroll: { padding: 12, paddingBottom: 40 },
  section: { marginBottom: 20 },
  catTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '22%', alignItems: 'center', gap: 6 },
  iconBox: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  appName: { color: '#e5e7eb', fontSize: 11, fontWeight: '500', textAlign: 'center', maxWidth: 70 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 40, fontSize: 14 },
});
