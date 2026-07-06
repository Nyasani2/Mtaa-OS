import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Truck, Phone, Mail, Plus, Search } from 'lucide-react-native';
import { supabase } from '@/lib/supabase/client';
import { useHealthRole } from '@/lib/health/hooks';

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
}

export default function PharmacySuppliersScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchSuppliers(); }, [staffRecord?.facility_id]);

  const fetchSuppliers = async () => {
    if (!staffRecord?.facility_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_suppliers')
        .select('id, name, contact_person, phone, email, status')
        .eq('facility_id', staffRecord.facility_id)
        .order('name', { ascending: true });
      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error('Suppliers error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filtered = suppliers.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.contact_person?.toLowerCase().includes(search.toLowerCase()));

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSuppliers(); }} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Suppliers</Text>
      </View>

      <View style={styles.searchBox}>
        <Search size={18} color="#9ca3af" />
        <TextInput style={styles.searchInput} placeholder="Search suppliers..." value={search} onChangeText={setSearch} placeholderTextColor="#9ca3af" />
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Truck size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No suppliers found</Text>
        </View>
      ) : (
        filtered.map((s) => (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Truck size={20} color="#f97316" />
              <Text style={styles.supplierName}>{s.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: s.status === 'active' ? '#22c55e20' : '#9ca3af20' }]}>
                <Text style={[styles.statusText, { color: s.status === 'active' ? '#22c55e' : '#6b7280' }]}>{s.status}</Text>
              </View>
            </View>
            <Text style={styles.contactPerson}>{s.contact_person || 'No contact'}</Text>
            <View style={styles.contactRow}>
              {s.phone && <View style={styles.contactItem}><Phone size={14} color="#6b7280" /><Text style={styles.contactText}>{s.phone}</Text></View>}
              {s.email && <View style={styles.contactItem}><Mail size={14} color="#6b7280" /><Text style={styles.contactText}>{s.email}</Text></View>}
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  supplierName: { fontSize: 15, fontWeight: '700', color: '#1f2937', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  contactPerson: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  contactRow: { flexDirection: 'row', gap: 16 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  contactText: { fontSize: 12, color: '#6b7280' },
});
