// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { WORKSTATIONS } from '@/lib/health/workstations';

export default function HealthWorkstationScreen() {
  const router = useRouter();
  const { role, facilities, selectedFacilityId, selectFacility, isLoading } = useHealthRole();

  const isStaff = facilities.length > 0;
  const key = isStaff ? role : 'patient';
  const ws = WORKSTATIONS[key] || WORKSTATIONS.patient;

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={ws.color} />
        <Text style={s.loadingText}>Loading your workstation…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={[s.header, { backgroundColor: ws.color }]}>
        <Ionicons name={ws.icon} size={30} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{ws.title}</Text>
          <Text style={s.headerSub}>
            {isStaff ? `Role: ${role.replace(/_/g, ' ')}` : 'MTAA Health member'}
          </Text>
        </View>
      </View>

      {isStaff && facilities.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.facRow}>
          {facilities.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[s.facChip, selectedFacilityId === f.id && s.facChipActive]}
              onPress={() => selectFacility(f.id)}
            >
              <Text style={[s.facChipText, selectedFacilityId === f.id && s.facChipTextActive]}>
                {f.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={s.grid}>
        {ws.tiles.map((t) => (
          <TouchableOpacity key={t.route} style={s.tile} onPress={() => router.push(t.route as any)}>
            <View style={[s.tileIcon, { backgroundColor: ws.color + '18' }]}>
              <Ionicons name={t.icon as any} size={26} color={ws.color} />
            </View>
            <Text style={s.tileLabel}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.homeBtn} onPress={() => router.push('/health' as any)}>
        <Ionicons name="home-outline" size={18} color="#64748b" />
        <Text style={s.homeBtnText}>Back to Health Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { color: '#64748b', marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, paddingTop: 52 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  facRow: { paddingHorizontal: 16, paddingVertical: 12 },
  facChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: '#e2e8f0', marginRight: 8 },
  facChipActive: { backgroundColor: '#0f172a' },
  facChipText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  facChipTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  tile: { width: '25%', alignItems: 'center', paddingVertical: 12 },
  tileIcon: { width: 58, height: 58, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  tileLabel: { fontSize: 11, fontWeight: '600', color: '#334155', marginTop: 6, textAlign: 'center' },
  homeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 16, padding: 12, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  homeBtnText: { color: '#64748b', fontWeight: '600' },
});
