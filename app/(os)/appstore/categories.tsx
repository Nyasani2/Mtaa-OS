// app/(os)/appstore/categories.tsx — App Categories
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAppsBySection } from '@/lib/mtaa/appstore/unified-registry';

const CATEGORIES = [
  { id: 'mtaa', name: 'MTAA Apps', icon: 'apps', color: '#2563EB' },
  { id: 'android', name: 'Android Apps', icon: 'logo-android', color: '#10B981' },
  { id: 'productivity', name: 'Productivity', icon: 'briefcase', color: '#F59E0B' },
  { id: 'social', name: 'Social', icon: 'people', color: '#EC4899' },
  { id: 'finance', name: 'Finance', icon: 'cash', color: '#059669' },
];

export default function CategoriesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Categories</Text>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={styles.card}
            onPress={() => router.push(`/appstore/search?category=${cat.id}`)}
          >
            <View style={[styles.iconBox, { backgroundColor: cat.color }]}>
              <Ionicons name={cat.icon} size={28} color="#fff" />
            </View>
            <Text style={styles.name}>{cat.name}</Text>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  name: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1 },
});

