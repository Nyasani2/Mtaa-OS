// app/(os)/appstore/index.tsx — App Store Home
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore, AppItem } from '@/hooks/useAppStore';
import { getAppsBySection } from '@/lib/mtaa/appstore/unified-registry';

export default function AppStoreScreen() {
  const router = useRouter();
  const { installedApps, isInstalled, installApp } = useAppStore();
  const [featured, setFeatured] = useState<AppItem[]>([]);

  useEffect(() => {
    const apps = getAppsBySection('mtaa');
    setFeatured(apps.slice(0, 6));
  }, []);

  const renderAppCard = (app: AppItem) => (
    <TouchableOpacity
      key={app.id}
      style={styles.card}
      onPress={() => router.push(`/appstore/${app.id}`)}
    >
      <View style={[styles.iconBox, { backgroundColor: app.color || '#2563EB' }]}>
        <Ionicons name={app.icon} size={32} color="#fff" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{app.name}</Text>
        <Text style={styles.category}>{app.category}</Text>
        <Text style={styles.rating}>★ {app.rating || 0}</Text>
      </View>
      <TouchableOpacity
        style={[styles.installBtn, isInstalled(app.id) && styles.installedBtn]}
        onPress={() => !isInstalled(app.id) && installApp(app.id)}
      >
        <Text style={styles.installText}>
          {isInstalled(app.id) ? 'Open' : 'Get'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>App Store</Text>
          <TouchableOpacity onPress={() => router.push('/appstore/search')}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Featured Apps</Text>
        {featured.map(renderAppCard)}

        <TouchableOpacity
          style={styles.categoriesBtn}
          onPress={() => router.push('/appstore/categories')}
        >
          <Text style={styles.categoriesText}>Browse Categories →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { color: '#fff', fontSize: 28, fontWeight: '700' },
  sectionTitle: { color: '#94A3B8', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, marginLeft: 12 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  category: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  rating: { color: '#FBBF24', fontSize: 13, marginTop: 2 },
  installBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  installedBtn: { backgroundColor: '#374151' },
  installText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  categoriesBtn: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    alignItems: 'center',
  },
  categoriesText: { color: '#60A5FA', fontSize: 16, fontWeight: '600' },
});

