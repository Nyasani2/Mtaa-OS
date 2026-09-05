import React, { useState } from 'react';
import { Alert, View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { useShopProducts } from '@/domains/shop/hooks/useShop';

export default function ShopInventoryScreen() {
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const { products, loading, refresh } = useShopProducts(shopId);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low' | 'out' | 'incoming'>('all');

  const filtered = products?.filter((p: any) => {
    if (filter === 'low') return p.stock_quantity > 0 && p.stock_quantity < 10;
    if (filter === 'out') return p.stock_quantity === 0;
    if (filter === 'incoming') return p.incoming_quantity > 0;
    return true;
  });

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  async function handleRestock(productId: string) {
    Alert.alert('Restock', 'Feature requires shop_restock_product RPC');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <Text style={styles.headerSub}>{products?.length || 0} products tracked</Text>
      </View>
      <View style={styles.filterRow}>
        {(['all', 'low', 'out', 'incoming'] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'low' ? 'Low' : f === 'out' ? 'Out' : 'Incoming'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item: any) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }: { item: any }) => (
          <View style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productMeta}>{item.category} · ${item.price}</Text>
              <View style={styles.stockRow}>
                <Text style={[styles.stockText, item.stock_quantity === 0 ? styles.stockOut : item.stock_quantity < 10 ? styles.stockLow : styles.stockOk]}>
                  Stock: {item.stock_quantity}
                </Text>
                {item.incoming_quantity > 0 && <Text style={styles.incomingText}>+{item.incoming_quantity} incoming</Text>}
              </View>
            </View>
            <TouchableOpacity style={styles.restockBtn} onPress={() => handleRestock(item.id)}>
              <Text style={styles.restockText}>➕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No products match this filter</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, paddingTop: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 14, color: '#64748B', marginTop: 4 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  filterBtnActive: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  filterText: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 8, padding: 14, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  productMeta: { fontSize: 13, color: '#64748B', marginTop: 2 },
  stockRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  stockText: { fontSize: 13, fontWeight: '600' },
  stockOk: { color: '#059669' },
  stockLow: { color: '#D97706' },
  stockOut: { color: '#DC2626' },
  incomingText: { fontSize: 13, color: '#2563EB', fontWeight: '500' },
  restockBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  restockText: { fontSize: 18 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#64748B' },
});
