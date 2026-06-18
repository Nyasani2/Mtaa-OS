// app/(os)/appstore/[id].tsx — App Detail
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/lib/stores/app-store';
import { getAppById } from '@/lib/mtaa/appstore/unified-registry';

export default function AppDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isInstalled, isInstallingApp, installApp } = useAppStore();

  const app = getAppById(id as string);

  if (!app) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>App not found</Text>
      </SafeAreaView>
    );
  }

  const installing = isInstallingApp(app.id);
  const installed = isInstalled(app.id);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: app.color || '#2563EB' }]}>
            <Ionicons name={app.icon as any} size={48} color="#fff" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{app.name}</Text>
            <Text style={styles.developer}>{app.developer}</Text>
            <Text style={styles.rating}>★ {app.rating || 0} • {app.category}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.installBtn, installed && styles.installedBtn, installing && styles.installingBtn]}
          onPress={() => !installed && !installing && installApp(app.id)}
          disabled={installed || installing}
        >
          <Text style={styles.installText}>
            {installing ? 'Installing...' : installed ? 'Open' : 'Get'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{app.description}</Text>

        <Text style={styles.sectionTitle}>Screenshots</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.screenshots}>
          {app.screenshots?.map((url, i) => (
            <View key={i} style={styles.screenshot}>
              <Ionicons name="image" size={40} color="#64748B" />
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { padding: 16 },
  backBtn: { marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: { marginLeft: 16, flex: 1 },
  name: { color: '#fff', fontSize: 24, fontWeight: '700' },
  developer: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  rating: { color: '#FBBF24', fontSize: 14, marginTop: 4 },
  installBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  installedBtn: { backgroundColor: '#374151' },
  installingBtn: { backgroundColor: '#1E3A5F' },
  installText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { color: '#94A3B8', fontSize: 18, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  description: { color: '#CBD5E1', fontSize: 14, lineHeight: 22 },
  screenshots: { marginTop: 8 },
  screenshot: {
    width: 200,
    height: 120,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  error: { color: '#EF4444', fontSize: 18, textAlign: 'center', marginTop: 40 },
});
