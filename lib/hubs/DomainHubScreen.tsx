// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DOMAIN_HUBS } from './domain-hubs';

export default function DomainHubScreen({ hubKey }: any) {
  const router = useRouter();
  const hub = DOMAIN_HUBS[hubKey] || DOMAIN_HUBS.system;
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={[s.header, { backgroundColor: hub.color }]}>
        <Ionicons name={hub.icon} size={30} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{hub.title}</Text>
          <Text style={s.sub}>{hub.subtitle}</Text>
        </View>
      </View>
      <View style={s.grid}>
        {hub.tiles.map((t: any) => (
          <TouchableOpacity key={t.route} style={s.tile} onPress={() => router.push(t.route as any)}>
            <View style={[s.tileIcon, { backgroundColor: hub.color + '18' }]}>
              <Ionicons name={t.icon} size={26} color={hub.color} />
            </View>
            <Text style={s.tileLabel}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={s.homeBtn} onPress={() => router.push('/' as any)}>
        <Ionicons name="home-outline" size={18} color="#64748b" />
        <Text style={s.homeBtnText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, paddingTop: 52 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 8 },
  tile: { width: '25%', alignItems: 'center', paddingVertical: 12 },
  tileIcon: { width: 58, height: 58, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  tileLabel: { fontSize: 11, fontWeight: '600', color: '#334155', marginTop: 6, textAlign: 'center' },
  homeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 16, padding: 12, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  homeBtnText: { color: '#64748b', fontWeight: '600' },
});
