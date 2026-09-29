// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function ShopInventoryScreen() {
  const { id: shopId } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shop_inventory')
        .select('*')
        .eq('shop_id', shopId)
        .order('name', { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shopId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const adjustStock = async (item: any, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    try {
      const { error } = await supabase
        .from('shop_inventory')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('id', item.id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.barcode && i.barcode.includes(search)));

  const renderItem = ({ item }: any) => (
    <View style={styles.itemCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMeta}>KES {item.selling_price} · Stock: {item.quantity}</Text>
        {item.barcode && <Text style={styles.itemBarcode}>Barcode: {item.barcode}</Text>}
      </View>
      <View style={styles.stockControls}>
        <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustStock(item, -1)}>
          <Ionicons name="remove" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity style={styles.ctrlBtn} onPress={() => adjustStock(item, 1)}>
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity onPress={() => router.push(`/(commerce)/shop/${shopId}/qr-scan`)}>
          <Ionicons name="qr-code" size={24} color="#22c55e" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#64748b" />
        <TextInput style={styles.searchInput} placeholder="Search products or barcodes..." value={search} onChangeText={setSearch} placeholderTextColor="#64748b" />
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        ListEmptyComponent={<Text style={styles.emptyText}>{loading ? 'Loading...' : 'No items found'}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', marginHorizontal: 16, marginBottom: 16, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, marginLeft: 8, color: '#fff', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  emptyText: { textAlign: 'center', color: '#64748b', marginTop: 40, fontSize: 16 },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  itemMeta: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  itemBarcode: { fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: 'monospace' },
  stockControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ctrlBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 16, fontWeight: '700', color: '#fff', minWidth: 24, textAlign: 'center' },
});
