import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { ShopDashboard } from '../../../domains/shop/components/ShopDashboard';
import { ShopQuickAccess } from '../../../domains/shop/components/ShopQuickAccess';
import { useShop } from '../../../domains/shop/hooks/useShop';

export default function ShopIndex() {
  const router = useRouter();
  const { shop, isLoading } = useShop();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/(os)/shop/cart')}>
          <FontAwesome5 name="shopping-cart" size={18} color="#1E40AF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ShopQuickAccess />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Shop</Text>
          <ShopDashboard shop={shop} isLoading={isLoading} />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/shop/create')}>
            <FontAwesome5 name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.actionText}>New Product</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#059669' }]} onPress={() => router.push('/(os)/shop/orders')}>
            <FontAwesome5 name="list" size={16} color="#FFFFFF" />
            <Text style={styles.actionText}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#7C3AED' }]} onPress={() => router.push('/(os)/shop/marketplace')}>
            <FontAwesome5 name="store" size={16} color="#FFFFFF" />
            <Text style={styles.actionText}>Marketplace</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { paddingHorizontal: 16 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 12 },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 30,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
