// lib/transport/components/TransportHub.tsx
// Bolt-style unified transport hub — used by app/(mtaxi)/index.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import UnifiedMap from '@/lib/components/maps/UnifiedMap';
import { useLocation } from '@/lib/hooks/useLocation';
import type { RecentPlace } from '../types';

interface Props { recentPlaces: RecentPlace[]; onSearchPress: () => void; }

export default function TransportHub({ recentPlaces, onSearchPress }: Props) {
  const router = useRouter();
  const { latitude, longitude, loading: locLoading } = useLocation();

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <View style={styles.mapContainer}>
        {locLoading || latitude == null ? (
          <View style={styles.mapLoading}><Ionicons name="location" size={32} color="#3b82f6" /><Text style={styles.mapLoadingText}>Getting your location...</Text></View>
        ) : (
          <UnifiedMap
            origin={{ latitude, longitude }}
            showsUserLocation
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        <TouchableOpacity style={styles.searchBar} onPress={onSearchPress} activeOpacity={0.8}>
          <Ionicons name="search" size={20} color="#64748b" />
          <Text style={styles.searchPlaceholder}>Where to?</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.serviceGrid}>
          <TouchableOpacity style={styles.serviceCard} onPress={() => router.push('/(mtaxi)/request?serviceType=car' as any)} activeOpacity={0.8}>
            <View style={[styles.serviceIconWrap, { backgroundColor: '#3b82f620' }]}><Ionicons name="car" size={28} color="#3b82f6" /></View>
            <Text style={styles.serviceLabel}>Car Rides</Text>
            <Text style={styles.serviceDesc}>Book a cab</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.serviceCard} onPress={() => router.push('/(mtaxi)/request?serviceType=boda' as any)} activeOpacity={0.8}>
            <View style={[styles.serviceIconWrap, { backgroundColor: '#8B5CF620' }]}><Ionicons name="bicycle" size={28} color="#8B5CF6" /></View>
            <Text style={styles.serviceLabel}>Boda Boda</Text>
            <Text style={styles.serviceDesc}>Fast bike rides</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.serviceCard} onPress={() => router.push('/(mtruck)' as any)} activeOpacity={0.8}>
            <View style={[styles.serviceIconWrap, { backgroundColor: '#f59e0b20' }]}><Ionicons name="cube" size={28} color="#f59e0b" /></View>
            <Text style={styles.serviceLabel}>MTruck</Text>
            <Text style={styles.serviceDesc}>Moving & delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.serviceCard} onPress={() => router.push('/(mtaxi)/schedule')} activeOpacity={0.8}>
            <View style={[styles.serviceIconWrap, { backgroundColor: '#10b98120' }]}><Ionicons name="calendar" size={28} color="#10b981" /></View>
            <Text style={styles.serviceLabel}>Schedule</Text>
            <Text style={styles.serviceDesc}>Book ahead</Text>
          </TouchableOpacity>
        </View>

        {recentPlaces.length > 0 && (<>
          <Text style={styles.sectionTitle}>Recent</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
            {recentPlaces.slice(0, 6).map((place) => (
              <TouchableOpacity key={place.id} style={styles.recentCard} onPress={() => router.push({ pathname: '/(mtaxi)/request', params: { serviceType: place.service_type || 'car', dropoffLat: place.lat, dropoffLng: place.lng, dropoffAddress: place.address, dropoffName: place.name } })} activeOpacity={0.8}>
                <View style={styles.recentIconWrap}><Ionicons name="time" size={18} color="#3b82f6" /></View>
                <Text style={styles.recentName} numberOfLines={1}>{place.name}</Text>
                <Text style={styles.recentAddress} numberOfLines={1}>{place.address}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>)}

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(mtaxi)/history')}><Ionicons name="list" size={20} color="#3b82f6" /><Text style={styles.quickText}>History</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(mtaxi)/tracking')}><Ionicons name="navigate" size={20} color="#8B5CF6" /><Text style={styles.quickText}>Track</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  mapContainer: { flex: 1 },
  mapLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' },
  mapLoadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  bottomSheet: { backgroundColor: '#1e293b', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, marginTop: -24 },
  handle: { width: 40, height: 4, backgroundColor: '#475569', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  searchPlaceholder: { flex: 1, marginLeft: 12, fontSize: 16, color: '#94a3b8', fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0', marginBottom: 12, marginTop: 4 },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  serviceCard: { width: '23%', minWidth: 72, backgroundColor: '#0f172a', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  serviceIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  serviceLabel: { fontSize: 12, fontWeight: '700', color: '#fff', textAlign: 'center' },
  serviceDesc: { fontSize: 10, color: '#64748b', marginTop: 2, textAlign: 'center' },
  recentScroll: { marginBottom: 16 },
  recentCard: { backgroundColor: '#0f172a', borderRadius: 14, padding: 12, marginRight: 10, width: 130, borderWidth: 1, borderColor: '#334155' },
  recentIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  recentName: { fontSize: 13, fontWeight: '600', color: '#fff' },
  recentAddress: { fontSize: 11, color: '#64748b', marginTop: 2 },
  quickActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#334155', gap: 8 },
  quickText: { fontSize: 14, fontWeight: '600', color: '#e2e8f0' },
});
