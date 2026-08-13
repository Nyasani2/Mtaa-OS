import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/lib/appstore/useAppStore';
import { ALL_APPS, CATEGORY_LABELS } from '@/lib/appstore/data';

export default function MyAppsScreen() {
  const router = useRouter();
  const { getInstalledApps, getAppsWithUpdates, getUpdateAvailable, uninstallApp } = useAppStore();

  const installed = getInstalledApps();
  const updates = getAppsWithUpdates();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(os)' as any)} style={styles.backBtn}>
          <Ionicons name="home-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Apps</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/appstore' as any)} style={styles.backBtn}>
          <Ionicons name="apps-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Updates Section */}
        {updates.length > 0 && (
          <View style={styles.updatesSection}>
            <Text style={styles.sectionTitle}>Updates Available</Text>
            {updates.map((app: any) => (
              <View key={app.id} style={styles.updateCard}>
                <View style={[styles.appIcon, { backgroundColor: app.color + '20' }]}>
                  <Ionicons name={app.icon as any} size={24} color={app.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appName}>{app.name}</Text>
                  <Text style={styles.updateText}>Update available · v{app.version}</Text>
                </View>
                <TouchableOpacity style={styles.updateBtn} onPress={() => router.push({ pathname: '/(os)/appstore/[id]', params: { id: app.id } })}>
                  <Text style={styles.updateBtnText}>Update</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Installed Apps */}
        <Text style={styles.sectionTitle}>Installed ({installed.length})</Text>
        {installed.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="apps-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>No apps installed yet</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(os)/appstore' as any)}>
              <Text style={styles.browseText}>Browse AppStore</Text>
            </TouchableOpacity>
          </View>
        ) : (
          installed.map((app: any) => (
            <TouchableOpacity
              key={app.id}
              style={styles.appRow}
              onPress={() => router.push(app.route as any)}
            >
              <View style={[styles.appIcon, { backgroundColor: app.color + '20' }]}>
                <Ionicons name={app.icon as any} size={24} color={app.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.appName}>{app.name}</Text>
                <Text style={styles.appMeta}>{CATEGORY_LABELS[app.category]} · v{app.version}</Text>
              </View>
              {getUpdateAvailable(app.id) && (
                <View style={styles.updateDot}>
                  <Text style={styles.updateDotText}>!</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => uninstallApp(app.id)} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        {/* OS Apps (always available) */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>System Apps</Text>
        {ALL_APPS.filter((a: any) => a.isOSApp).map((app: any) => (
          <TouchableOpacity
            key={app.id}
            style={styles.appRow}
            onPress={() => router.push(app.route as any)}
          >
            <View style={[styles.appIcon, { backgroundColor: app.color + '20' }]}>
              <Ionicons name={app.icon as any} size={24} color={app.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.appName}>{app.name}</Text>
              <Text style={styles.appMeta}>{CATEGORY_LABELS[app.category]} · Built-in</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#475569" />
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  updatesSection: { marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginHorizontal: 20, marginBottom: 12 },
  updateCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b',
    borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 8,
    borderWidth: 1, borderColor: '#F59E0B',
  },
  appIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  updateText: { color: '#F59E0B', fontSize: 12, marginTop: 2 },
  updateBtn: { backgroundColor: '#F59E0B', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  updateBtnText: { color: '#0f172a', fontSize: 13, fontWeight: '700' },
  appRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b',
    borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 8,
    borderWidth: 1, borderColor: '#334155',
  },
  appMeta: { color: '#64748b', fontSize: 12, marginTop: 2 },
  updateDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  updateDotText: { color: '#0f172a', fontSize: 12, fontWeight: '800' },
  removeBtn: { padding: 8 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#64748b', fontSize: 14, marginTop: 12 },
  browseBtn: { backgroundColor: '#3B82F6', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 16 },
  browseText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
