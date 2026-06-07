// app/(os)/appstore/top-charts.tsx — Top Charts
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAppsBySection } from '@/lib/mtaa/appstore/unified-registry';
import { AppItem } from '@/hooks/useAppStore';

export default function TopChartsScreen() {
  const router = useRouter();
  const apps = getAppsBySection('mtaa')
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 20);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Top Charts</Text>
        {apps.map((app: AppItem, index: number) => (
          <TouchableOpacity
            key={app.id}
            style={styles.row}
            onPress={() => router.push(`/appstore/${app.id}`)}
          >
            <Text style={styles.rank}>{index + 1}</Text>
            <View style={[styles.iconBox, { backgroundColor: app.color || '#2563EB' }]}>
              <Ionicons name={app.icon} size={24} color="#fff" />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{app.name}</Text>
              <Text style={styles.category}>{app.category}</Text>
            </View>
            <Text style={styles.rating}>★ {app.rating || 0}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { padding: 16 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  rank: { color: '#64748B', fontSize: 16, fontWeight: '700', width: 30 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, marginLeft: 12 },
  name: { color: '#fff', fontSize: 15, fontWeight: '600' },
  category: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  rating: { color: '#FBBF24', fontSize: 14, fontWeight: '600' },
});

