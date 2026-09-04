// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import PharmacyMap, { PharmacyLocation } from '@/components/health/PharmacyMap';

export default function PharmacyMapScreen() {
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState<PharmacyLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('health_pharmacies')
          .select('id, name, type, latitude, longitude, address, phone, is_open')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .limit(200);

        if (error) throw error;
        setPharmacies(
          (data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            type: p.type || 'pharmacy',
            latitude: p.latitude,
            longitude: p.longitude,
            address: p.address,
            phone: p.phone,
            is_open: p.is_open,
          }))
        );
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to load map data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Pharmacy Map</Text>
        <View style={{ width: 40 }} />
      </View>

      {errorMsg ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{errorMsg}</Text>
          <TouchableOpacity onPress={() => window.location.reload()}>
            <Text style={s.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : (
        <PharmacyMap
          pharmacies={pharmacies}
          onMarkerPress={(p) => router.push(`/health/pharmacy/${p.id}` as any)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#0c4a6e',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBox: { padding: 20, alignItems: 'center' },
  errorText: { color: '#ef4444', fontSize: 14 },
  retry: { color: '#0ea5e9', marginTop: 8, fontWeight: '600' },
});
