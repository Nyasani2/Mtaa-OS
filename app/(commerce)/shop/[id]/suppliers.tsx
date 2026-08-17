import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase/client';

interface Supplier { id: string; name: string; contact_name?: string; phone?: string; email?: string; status: 'active' | 'inactive'; products_count: number; }

export default function ShopSuppliersScreen() {
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  async function fetchSuppliers() {
    if (!shopId) return;
    setLoading(true);
    const { data } = await supabase.from('shop_suppliers').select('*').eq('shop_id', shopId).order('name');
    if (data) setSuppliers(data);
    setLoading(false);
  }

  useEffect(() => { fetchSuppliers(); }, [shopId]);
  const onRefresh = async () => { setRefreshing(true); await fetchSuppliers(); setRefreshing(false); };

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || (s.contact_name && s.contact_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Suppliers</Text>
        <Text style={styles.headerSub}>{suppliers.length} suppliers</Text>
      </View>
      <View style={styles.searchWrap}>
        <TextInput style={styles.searchInput} placeholder="Search suppliers..." value={search} onChangeText={setSearch} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.supplierCard}>
            <View style={styles.supplierInfo}>
              <Text style={styles.supplierName}>{item.name}</Text>
              {item.contact_name && <Text style={styles.supplierMeta}>Contact: {item.contact_name}</Text>}
              {item.phone && <Text style={styles.supplierMeta}>📞 {item.phone}</Text>}
              <View style={styles.supplierTags}>
                <View style={[styles.statusTag, { backgroundColor: item.status === 'active' ? '#D1FAE5' : '#F3F4F6' }]}>
                  <Text style={[styles.statusTagText, { color: item.status === 'active' ? '#065F46' : '#6B7280' }]}>{item.status}</Text>
                </View>
                <Text style={styles.productsCount}>{item.products_count || 0} products</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No suppliers yet</Text>
            <Text style={styles.emptySub}>Add suppliers to track purchase orders</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.addBtn} onPress={() => Alert.alert('Coming Soon', 'Supplier creation in next update')}>
        <Text style={styles.addBtnText}>➕ Add Supplier</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, paddingTop: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 14, color: '#64748B', marginTop: 4 },
  searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
  searchInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 15 },
  supplierCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 8, padding: 14, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  supplierInfo: { flex: 1 },
  supplierName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  supplierMeta: { fontSize: 13, color: '#64748B', marginTop: 2 },
  supplierTags: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusTagText: { fontSize: 11, fontWeight: '600' },
  productsCount: { fontSize: 12, color: '#94A3B8' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#64748B' },
  emptySub: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  addBtn: { backgroundColor: '#2196F3', margin: 20, padding: 16, borderRadius: 12, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
