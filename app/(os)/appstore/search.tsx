// @ts-nocheck
// app/(os)/appstore/search.tsx — App Search
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore, AppItem } from '@/lib/appstore';

export default function SearchScreen() {
  const router = useRouter();
  const { searchApps, isInstalled, isInstallingApp, installApp } = useAppStore();
  const [query, setQuery] = useState('');
  const results = searchApps(query);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          style={styles.input}
          placeholder="Search apps..."
          placeholderTextColor="#64748B"
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {results.map((app: AppItem) => (
          <TouchableOpacity
            key={app.id}
            style={styles.card}
            onPress={() => router.push(`/appstore/${app.id}` as any)}
          >
            <View style={[styles.iconBox, { backgroundColor: app.color || '#2563EB' }]}>
              <Ionicons name={app.icon} size={24} color="#fff" />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{app.name}</Text>
              <Text style={styles.category}>{app.category}</Text>
            </View>
            <TouchableOpacity
              style={[styles.installBtn, isInstalled(app.id) && styles.installedBtn]}
              onPress={() => !isInstalled(app.id) && installApp(app.id)}
            >
              <Text style={styles.installText}>
                {isInstallingApp(app.id) ? '...' : isInstalled(app.id) ? 'Open' : 'Get'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
        {query && results.length === 0 && (
          <Text style={styles.empty}>No apps found</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { flex: 1, color: '#fff', fontSize: 16, marginLeft: 8 },
  scroll: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, marginLeft: 12 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  category: { color: '#94A3B8', fontSize: 13 },
  installBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  installedBtn: { backgroundColor: '#374151' },
  installText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  empty: { color: '#64748B', fontSize: 16, textAlign: 'center', marginTop: 40 },
});

