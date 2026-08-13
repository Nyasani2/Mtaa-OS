// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function EducationMap() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'schools' | 'buses' | 'routes'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    setLoading(true);
    const [{ data: sch }, { data: bus }, { data: rte }] = await Promise.all([
      supabase.from('education_schools').select('id, name, address, city, country, latitude, longitude').limit(50),
      supabase.from('education_transport_vehicles').select('id, name, type, status, route:route_id (name)').limit(50),
      supabase.from('education_transport_routes').select('id, name, start_location, end_location, stops').limit(50),
    ]);
    setSchools(sch || []);
    setBuses(bus || []);
    setRoutes(rte || []);
    setLoading(false);
  };

  const filteredSchools = schools.filter((s: any) =>
    (filter === 'all' || filter === 'schools') &&
    (s.name?.toLowerCase().includes(search.toLowerCase()) || s.city?.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredBuses = buses.filter((b: any) =>
    (filter === 'all' || filter === 'buses') &&
    (b.name?.toLowerCase().includes(search.toLowerCase()) || b.route?.name?.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredRoutes = routes.filter((r: any) =>
    (filter === 'all' || filter === 'routes') &&
    (r.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const FilterChip = ({ label, value }: { label: string; value: typeof filter }) => (
    <TouchableOpacity
      style={[styles.chip, filter === value && styles.chipActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.chipText, filter === value && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#94a3b8', marginTop: 12 }}>Loading education map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Education Map</Text>
        <Text style={styles.headerSub}>{schools.length} Schools · {buses.length} Buses · {routes.length} Routes</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search schools, buses, routes..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        <FilterChip label="All" value="all" />
        <FilterChip label="Schools" value="schools" />
        <FilterChip label="Buses" value="buses" />
        <FilterChip label="Routes" value="routes" />
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {(filter === 'all' || filter === 'schools') && filteredSchools.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Schools</Text>
            {filteredSchools.map((s: any) => (
              <TouchableOpacity key={s.id} style={styles.card} onPress={() => router.push(`/(education as any)/schools/${s.id}` as any)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.iconCircle, { backgroundColor: '#3b82f620' }]}>
                    <Ionicons name="school-outline" size={20} color="#3b82f6" />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.cardTitle}>{s.name}</Text>
                    <Text style={styles.cardMeta}>{s.address}{s.city ? `, ${s.city}` : ''}{s.country ? `, ${s.country}` : ''}</Text>
                    {s.latitude && s.longitude ? (
                      <Text style={styles.coord}>📍 {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {(filter === 'all' || filter === 'buses') && filteredBuses.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Buses & Vehicles</Text>
            {filteredBuses.map((b: any) => (
              <View key={b.id} style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.iconCircle, { backgroundColor: '#0ea5e920' }]}>
                    <Ionicons name="bus-outline" size={20} color="#0ea5e9" />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.cardTitle}>{b.name}</Text>
                    <Text style={styles.cardMeta}>{b.type || 'Vehicle'} · {b.route?.name || 'No route assigned'}</Text>
                    <Text style={[styles.statusBadge, { color: b.status === 'active' ? '#10b981' : '#f59e0b' }]}>
                      {b.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {(filter === 'all' || filter === 'routes') && filteredRoutes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Routes</Text>
            {filteredRoutes.map((r: any) => (
              <View key={r.id} style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.iconCircle, { backgroundColor: '#05966920' }]}>
                    <Ionicons name="map-outline" size={20} color="#059669" />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.cardTitle}>{r.name}</Text>
                    <Text style={styles.cardMeta}>{r.start_location} → {r.end_location}</Text>
                    <Text style={styles.cardMeta}>{Array.isArray(r.stops) ? r.stops.length : 0} stops</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {filteredSchools.length === 0 && filteredBuses.length === 0 && filteredRoutes.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="map-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No map data found.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { backgroundColor: '#1e3a5f', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 20 },
  backBtn: { marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 12, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1e293b' },
  chipRow: { paddingHorizontal: 12, marginTop: 12 },
  chip: { backgroundColor: '#fff', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, marginRight: 8 },
  chipActive: { backgroundColor: '#3b82f6' },
  chipText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginTop: 18, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  coord: { fontSize: 12, color: '#3b82f6', marginTop: 4 },
  statusBadge: { fontSize: 11, fontWeight: 'bold', marginTop: 4 },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#94a3b8', marginTop: 12 },
});
