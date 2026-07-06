import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Settings, AlertTriangle, CheckCircle2, Wrench, Search } from 'lucide-react-native';
import { supabase } from '@/lib/supabase/client';
import { useHealthRole } from '@/lib/health/hooks';

interface Equipment {
  id: string;
  name: string;
  model: string;
  status: 'operational' | 'maintenance' | 'broken';
  last_calibrated: string;
  next_calibration: string;
  location: string;
}

export default function LabEquipmentScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchEquipment(); }, [staffRecord?.facility_id]);

  const fetchEquipment = async () => {
    if (!staffRecord?.facility_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_lab_equipment')
        .select('id, name, model, status, last_calibrated, next_calibration, location')
        .eq('facility_id', staffRecord.facility_id)
        .order('name', { ascending: true });
      if (error) throw error;
      setEquipment(data || []);
    } catch (err) {
      console.error('Equipment error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'operational': return '#22c55e';
      case 'maintenance': return '#f59e0b';
      case 'broken': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const filtered = equipment.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEquipment(); }} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Equipment</Text>
      </View>

      <View style={styles.searchBox}>
        <Search size={18} color="#9ca3af" />
        <TextInput style={styles.searchInput} placeholder="Search equipment..." value={search} onChangeText={setSearch} placeholderTextColor="#9ca3af" />
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Settings size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No equipment found</Text>
        </View>
      ) : (
        filtered.map((e) => (
          <View key={e.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Settings size={20} color="#6366f1" />
              <View style={styles.equipInfo}>
                <Text style={styles.equipName}>{e.name}</Text>
                <Text style={styles.equipModel}>{e.model}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(e.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(e.status) }]}>{e.status}</Text>
              </View>
            </View>
            <Text style={styles.locationText}>Location: {e.location}</Text>
            <View style={styles.calRow}>
              <Text style={styles.calText}>Last: {e.last_calibrated ? new Date(e.last_calibrated).toLocaleDateString() : 'N/A'}</Text>
              <Text style={styles.calText}>Next: {e.next_calibration ? new Date(e.next_calibration).toLocaleDateString() : 'N/A'}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', gap: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1f2937' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginTop: 12 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  equipInfo: { flex: 1 },
  equipName: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  equipModel: { fontSize: 12, color: '#9ca3af' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  locationText: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  calRow: { flexDirection: 'row', justifyContent: 'space-between' },
  calText: { fontSize: 11, color: '#9ca3af' },
});
