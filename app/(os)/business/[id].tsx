// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function BusinessPublicProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [business, setBusiness] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadBusinessData(); }, [id]);

  const loadBusinessData = async () => {
    setLoading(true);
    try {
      const { data: bizData } = await supabase.from('businesses').select('*').eq('id', id).single();
      setBusiness(bizData);

      if (bizData) {
        const type = (bizData.category || bizData.business_type || '').toLowerCase();
        
        if (type.includes('restaurant') || type.includes('food')) {
          const { data: menu } = await supabase
            .from('restaurant_menu_items') // Adjust to your actual menu table name if different
            .select('id, name, description, price, category, image_url')
            .eq('business_id', id)
            .eq('is_available', true);
          setMenuItems(menu || []);
        } else if (type.includes('shop') || type.includes('retail')) {
          const { data: prods } = await supabase
            .from('shop_products') // Adjust to your actual products table name if different
            .select('id, name, description, price, category, image_url, stock')
            .eq('business_id', id)
            .eq('is_active', true);
          setProducts(prods || []);
        }
      }
    } catch (err) {
      console.error('Load business error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  if (!business) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>Business not found</Text>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backBtnText}>Go Back</Text></TouchableOpacity>
    </View>
  );

  const businessType = (business.category || business.business_type || '').toLowerCase();
  const isRestaurant = businessType.includes('restaurant') || businessType.includes('food');
  const isShop = businessType.includes('shop') || businessType.includes('retail');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.cover}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.avatar}><Ionicons name="business" size={40} color="#fff" /></View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.name}>{business.name}</Text>
        <Text style={styles.category}>{business.category || business.business_type}</Text>
        {business.description && <Text style={styles.description}>{business.description}</Text>}
        <View style={styles.statsRow}>
          <View style={styles.stat}><Ionicons name="star" size={16} color="#f59e0b" /><Text style={styles.statText}>{business.rating || '4.5'} Rating</Text></View>
          <View style={styles.stat}><Ionicons name="location" size={16} color="#3b82f6" /><Text style={styles.statText}>{business.location || 'Nairobi, KE'}</Text></View>
        </View>
      </View>

      <View style={styles.contentSection}>
        {isRestaurant && (
          <>
            <Text style={styles.sectionTitle}>Menu</Text>
            {menuItems.length === 0 ? <Text style={styles.emptyText}>No menu items available yet.</Text> : (
              menuItems.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                    <Text style={styles.itemPrice}>KES {item.price}</Text>
                  </View>
                  {item.image_url && <Image source={{ uri: item.image_url }} style={styles.itemImage} />}
                </View>
              ))
            )}
          </>
        )}

        {isShop && (
          <>
            <Text style={styles.sectionTitle}>Products</Text>
            {products.length === 0 ? <Text style={styles.emptyText}>No products available yet.</Text> : (
              products.map((product) => (
                <View key={product.id} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{product.name}</Text>
                    <Text style={styles.itemDesc} numberOfLines={2}>{product.description}</Text>
                    <Text style={styles.itemPrice}>KES {product.price}</Text>
                    <Text style={styles.stockText}>{product.stock || 0} in stock</Text>
                  </View>
                  {product.image_url && <Image source={{ uri: product.image_url }} style={styles.itemImage} />}
                </View>
              ))
            )}
          </>
        )}

        {!isRestaurant && !isShop && (
          <View style={styles.genericInfo}>
            <Ionicons name="information-circle" size={48} color="#64748b" />
            <Text style={styles.emptyText}>This business does not have a public catalog configured yet.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  errorText: { color: '#ef4444', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  backBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: '600' },
  cover: { height: 160, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  backButton: { position: 'absolute', top: 50, left: 16, zIndex: 10, padding: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#0f172a', marginTop: 40 },
  infoSection: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  name: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', textAlign: 'center' },
  category: { fontSize: 14, color: '#3b82f6', textAlign: 'center', marginTop: 4, fontWeight: '600', textTransform: 'uppercase' },
  description: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 12, lineHeight: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 16 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: '#cbd5e1', fontSize: 14, fontWeight: '500' },
  contentSection: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginBottom: 16 },
  itemCard: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 12, alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  itemDesc: { fontSize: 13, color: '#94a3b8', marginTop: 4, lineHeight: 18 },
  itemPrice: { fontSize: 16, fontWeight: '700', color: '#10b981', marginTop: 8 },
  stockText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  itemImage: { width: 60, height: 60, borderRadius: 8, marginLeft: 12, backgroundColor: '#334155' },
  emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 20 },
  genericInfo: { alignItems: 'center', marginTop: 40 },
});
