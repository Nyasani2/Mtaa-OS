// domains/shop/components/POSScreen.tsx
// Point of Sale screen component for MTAA Shop
// Imported by: app/(commerce)/shop/[id]/pos.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface POSProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  stock: number;
  category: string;
  image?: string;
}

export interface CartItem extends POSProduct {
  quantity: number;
}

export interface POSScreenProps {
  products: POSProduct[];
  shopName?: string;
  currency?: string;
  onCheckout?: (items: CartItem[], total: number) => void;
  onAddProduct?: () => void;
}

export default function POSScreen({ products, shopName, currency = 'KES', onCheckout, onAddProduct }: POSScreenProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: POSProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          Alert.alert('Out of Stock', 'Cannot add more of this item.');
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter((item) => item.id !== productId);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const renderProduct = ({ item }: { item: POSProduct }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => addToCart(item)}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productPrice}>{currency} {item.price.toLocaleString()}</Text>
        <Text style={styles.productStock}>Stock: {item.stock}</Text>
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.shopName}>{shopName || 'POS'}</Text>
        <View style={styles.cartBadge}>
          <Ionicons name="cart-outline" size={22} color="#2563eb" />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === item && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={[styles.categoryText, selectedCategory === item && styles.categoryTextActive]}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Products */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.productList}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No products found</Text>
            <TouchableOpacity style={styles.addProductBtn} onPress={onAddProduct}>
              <Text style={styles.addProductText}>+ Add Product</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Cart Summary */}
      {cart.length > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartCount}>{cartCount} items</Text>
            <Text style={styles.cartTotal}>{currency} {cartTotal.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => onCheckout?.(cart, cartTotal)}
          >
            <Text style={styles.checkoutText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  shopName: { fontSize: 20, fontWeight: '700', color: '#0a0a0a' },
  cartBadge: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: '#0a0a0a' },
  categories: { paddingHorizontal: 12, paddingBottom: 8 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: '#2563eb' },
  categoryText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  categoryTextActive: { color: '#fff' },
  productList: { padding: 12 },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: '#0a0a0a' },
  productCategory: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  productPrice: { fontSize: 15, fontWeight: '700', color: '#2563eb', marginTop: 4 },
  productStock: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#6b7280', marginBottom: 16 },
  addProductBtn: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  addProductText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cartInfo: { flex: 1 },
  cartCount: { fontSize: 13, color: '#6b7280' },
  cartTotal: { fontSize: 18, fontWeight: '700', color: '#0a0a0a' },
  checkoutBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  checkoutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
