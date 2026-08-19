import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface Shop {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  category: string;
  status: string;
  logo_url: string | null;
  cover_image_url: string | null;
  rating: number;
  review_count: number;
  total_sales: number;
  total_orders: number;
  is_verified: boolean;
  settings: any;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  selling_price: number;
  stock_quantity: number;
  images: string[] | null;
  status: string;
}

export default function ShopDashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchShop = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setShop(data);
    } catch (err) {
      console.error('[ShopDashboard] fetch shop error:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, selling_price, stock_quantity, images, is_active')
        .eq('shop_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('[ShopDashboard] fetch products error:', err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchShop(), fetchProducts()]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchShop(), fetchProducts()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  if (loading) {
      const pickCover = () => {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0]; if (!file) return;
      const path = 'shop-cover-' + Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.]+/g, '_');
      const { error } = await supabase.storage.from('shop-products').upload(path, file, { contentType: file.type, upsert: false });
      if (error) { Alert.alert('Cover', error.message); return; }
      const url = supabase.storage.from('shop-products').getPublicUrl(path).publicUrl;
      await supabase.from('shops').update({ cover_image: url }).eq('id', id);
      setShop((prev) => ({ ...prev, cover_image: url }));
    };
    input.click();
  };

return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.center}>
        <Text>Shop not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Cover Image */}
      <View style={styles.coverContainer}>
        {shop.cover_image_url ? (
          <Image source={{ uri: shop.cover_image_url }} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverImage, styles.coverPlaceholder]}>
            <TouchableOpacity onPress={() => {
                if (typeof document === 'undefined') return;
                const inp = document.createElement('input');
                inp.type = 'file'; inp.accept = 'image/*';
                inp.onchange = async (ev) => {
                  const f = ev.target.files?.[0]; if (!f) return;
                  const path = 'covers/' + id + '-' + Date.now() + '-' + f.name.replace(/[^a-zA-Z0-9.]+/g, '_');
                  const { error } = await supabase.storage.from('shop-products').upload(path, f, { contentType: f.type, upsert: true });
                  if (error) { alert('Upload failed: ' + error.message); return; }
                  const pub = supabase.storage.from('shop-products').getPublicUrl(path);
                  const { error: ue } = await supabase.from('shops').update({ cover_image: pub.publicUrl }).eq('id', id);
                  if (ue) { alert('DB save failed: ' + ue.message); return; }
                  if (typeof setShop === 'function') setShop((prev) => prev ? { ...prev, cover_image: pub.publicUrl } : prev);
                  alert('✅ Cover photo saved');
                };
                inp.click();
              }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#333', fontWeight: '700' }}>📷 Add Cover Photo</Text>
        </TouchableOpacity>
          </View>
        )}
        <View style={styles.overlay} />
      </View>

      {/* Shop Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          {shop.logo_url ? (
            <Image source={{ uri: shop.logo_url }} style={styles.logo} />
          ) : (
            <View style={[styles.logo, styles.logoPlaceholder]}>
              <Text style={styles.logoText}>🏪</Text>
            </View>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.shopName}>{shop.name}</Text>
          <Text style={styles.shopCategory}>{shop.category}</Text>
          {shop.address && <Text style={styles.shopAddress}>📍 {shop.address}</Text>}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, shop.is_verified ? styles.verifiedBadge : styles.unverifiedBadge]}>
              <Text style={[styles.badgeText, shop.is_verified ? styles.verifiedText : styles.unverifiedText]}>
                {shop.is_verified ? '✓ Verified' : '⏳ Unverified'}
              </Text>
            </View>
            <View style={[styles.badge, styles.statusBadge]}>
              <Text style={styles.statusText}>{shop.status}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{shop.total_orders}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{shop.total_sales}</Text>
          <Text style={styles.statLabel}>Sales</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{shop.rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{products.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push(`/(commerce)/shop/${id}/products/add`)}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionLabel}>Add Product</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push(`/(commerce)/shop/${id}/products`)}
          >
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionLabel}>All Products</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionLabel}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Products</Text>
          <TouchableOpacity onPress={() => router.push(`/(commerce)/shop/${id}/products`)}>
            <Text style={styles.link}>See All</Text>
          </TouchableOpacity>
        </View>

        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.emptySubtitle}>Add your first product to start selling</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push(`/(commerce)/shop/${id}/products/add`)}
            >
              <Text style={styles.emptyButtonText}>Add First Product</Text>
            </TouchableOpacity>
          </View>
        ) : (
          products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productImageContainer}>
                {product.images && product.images.length > 0 ? (
                  <Image source={{ uri: product.images[0] }} style={styles.productImage} />
                ) : (
                  <View style={[styles.productImage, styles.productImagePlaceholder]}>
                    <Text>📷</Text>
                  </View>
                )}
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>KES {product.selling_price}</Text>
                <Text style={styles.productStock}>Stock: {product.stock_quantity}</Text>
              </View>
              <View style={[styles.statusBadgeSmall, product.status === 'active' ? styles.activeBadge : styles.inactiveBadge]}>
                <Text style={styles.statusBadgeText}>{product.status}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  coverContainer: { height: 150, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  coverPlaceholderText: { color: '#666', fontSize: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
  header: { flexDirection: 'row', padding: 16, marginTop: -40 },
  logoContainer: { marginRight: 12 },
  logo: { width: 80, height: 80, borderRadius: 12, borderWidth: 3, borderColor: '#fff' },
  logoPlaceholder: { backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 32 },
  headerInfo: { flex: 1, justifyContent: 'center' },
  shopName: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  shopCategory: { fontSize: 14, color: '#666', marginTop: 2 },
  shopAddress: { fontSize: 13, color: '#888', marginTop: 2 },
  badgeRow: { flexDirection: 'row', marginTop: 6, gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  verifiedBadge: { backgroundColor: '#d4edda' },
  verifiedText: { color: '#155724' },
  unverifiedBadge: { backgroundColor: '#fff3cd' },
  unverifiedText: { color: '#856404' },
  statusBadge: { backgroundColor: '#e7f3ff' },
  statusText: { color: '#007AFF', fontSize: 11, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 8, gap: 8 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  link: { color: '#007AFF', fontSize: 14 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionCard: { width: '23%', backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 11, color: '#333', marginTop: 4, textAlign: 'center' },
  emptyState: { backgroundColor: '#fff', borderRadius: 12, padding: 32, alignItems: 'center' },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 12, color: '#333' },
  emptySubtitle: { fontSize: 13, color: '#888', marginTop: 4, textAlign: 'center' },
  emptyButton: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 16 },
  emptyButtonText: { color: '#fff', fontWeight: '600' },
  productCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, alignItems: 'center' },
  productImageContainer: { marginRight: 12 },
  productImage: { width: 60, height: 60, borderRadius: 8 },
  productImagePlaceholder: { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: '#111' },
  productPrice: { fontSize: 14, color: '#007AFF', fontWeight: '600', marginTop: 2 },
  productStock: { fontSize: 12, color: '#888', marginTop: 2 },
  statusBadgeSmall: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  activeBadge: { backgroundColor: '#d4edda' },
  inactiveBadge: { backgroundColor: '#f8d7da' },
  statusBadgeText: { fontSize: 10, fontWeight: '600' },
});
