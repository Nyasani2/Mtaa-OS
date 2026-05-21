// app/(os)/health/hospitals.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { HospitalService } from '@/lib/health/services/hospital.service';
import { HealthHospital } from '@/lib/health/types';
import { Ionicons } from '@expo/vector-icons';

export default function HospitalsScreen() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<HealthHospital[]>([]);
  const [filtered, setFiltered] = useState<HealthHospital[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'emergency'>('all');

  useEffect(() => { loadHospitals(); }, []);

  useEffect(() => {
    let result = hospitals;
    if (search) {
      result = result.filter(h => 
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.county_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filter === 'emergency') result = result.filter(h => h.emergency_services);
    setFiltered(result);
  }, [hospitals, search, filter]);

  const loadHospitals = async () => {
    try {
      setIsLoading(true);
      const data = await HospitalService.getHospitals();
      setHospitals(data); setFiltered(data);
    } catch (err) { console.error('Failed to load hospitals:', err); }
    finally { setIsLoading(false); }
  };

  const renderHospital = ({ item }: { item: HealthHospital }) => (
    <TouchableOpacity style={styles.hospitalCard} onPress={() => router.push(`/health/hospital/${item.id}` as any)}>
      <View style={styles.hospitalHeader}>
        <View style={styles.hospitalIcon}><Ionicons name="medical" size={24} color="#EF4444" /></View>
        <View style={styles.hospitalInfo}>
          <Text style={styles.hospitalName}>{item.name}</Text>
          <Text style={styles.hospitalType}>{item.hospital_type} • Level {item.level}</Text>
        </View>
      </View>
      <View style={styles.hospitalDetails}>
        <View style={styles.detailItem}><Ionicons name="location" size={14} color="#64748B" /><Text style={styles.detailText}>{item.county_name || 'Unknown location'}</Text></View>
        <View style={styles.detailItem}><Ionicons name="bed" size={14} color="#64748B" /><Text style={styles.detailText}>{item.bed_capacity} beds</Text></View>
      </View>
      <View style={styles.badges}>
        {item.emergency_services && (<View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}><Text style={[styles.badgeText, { color: '#EF4444' }]}>24h Emergency</Text></View>)}
        {item.sha_accredited && (<View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}><Text style={[styles.badgeText, { color: '#10B981' }]}>SHA</Text></View>)}
        {item.nhif_accredited && (<View style={[styles.badge, { backgroundColor: '#DBEAFE' }]}><Text style={[styles.badgeText, { color: '#3B82F6' }]}>NHIF</Text></View>)}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Find Hospital</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput style={styles.searchInput} placeholder="Search hospitals..." value={search} onChangeText={setSearch} />
      </View>
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]} onPress={() => setFilter('all')}>
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, filter === 'emergency' && styles.filterButtonActive]} onPress={() => setFilter('emergency')}>
          <Text style={[styles.filterText, filter === 'emergency' && styles.filterTextActive]}>Emergency</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (<ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />) : (
        <FlatList data={filtered} renderItem={renderHospital} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 16, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F1F5F9' },
  filterButtonActive: { backgroundColor: '#3B82F6' },
  filterText: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  filterTextActive: { color: '#FFF' },
  list: { padding: 16, gap: 12 },
  hospitalCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  hospitalHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  hospitalIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  hospitalInfo: { flex: 1 },
  hospitalName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  hospitalType: { fontSize: 12, color: '#64748B', marginTop: 2 },
  hospitalDetails: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, color: '#64748B' },
  badges: { flexDirection: 'row', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  loader: { flex: 1, justifyContent: 'center' },
});
