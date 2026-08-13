import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ShopItem {
  id: string;
  name: string;
  price: number;
  image: string | null;
  type: 'merch' | 'digital' | 'affiliate';
}

const MOCK_ITEMS: ShopItem[] = [
  { id: '1', name: 'Creator Hoodie', price: 45.00, image: null, type: 'merch' },
  { id: '2', name: 'Digital Art Pack', price: 12.99, image: null, type: 'digital' },
  { id: '3', name: 'Preset Bundle', price: 19.99, image: null, type: 'digital' },
  { id: '4', name: 'Affiliate Headphones', price: 89.00, image: null, type: 'affiliate' },
];

export default function ShopScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'merch' | 'digital' | 'affiliate'>('merch');

  const filteredItems = MOCK_ITEMS.filter((i: any) => i.type === activeTab);

  const openMarketplace = useCallback(() => {
    router.push('/(os)/marketplace' as any);
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Streets Shop</Text>
        <TouchableOpacity onPress={openMarketplace} style={styles.backBtn}>
          <Ionicons name="bag" size={22} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="cart" size={36} color="#2196F3" />
        </View>
        <Text style={styles.heroTitle}>Creator Shop</Text>
        <Text style={styles.heroSubtitle}>
          Sell merchandise, digital products, and affiliate items. Powered by MTAA Marketplace.
        </Text>
        <TouchableOpacity style={styles.heroBtn} onPress={openMarketplace}>
          <Text style={styles.heroBtnText}>Open Marketplace</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'merch' && styles.tabActive]}
          onPress={() => setActiveTab('merch')}
        >
          <Text style={[styles.tabText, activeTab === 'merch' && styles.tabTextActive]}>Merch</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'digital' && styles.tabActive]}
          onPress={() => setActiveTab('digital')}
        >
          <Text style={[styles.tabText, activeTab === 'digital' && styles.tabTextActive]}>Digital</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'affiliate' && styles.tabActive]}
          onPress={() => setActiveTab('affiliate')}
        >
          <Text style={[styles.tabText, activeTab === 'affiliate' && styles.tabTextActive]}>Affiliate</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {filteredItems.map((item: any) => (
          <TouchableOpacity key={item.id} style={styles.itemCard} onPress={openMarketplace}>
            <View style={styles.itemImage}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImg} />
              ) : (
                <Ionicons name="cube" size={32} color="#555" />
              )}
            </View>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
          </TouchableOpacity>
        ))}
        {filteredItems.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No items in this category yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  hero: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0d1f33',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  heroSubtitle: { color: '#aaa', fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  heroBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2196F3' },
  tabText: { color: '#888', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
    justifyContent: 'space-between',
  },
  itemCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 12,
    width: (width - 56) / 2,
  },
  itemImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemImg: { width: '100%', height: '100%', borderRadius: 8 },
  itemName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  itemPrice: { color: '#4CAF50', fontSize: 14, fontWeight: '700', marginTop: 4 },
  empty: { width: '100%', alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#666', fontSize: 14 },
});
