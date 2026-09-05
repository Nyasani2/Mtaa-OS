import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function StorageSettingsScreen() {
  const router = useRouter();
  const [totalStorage] = useState(128);
  const [usedStorage] = useState(45.2);
  const [cacheSize] = useState(2.8);

  const categories = [
    { name: 'Apps', size: 18.5, color: '#6366f1', icon: 'apps-outline' },
    { name: 'Photos & Videos', size: 12.3, color: '#EC4899', icon: 'images-outline' },
    { name: 'Audio & Music', size: 4.1, color: '#8B5CF6', icon: 'musical-notes-outline' },
    { name: 'Downloads', size: 3.8, color: '#10B981', icon: 'download-outline' },
    { name: 'System', size: 4.5, color: '#64748B', icon: 'hardware-chip-outline' },
    { name: 'Cache', size: cacheSize, color: '#F59E0B', icon: 'trash-outline' },
  ];

  const freeSpace = totalStorage - usedStorage;
  const usedPercent = (usedStorage / totalStorage) * 100;

  const handleClearCache = () => {
    Alert.alert('Clear Cache', `Free up ${cacheSize} GB of temporary files?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Cleared', 'Cache cleared successfully') },
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Storage</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.overviewCard}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 8, borderColor: '#334155', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700' }}>{usedStorage.toFixed(1)}</Text>
              <Text style={{ color: '#64748B', fontSize: 12 }}>GB used</Text>
            </View>
          </View>
          <View style={{ height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${usedPercent}%`, backgroundColor: '#6366f1', borderRadius: 4 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ color: '#94A3B8', fontSize: 13 }}>{usedStorage.toFixed(1)} GB used</Text>
            <Text style={{ color: '#94A3B8', fontSize: 13 }}>{freeSpace.toFixed(1)} GB free</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>STORAGE BREAKDOWN</Text>
          <View style={s.card}>
            {categories.map((cat, i) => (
              <View key={cat.name} style={[s.row, i === categories.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[s.iconWrap, { backgroundColor: cat.color + '20' }]}>
                  <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowText}>{cat.name}</Text>
                  <View style={{ height: 4, backgroundColor: '#334155', borderRadius: 2, marginTop: 6, width: '80%' }}>
                    <View style={{ height: '100%', width: `${(cat.size / usedStorage) * 100}%`, backgroundColor: cat.color, borderRadius: 2 }} />
                  </View>
                </View>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{cat.size.toFixed(1)} GB</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>CLEANUP</Text>
          <TouchableOpacity style={s.card} onPress={handleClearCache}>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <View style={[s.iconWrap, { backgroundColor: '#EF444420' }]}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>Clear Cache</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Free up {cacheSize} GB of temporary files</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#475569" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  overviewCard: { marginHorizontal: 16, marginTop: 8, padding: 24, backgroundColor: '#1E293B', borderRadius: 16, alignItems: 'center' },
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  card: { backgroundColor: '#1E293B', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#334155' },
  iconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowText: { fontSize: 16, color: '#fff' },
});
