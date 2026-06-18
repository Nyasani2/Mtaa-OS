import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/useAuthStore';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Package, AlertTriangle, Search, Filter, Plus, TrendingDown, Calendar } from 'lucide-react-native';

interface InventoryItem {
  id: string; medication_name: string; generic_name: string; category: string;
  stock_quantity: number; reorder_level: number; unit: string;
  batch_number: string; expiry_date: string; supplier: string;
  unit_cost: number; location: string;
}

export default function PharmacyInventoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => { loadInventory(); }, []);

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacy_inventory')
        .select('*')
        .order('medication_name', { ascending: true });
      if (error) throw error;
      setInventory(data || []);
    } catch (err) { Alert.alert('Error', 'Failed to load inventory'); }
  };

  const filtered = inventory.filter(item => {
    if (searchQuery && !item.medication_name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.generic_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterCategory && item.category !== filterCategory) return false;
    if (showLowStock && item.stock_quantity > item.reorder_level) return false;
    if (showExpired && new Date(item.expiry_date) > new Date()) return false;
    return true;
  });

  const categories = [...new Set(inventory.map(i => i.category))];
  const lowStockCount = inventory.filter(i => i.stock_quantity <= i.reorder_level).length;
  const expiredCount = inventory.filter(i => new Date(i.expiry_date) <= new Date()).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Alerts */}
      {(lowStockCount > 0 || expiredCount > 0) && (
        <View style={styles.alertBar}>
          {lowStockCount > 0 && (
            <TouchableOpacity style={[styles.alertPill, showLowStock && styles.alertPillActive]} onPress={() => setShowLowStock(!showLowStock)}>
              <TrendingDown size={14} color={showLowStock ? '#fff' : '#f59e0b'} />
              <Text style={[styles.alertPillText, showLowStock && styles.alertPillTextActive]}>{lowStockCount} Low Stock</Text>
            </TouchableOpacity>
          )}
          {expiredCount > 0 && (
            <TouchableOpacity style={[styles.alertPill, showExpired && styles.alertPillActive]} onPress={() => setShowExpired(!showExpired)}>
              <AlertTriangle size={14} color={showExpired ? '#fff' : '#ef4444'} />
              <Text style={[styles.alertPillText, showExpired && styles.alertPillTextActive]}>{expiredCount} Expired</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Search */}
      <View style={styles.searchBar}>
        <Search size={18} color="#64748b" />
        <TextInput style={styles.searchInput} placeholder="Search medication..." placeholderTextColor="#64748b"
          value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {/* Category filter */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, !filterCategory && styles.tabActive]} onPress={() => setFilterCategory(null)}>
          <Text style={[styles.tabText, !filterCategory && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>
        {categories.slice(0, 4).map(c => (
          <TouchableOpacity key={c} style={[styles.tab, filterCategory === c && styles.tabActive]} onPress={() => setFilterCategory(filterCategory === c ? null : c)}>
            <Text style={[styles.tabText, filterCategory === c && styles.tabTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Inventory List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const isLow = item.stock_quantity <= item.reorder_level;
          const isExpired = new Date(item.expiry_date) <= new Date();
          const nearExpiry = !isExpired && (new Date(item.expiry_date).getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000;

          return (
            <View style={[styles.itemCard, isLow && styles.itemCardLow, isExpired && styles.itemCardExpired]}>
              <View style={styles.itemHeader}>
                <View>
                  <Text style={styles.itemName}>{item.medication_name}</Text>
                  <Text style={styles.itemGeneric}>{item.generic_name}</Text>
                </View>
                <View style={styles.stockBadge}>
                  <Text style={[styles.stockText, isLow && styles.stockTextLow]}>{item.stock_quantity} {item.unit}</Text>
                </View>
              </View>

              <View style={styles.itemMeta}>
                <Text style={styles.metaText}>Batch: {item.batch_number}</Text>
                <View style={styles.expiryRow}>
                  <Calendar size={12} color={isExpired ? '#ef4444' : nearExpiry ? '#f59e0b' : '#64748b'} />
                  <Text style={[styles.metaText, isExpired && { color: '#ef4444' }, nearExpiry && { color: '#f59e0b' }]}>
                    Exp: {new Date(item.expiry_date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.metaText}>Supplier: {item.supplier}</Text>
                <Text style={styles.metaText}>Location: {item.location}</Text>
              </View>

              {isLow && (
                <View style={styles.reorderBanner}>
                  <TrendingDown size={14} color="#f59e0b" />
                  <Text style={styles.reorderText}>Below reorder level ({item.reorder_level} {item.unit})</Text>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Package size={48} color="#334155" />
            <Text style={styles.emptyTitle}>No items found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  alertBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  alertPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#334155' },
  alertPillActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  alertPillText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  alertPillTextActive: { color: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, marginHorizontal: 16, paddingHorizontal: 12, marginBottom: 8 },
  searchInput: { flex: 1, color: '#fff', paddingVertical: 10, marginLeft: 8, fontSize: 14 },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1e293b', borderRadius: 12, padding: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  itemCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12 },
  itemCardLow: { borderLeftWidth: 3, borderLeftColor: '#f59e0b' },
  itemCardExpired: { borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  itemName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  itemGeneric: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  stockBadge: { backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  stockText: { color: '#22c55e', fontSize: 12, fontWeight: '700' },
  stockTextLow: { color: '#f59e0b' },
  itemMeta: { gap: 6 },
  metaText: { color: '#64748b', fontSize: 12 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reorderBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: '#451a03', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  reorderText: { color: '#f59e0b', fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: '#94a3b8', fontSize: 18, fontWeight: '700', marginTop: 16 },
});
