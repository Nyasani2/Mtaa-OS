import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/lib/appstore/useAppStore';

export default function UpdatesScreen() {
  const router = useRouter();
  const { getAppsWithUpdates, installApp } = useAppStore();
  const updates = getAppsWithUpdates();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(os)')} style={styles.backBtn}>
          <Ionicons name="home-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Updates</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/appstore')} style={styles.backBtn}>
          <Ionicons name="apps-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {updates.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" />
            <Text style={styles.emptyText}>All apps are up to date</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>{updates.length} update{updates.length > 1 ? 's' : ''} available</Text>
            {updates.map(app => (
              <View key={app.id} style={styles.updateCard}>
                <View style={[styles.appIcon, { backgroundColor: app.color + '20' }]}>
                  <Ionicons name={app.icon as any} size={28} color={app.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.appName}>{app.name}</Text>
                  <Text style={styles.versionText}>v{app.version} available</Text>
                  {app.changelog && app.changelog.length > 0 && (
                    <Text style={styles.changelog}>• {app.changelog[0]}</Text>
                  )}
                </View>
                <TouchableOpacity style={styles.updateBtn} onPress={() => installApp(app.id)}>
                  <Text style={styles.updateBtnText}>Update</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
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
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginHorizontal: 20, marginBottom: 12 },
  updateCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b',
    borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 8,
    borderWidth: 1, borderColor: '#334155',
  },
  appIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  appName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  versionText: { color: '#F59E0B', fontSize: 12, marginTop: 2 },
  changelog: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  updateBtn: { backgroundColor: '#F59E0B', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  updateBtnText: { color: '#0f172a', fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#10B981', fontSize: 16, fontWeight: '600', marginTop: 12 },
});
