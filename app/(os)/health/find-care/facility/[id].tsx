// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function FacilityDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [fac, setFac] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      for (const t of ['health_facilities', 'health_hospitals']) {
        const { data } = await supabase.from(t).select('*').eq('id', id).maybeSingle();
        if (data) { setFac(data); break; }
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#0f766e" /></View>;
  if (!fac) return <View style={s.center}><Text style={s.missing}>Facility not found</Text></View>;

  const name = fac.name || 'Facility';
  const phone = fac.phone || fac.phone_number;
  const address = [fac.address, fac.city].filter(Boolean).join(', ');

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Ionicons name="business" size={30} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{name}</Text>
          <Text style={s.sub}>{fac.type || 'health facility'}</Text>
        </View>
      </View>

      {address ? (
        <View style={s.card}>
          <Ionicons name="location" size={20} color="#0f766e" />
          <Text style={s.cardText}>{address}</Text>
        </View>
      ) : null}

      {phone ? (
        <TouchableOpacity style={s.card} onPress={() => Linking.openURL('tel:' + phone)}>
          <Ionicons name="call" size={20} color="#0f766e" />
          <Text style={[s.cardText, { color: '#0f766e', fontWeight: '700' }]}>{phone}</Text>
        </TouchableOpacity>
      ) : null}

      {(fac.specialties || []).length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Specialties</Text>
          {(fac.specialties || []).map((x: string) => <Text key={x} style={s.chip}>• {x}</Text>)}
        </View>
      )}

      {(fac.services || []).length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Services</Text>
          {(fac.services || []).map((x: string) => <Text key={x} style={s.chip}>• {x}</Text>)}
        </View>
      )}

      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Text style={s.backText}>Back to Find Care</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  missing: { color: '#94a3b8', fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, paddingTop: 52, backgroundColor: '#0f766e' },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginHorizontal: 16, marginTop: 10 },
  cardText: { fontSize: 15, color: '#0f172a', flex: 1 },
  section: { marginHorizontal: 16, marginTop: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  chip: { fontSize: 14, color: '#475569', paddingVertical: 3 },
  backBtn: { margin: 16, padding: 14, alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  backText: { color: '#0f766e', fontWeight: '700' },
});
