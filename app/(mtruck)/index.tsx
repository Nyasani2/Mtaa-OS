import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import UnifiedMap from '@/lib/components/maps/UnifiedMap';
import { useLocation } from '@/lib/hooks/useLocation';

const HAUL_TYPES = [
  { key: 'local', label: 'Local Haul', desc: 'Within city · Same day', price: 3500, icon: 'truck', color: '#84cc16' },
  { key: 'longhaul', label: 'Long Haul', desc: 'Inter-city · 1-3 days', price: 15000, icon: 'trail-sign', color: '#3b82f6' },
  { key: 'heavy', label: 'Heavy Load', desc: 'Industrial · Specialized', price: 25000, icon: 'construct', color: '#f59e0b' },
];

export default function MTruckScreen() {
  const router = useRouter();
  const { latitude, longitude } = useLocation();
  const [selectedType, setSelectedType] = useState('local');
  const selected = HAUL_TYPES.find(h => h.key === selectedType)!;

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <UnifiedMap latitude={latitude} longitude={longitude} zoom={12}
          markers={[{ id: 'depot', latitude, longitude, title: 'Your Location', color: '#84cc16' }]}
          showUserLocation />
      </View>
      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Request Haul</Text>
        <Text style={styles.subtitle}>Logistics made simple</Text>
        <View style={styles.haulOptions}>
          {HAUL_TYPES.map(type => (
            <TouchableOpacity key={type.key}
              style={[styles.haulCard, selectedType === type.key && { borderColor: type.color, borderWidth: 2 }]}
              onPress={() => setSelectedType(type.key)}>
              <Ionicons name={type.icon as any} size={24} color={type.color} />
              <View style={styles.haulInfo}>
                <Text style={styles.haulLabel}>{type.label}</Text>
                <Text style={styles.haulDesc}>{type.desc}</Text>
              </View>
              <Text style={[styles.haulPrice, { color: type.color }]}>KES {type.price.toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.bookBtn, { backgroundColor: selected.color }]} onPress={() => router.push({ pathname: '/(mtruck)/request-haul', params: { haulType: selectedType } })}>
          <Text style={styles.bookBtnText}>Request {selected.label}</Text>
        </TouchableOpacity>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(mtruck)/equipment')}>
            <Ionicons name="hammer" size={20} color="#94a3b8" /><Text style={styles.navText}>Equipment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(mtruck)/haul-tracking')}>
            <Ionicons name="navigate" size={20} color="#94a3b8" /><Text style={styles.navText}>Track</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  mapContainer: { flex: 1 },
  bottomSheet: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30, marginTop: -20 },
  handle: { width: 40, height: 4, backgroundColor: '#475569', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4, marginBottom: 16 },
  haulOptions: { gap: 10, marginBottom: 16 },
  haulCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#334155' },
  haulInfo: { flex: 1, marginLeft: 12 },
  haulLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  haulDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  haulPrice: { fontSize: 14, fontWeight: '700' },
  bookBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12 },
  navItem: { alignItems: 'center', gap: 4 },
  navText: { fontSize: 11, color: '#94a3b8' },
});
