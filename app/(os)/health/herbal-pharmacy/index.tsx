// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import PharmacyMap, { PharmacyLocation } from '@/components/health/PharmacyMap';
import PharmacyList, { PharmacyItem } from '@/components/health/PharmacyList';

interface RawPharmacy {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  is_open?: boolean;
  rating?: number;
  hours?: string;
}

export default function HerbalPharmacyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('list');
  const [filter, setFilter] = useState<'all' | 'chemist' | 'pharmacy' | 'herbal' | 'hospital'>('all');
  const [search, setSearch] = useState('');
  const [pharmacies, setPharmacies] = useState<RawPharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch pharmacies from health_pharmacies table
  const loadPharmacies = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let q = supabase
        .from('health_pharmacies')
        .select('id, name, type, latitude, longitude, address, phone, is_open, rating, hours')
        .order('name', { ascending: true });

      if (filter !== 'all') {
        q = q.eq('type', filter);
      }
      if (search.trim()) {
        q = q.ilike('name', `%${search.trim()}%`);
      }

      const { data, error } = await q.limit(200);
      if (error) throw error;
      setPharmacies(data || []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load pharmacies');
      setPharmacies([]);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    loadPharmacies();
  }, [loadPharmacies]);

  // Try to get user location
  useEffect(() => {
    if (Platform.OS !== 'web') {
      // On native, we'd use expo-location; for now, default to Nairobi
      setUserLoc({ lat: -1.2921, lng: 36.8219 });
    } else {
      setUserLoc({ lat: -1.2921, lng: 36.8219 });
    }
  }, []);

  // Compute distances
  const withDistance = (list: RawPharmacy[]): (RawPharmacy & { distance_km?: number })[] => {
    if (!userLoc) return list;
    return list.map((p) => {
      if (!p.latitude || !p.longitude) return p;
      const d = haversine(userLoc.lat, userLoc.lng, p.latitude, p.longitude);
      return { ...p, distance_km: d };
    });
  };

  const sorted = withDistance(pharmacies).sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));

  const mapData: PharmacyLocation[] = sorted.map((p) => ({
    id: p.id,
    name: p.name,
    type: (p.type as any) || 'pharmacy',
    latitude: p.latitude || 0,
    longitude: p.longitude || 0,
    address: p.address,
    phone: p.phone,
    is_open: p.is_open,
    distance_km: p.distance_km,
  }));

  const listData: PharmacyItem[] = sorted.map((p) => ({
    id: p.id,
    name: p.name,
    type: (p.type as any) || 'pharmacy',
    address: p.address,
    phone: p.phone,
    is_open: p.is_open,
    distance_km: p.distance_km,
    latitude: p.latitude,
    longitude: p.longitude,
    rating: p.rating,
    hours: p.hours,
  }));

  const filterChips: { key: typeof filter; label: string; icon: any }[] = [
    { key: 'all', label: 'All', icon: 'apps-outline' },
    { key: 'chemist', label: 'Chemists', icon: 'flask-outline' },
    { key: 'pharmacy', label: 'Pharmacies', icon: 'medkit-outline' },
    { key: 'herbal', label: 'Herbal', icon: 'leaf-outline' },
    { key: 'hospital', label: 'Hospitals', icon: 'medical-outline' },
  ];

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Pharmacies & Chemists</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/health/pharmacy/register' as any)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#94a3b8" style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Search chemists, pharmacies..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={loadPharmacies}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); loadPharmacies(); }}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <View style={s.chipRow}>
        {filterChips.map((chip) => (
          <TouchableOpacity
            key={chip.key}
            style={[s.chip, filter === chip.key && s.chipActive]}
            onPress={() => setFilter(chip.key)}
          >
            <Ionicons name={chip.icon} size={14} color={filter === chip.key ? '#fff' : '#64748b'} />
            <Text style={[s.chipText, filter === chip.key && s.chipTextActive]}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map / List tabs */}
      <View style={s.viewTabRow}>
        <TouchableOpacity style={[s.viewTab, activeTab === 'map' && s.viewTabActive]} onPress={() => setActiveTab('map')}>
          <Ionicons name="map-outline" size={16} color={activeTab === 'map' ? '#0ea5e9' : '#94a3b8'} />
          <Text style={[s.viewTabText, activeTab === 'map' && s.viewTabTextActive]}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.viewTab, activeTab === 'list' && s.viewTabActive]} onPress={() => setActiveTab('list')}>
          <Ionicons name="list-outline" size={16} color={activeTab === 'list' ? '#0ea5e9' : '#94a3b8'} />
          <Text style={[s.viewTabText, activeTab === 'list' && s.viewTabTextActive]}>List</Text>
        </TouchableOpacity>
      </View>

      {/* Error */}
      {errorMsg ? (
        <View style={s.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#ef4444" />
          <Text style={s.errorText}>{errorMsg}</Text>
          <TouchableOpacity onPress={loadPharmacies}><Text style={s.retry}>Retry</Text></TouchableOpacity>
        </View>
      ) : null}

      {/* Content */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : activeTab === 'map' ? (
        <PharmacyMap
          pharmacies={mapData}
          userLatitude={userLoc?.lat}
          userLongitude={userLoc?.lng}
          onMarkerPress={(p) => router.push(`/health/pharmacy/${p.id}` as any)}
          loading={loading}
        />
      ) : (
        <PharmacyList
          pharmacies={listData}
          filter={filter === 'all' ? 'all' : filter}
          onPress={(p) => router.push(`/health/pharmacy/${p.id}` as any)}
        />
      )}
    </View>
  );
}

// ─── Haversine distance (km) ─────────────────────────────────
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#0c4a6e',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 12, marginTop: 12, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1e293b' },
  chipRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 10, gap: 8, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#0c4a6e' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: '#fff' },
  viewTabRow: { flexDirection: 'row', marginHorizontal: 12, marginTop: 10, backgroundColor: '#e2e8f0', borderRadius: 10, padding: 3 },
  viewTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 8 },
  viewTabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  viewTabText: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  viewTabTextActive: { color: '#0ea5e9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBox: { marginHorizontal: 12, marginTop: 8, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, alignItems: 'center' },
  errorText: { color: '#ef4444', fontSize: 13, marginTop: 4 },
  retry: { color: '#0ea5e9', marginTop: 6, fontWeight: '600' },
});
