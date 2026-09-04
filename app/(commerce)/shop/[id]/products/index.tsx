import React, { useState, useEffect } from 'react';

import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string | null;
  selling_price: number;
  stock_quantity: number;
  images: string[] | null;
  barcode: string | null;
  category: string | null;
  status?: string;
  tax_rate?: number;
  cover_image?: string;
  location?: string;
  created_at: string;
}

export default function ProductListScreen() {
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('[ProductList] Error:', err);
    }
  };

  const load = async () => {
    setLoading(true);
    await fetchProducts();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, [shopId]);

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>📷</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.category && <Text style={styles.category}>{item.category}</Text>}
        <Text style={styles.selling_price}>KES {item.selling_price}</Text>
        <Text style={styles.stock}>Stock: {item.stock_quantity}</Text>
        {item.barcode && <Text style={styles.barcode}>Barcode: {item.barcode}</Text>}
      </View>
      <View style={[styles.statusBadge, item.status === 'active' ? styles.active : styles.inactive]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Products ({products.length})</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push(`/(commerce)/shop/${shopId}/products/add`)}
        >
          <Text style={styles.addBtnText}>➕ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No products yet</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push(`/(commerce)/shop/${shopId}/products/add`)}
            >
              <Text style={styles.emptyBtnText}>Add Your First Product</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  addBtn: { backgroundColor: '#007AFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  list: { padding: 12 },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12,
    marginBottom: 10, alignItems: 'center',
  },
  imageContainer: { marginRight: 12 },
  image: { width: 70, height: 70, borderRadius: 8 },
  imagePlaceholder: { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111' },
  category: { fontSize: 12, color: '#888', marginTop: 2 },
  selling_price: { fontSize: 15, color: '#007AFF', fontWeight: 'bold', marginTop: 4 },
  stock: { fontSize: 12, color: '#666', marginTop: 2 },
  barcode: { fontSize: 11, color: '#999', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 8 },
  active: { backgroundColor: '#d4edda' },
  inactive: { backgroundColor: '#f8d7da' },
  statusText: { fontSize: 10, fontWeight: '600' },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 12, color: '#333' },
  emptyBtn: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 16 },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
});
