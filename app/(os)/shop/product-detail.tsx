import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useMarketplace } from '../../../domains/shop/hooks/useMarketplace';

export default function ShopProductDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getProduct, addToCart } = useMarketplace();

  const product = getProduct?.(id as string);

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome5 name="arrow-left" size={20} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.title}>Product Details</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/shop/cart')}>
          <FontAwesome5 name="shopping-cart" size={18} color="#1E40AF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.imagePlaceholder}>
          <FontAwesome5 name="image" size={48} color="#CBD5E1" />
        </View>

        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>KES {product.price?.toLocaleString()}</Text>
        <Text style={styles.productDesc}>{product.description || 'No description available.'}</Text>

        <View style={styles.sellerRow}>
          <FontAwesome5 name="store" size={14} color="#64748B" />
          <Text style={styles.sellerText}>Sold by {product.seller_name || 'Unknown'}</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            addToCart?.(product);
            router.push('/(os)/shop/cart');
          }}
        >
          <FontAwesome5 name="cart-plus" size={16} color="#FFFFFF" />
          <Text style={styles.addText}>Add to Cart</Text>
        </TouchableOpacity>
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
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  content: { padding: 16 },
  error: { fontSize: 16, color: '#DC2626', textAlign: 'center', marginTop: 40 },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  productName: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  productPrice: { fontSize: 20, fontWeight: '700', color: '#059669', marginTop: 8 },
  productDesc: { fontSize: 14, color: '#64748B', marginTop: 12, lineHeight: 20 },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sellerText: { fontSize: 13, color: '#64748B' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 10,
  },
  addText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
