import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface Facility {
  id: string;
  name: string;
  type: string;
  address: string;
  phone: string;
  latitude?: number;
  longitude?: number;
}

interface Doctor {
  id: string;
  full_name: string;
  specialty: string;
  facility_name?: string;
  phone?: string;
  rating?: number;
}

export default function FindCareScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'facilities' | 'doctors'>('facilities');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const searchFacilities = useCallback(async (searchQuery: string = query) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let q = supabase.from('health_facilities').select('*');
      if (searchQuery.trim()) {
        q = q.ilike('name', `%${searchQuery.trim()}%`);
      }
      const { data, error } = await q.limit(50);
      if (error) throw error;
      setFacilities(data || []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load facilities');
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const searchDoctors = useCallback(async (searchQuery: string = query) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let q = supabase
        .from('health_staff')
        .select('id, full_name, specialty, phone, facility_id, health_facilities(name)')
        .eq('role', 'doctor');
      if (searchQuery.trim()) {
        q = q.ilike('full_name', `%${searchQuery.trim()}%`);
      }
      const { data, error } = await q.limit(50);
      if (error) throw error;
      const mapped = (data || []).map((d: any) => ({
        id: d.id,
        full_name: d.full_name,
        specialty: d.specialty || 'General Practitioner',
        facility_name: d.health_facilities?.name,
        phone: d.phone,
      }));
      setDoctors(mapped);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load doctors');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    if (activeTab === 'facilities') {
      searchFacilities().finally(() => setRefreshing(false));
    } else {
      searchDoctors().finally(() => setRefreshing(false));
    }
  }, [activeTab, searchFacilities, searchDoctors]);

  React.useEffect(() => {
    refresh();
  }, [activeTab]);

  const data = activeTab === 'facilities' ? facilities : doctors;

  const renderFacility = ({ item }: { item: Facility }) => (
    <TouchableOpacity style={s.card} onPress={() => router.push(`/health/find-care/facility/${item.id}`)}>
      <View style={s.cardIcon}>
        <Ionicons name="business-outline" size={28} color="#0ea5e9" />
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardTitle}>{item.name}</Text>
        <Text style={s.cardSub}>{item.type} • {item.address}</Text>
        {item.phone ? <Text style={s.cardPhone}>{item.phone}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );

  const renderDoctor = ({ item }: { item: Doctor }) => (
    <TouchableOpacity style={s.card} onPress={() => router.push(`/health/find-care/doctor/${item.id}`)}>
      <View style={[s.cardIcon, { backgroundColor: '#ecfdf5' }]}>
        <Ionicons name="person-outline" size={28} color="#10b981" />
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardTitle}>{item.full_name}</Text>
        <Text style={s.cardSub}>{item.specialty}</Text>
        {item.facility_name ? <Text style={s.cardPhone}>{item.facility_name}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Find Care</Text>
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={20} color="#94a3b8" style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Search hospitals, clinics..."
          placeholderTextColor="#94a3b8"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => activeTab === 'facilities' ? searchFacilities() : searchDoctors()}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); activeTab === 'facilities' ? searchFacilities('') : searchDoctors(''); }}>
            <Ionicons name="close-circle" size={20} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.tabRow}>
        <TouchableOpacity
          style={[s.tab, activeTab === 'facilities' && s.tabActive]}
          onPress={() => setActiveTab('facilities')}
        >
          <Text style={[s.tabText, activeTab === 'facilities' && s.tabTextActive]}>Hospitals</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, activeTab === 'doctors' && s.tabActive]}
          onPress={() => setActiveTab('doctors')}
        >
          <Text style={[s.tabText, activeTab === 'doctors' && s.tabTextActive]}>Doctors</Text>
        </TouchableOpacity>
      </View>

      {errorMsg ? (
        <View style={s.errorBox}>
          <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
          <Text style={s.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={refresh}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading && !refreshing ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 'facilities' ? renderFacility : renderDoctor}
          contentContainerStyle={data.length === 0 ? s.emptyContainer : s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons
                name={activeTab === 'facilities' ? 'business-outline' : 'people-outline'}
                size={64}
                color="#cbd5e1"
              />
              <Text style={s.emptyTitle}>{query ? 'No results' : `No ${activeTab}`}</Text>
              <Text style={s.emptySub}>Pull down to refresh.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#0c4a6e' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    margin: 12, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1e293b' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: '#e2e8f0', marginHorizontal: 4 },
  tabActive: { backgroundColor: '#0c4a6e' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#64748b', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  cardIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f0f9ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  cardSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  cardPhone: { fontSize: 12, color: '#0ea5e9', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBox: { marginHorizontal: 12, marginBottom: 12, backgroundColor: '#fef2f2', borderRadius: 12, padding: 16, alignItems: 'center' },
  errorText: { color: '#ef4444', fontSize: 14, marginTop: 8, textAlign: 'center' },
  retryBtn: { marginTop: 10, backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});
