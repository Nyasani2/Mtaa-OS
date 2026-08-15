// domains/shop/components/MarketplaceBrowser.tsx
// Marketplace browser component for MTAA Shop
// Imported by: app/(commerce)/shop/browse.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface MarketplaceItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  shopName: string;
  shopId: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  category: string;
}

export interface MarketplaceBrowserProps {
  items: MarketplaceItem[];
  onSelectItem?: (item: MarketplaceItem) => void;
  onSelectShop?: (shopId: string) => void;
  loading?: boolean;
}

export default function MarketplaceBrowser({ items, onSelectItem, onSelectShop, loading }: MarketplaceBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(items.map((i) => i.category)))];

  const filtered = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shopName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderItem = ({ item }: { item: MarketplaceItem }) => (
    <TouchableOpacity style={styles.itemCard} onPress={() => onSelectItem?.(item)}>
      <Image
        source={{ uri: item.image || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }}
        style={styles.itemImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <TouchableOpacity onPress={() => onSelectShop?.(item.shopId)}>
          <Text style={styles.shopName}>{item.shopName}</Text>
        </TouchableOpacity>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#f59e0b" />
          <Text style={styles.ratingText}>{item.rating || 0} ({item.reviewCount || 0})</Text>
        </View>
        <Text style={styles.itemPrice}>{item.currency} {item.price.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search marketplace..."
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

      {/* Items */}
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          numColumns={2}
          columnWrapperStyle={styles.column}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="basket-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No items found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
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
  list: { padding: 12 },
  column: { justifyContent: 'space-between' },
  itemCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemImage: { width: '100%', height: 140 },
  itemInfo: { padding: 10 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#0a0a0a', minHeight: 36 },
  shopName: { fontSize: 12, color: '#2563eb', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 12, color: '#6b7280', marginLeft: 4 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#0a0a0a', marginTop: 6 },
  loadingText: { textAlign: 'center', marginTop: 40, color: '#6b7280' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#6b7280', marginTop: 12 },
});
