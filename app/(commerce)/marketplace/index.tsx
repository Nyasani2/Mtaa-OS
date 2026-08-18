// @ts-nocheck
// app/(commerce)/marketplace/index.tsx
// MTAA Marketplace — Full commerce shell
// Categories, Featured, Search, Filters, Affiliate CTA, Cart
// Uses: lib/marketplace/services/marketplace-service.ts

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { getListings } from '@/lib/marketplace/services/marketplace-service';
import type { Listing } from '@/lib/marketplace/types';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'grid' },
  { id: 'electronics', name: 'Electronics', icon: 'phone-portrait' },
  { id: 'fashion', name: 'Fashion', icon: 'shirt' },
  { id: 'home', name: 'Home', icon: 'home' },
  { id: 'food', name: 'Food', icon: 'restaurant' },
  { id: 'services', name: 'Services', icon: 'construct' },
  { id: 'vehicles', name: 'Vehicles', icon: 'car' },
  { id: 'property', name: 'Property', icon: 'business' },
  { id: 'jobs', name: 'Jobs', icon: 'briefcase' },
];

export default function MarketplaceIndexScreen() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [cartCount, setCartCount] = useState(0);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getListings(
        activeCategory === 'all' ? undefined : { category: activeCategory }
      );
      setListings(data);
      // Featured = top 5 by views or newest
      setFeatured(data.slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  }, [fetchListings]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/(commerce)/marketplace/search?q=${encodeURIComponent(searchQuery)}` as any);
    }
  };

  const handleCategoryPress = (catId: string) => {
    setActiveCategory(catId);
  };

  const handleListingPress = (listing: Listing) => {
    router.push(`/marketplace/listing/${listing.id}` as any);
  };

  const handleCartPress = () => {
    router.push('/(commerce)/marketplace/cart' as any);
  };

  const handleAffiliatePress = () => {
    router.push('/(commerce)/marketplace/affiliate' as any);
  };

  const handleSellPress = () => {
    router.push('/(commerce)/marketplace/sell' as any);
  };

  const formatPrice = (price: number, currency = 'KES') => {
    return `${currency} ${price.toLocaleString('en-KE')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MTAA Marketplace</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleSellPress}>
            <Ionicons name="add-circle" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleCartPress}>
            <Ionicons name="cart" size={24} color="#000" />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, services..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

        {/* Affiliate Banner */}
        <TouchableOpacity style={styles.affiliateBanner} onPress={handleAffiliatePress}>
          <View style={styles.affiliateContent}>
            <Ionicons name="gift" size={28} color="#fff" />
            <View style={styles.affiliateText}>
              <Text style={styles.affiliateTitle}>Earn as an Affiliate</Text>
              <Text style={styles.affiliateSubtitle}>Share products & earn commission</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryBtn, activeCategory === cat.id && styles.categoryBtnActive]}
              onPress={() => handleCategoryPress(cat.id)}
            >
              <View style={[styles.categoryIcon, activeCategory === cat.id && styles.categoryIconActive]}>
                <Ionicons name={cat.icon as any} size={20} color={activeCategory === cat.id ? '#fff' : '#007AFF'} />
              </View>
              <Text style={[styles.categoryText, activeCategory === cat.id && styles.categoryTextActive]}>
    
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Error State */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchListings}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading */}
        {loading && !error && listings.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading marketplace...</Text>
          </View>
        )}

        {/* Featured Section */}
        {!loading && featured.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured</Text>
              <TouchableOpacity onPress={() => router.push('/(commerce)/marketplace/featured' as any)}>
                <Text style={styles.sectionLink}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {featured.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.featuredCard}
                  onPress={() => handleListingPress(item)}
                >
                  <View style={styles.featuredImagePlaceholder}>
                    <Ionicons name="image" size={32} color="#C7C7CC" />
                  </View>
    
                  <Text style={styles.featuredName} numberOfLines={1}>{item.title || item.name}</Text>
                  <Text style={styles.featuredPrice}>{formatPrice(item.price || 0, item.currency)}</Text>
                  {item.location && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={12} color="#8E8E93" />
                      <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Listings */}
        {!loading && listings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
    
    
              {activeCategory === 'all' ? 'All Listings' : CATEGORIES.find((c: any) => c.id === activeCategory)?.name}
            </Text>
            {listings.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.listingCard}
                onPress={() => handleListingPress(item)}
              >
                {item.images && item.images[0] ? (
                  <Image source={{ uri: item.images[0] }} style={{ width: 72, height: 72, borderRadius: 8 }} />
                ) : (
                  <View style={styles.listingImagePlaceholder}>
                    <Ionicons name="image" size={24} color="#C7C7CC" />
                  </View>
                )}
                <View style={styles.listingInfo}>
    
    
                  <Text style={styles.listingName} numberOfLines={2}>{item.title || item.name}</Text>
                  <Text style={styles.listingPrice}>{formatPrice(item.price || 0, item.currency)}</Text>
                  {item.condition && (
                    <Text style={styles.listingMeta}>{item.condition}</Text>
                  )}
                  <View style={styles.listingFooter}>
                    {item.location && (
                      <View style={styles.locationRow}>
                        <Ionicons name="location" size={12} color="#8E8E93" />
                        <Text style={styles.locationText}>{item.location}</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.addToCartBtn}
                      onPress={async (e) => {
                        e.stopPropagation();
                        try {
                          const uid = (await supabase.auth.getUser()).data.user?.id;
                          const { error } = await supabase.from('cart_items').insert({
                            user_id: uid, listing_id: item.id, quantity: 1,
                            unit_price: item.price || 0, currency: item.currency || 'KES',
                            listing_title: item.title || item.name,
                            listing_image_url: item.images?.[0] || null,
                            seller_id: item.seller_id || null, seller_name: item.seller_name || '',
                          });
                          if (error) { Alert.alert('Cart', error.message); return; }
                          setCartCount(c => c + 1);
                        } catch (e2) { Alert.alert('Cart', String(e2?.message || e2)); }
                      }}
                    >
                      <Ionicons name="add" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && listings.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="basket-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>No listings yet</Text>
            <Text style={styles.emptySubtitle}>Be the first to sell on MTAA Marketplace</Text>
            <TouchableOpacity style={styles.emptyCta} onPress={handleSellPress}>
              <Text style={styles.emptyCtaText}>Start Selling</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#000' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8, marginLeft: 4, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#000', paddingVertical: 4 },

  affiliateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    padding: 16,
  },
  affiliateContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  affiliateText: { marginLeft: 12 },
  affiliateTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  affiliateSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },

  categoryScroll: { paddingLeft: 12, marginBottom: 16 },
  categoryBtn: { alignItems: 'center', marginHorizontal: 6, width: 72 },
  categoryBtnActive: {},
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryIconActive: { backgroundColor: '#007AFF' },
  categoryText: { fontSize: 11, color: '#666', fontWeight: '500', textAlign: 'center' },
  categoryTextActive: { color: '#007AFF', fontWeight: '700' },

  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#000', paddingHorizontal: 16, marginBottom: 12 },
  sectionLink: { fontSize: 14, color: '#007AFF', fontWeight: '600' },

  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, fontSize: 15, color: '#8E8E93' },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 14,
  },
  errorText: { flex: 1, marginLeft: 8, fontSize: 14, color: '#FF3B30' },
  retryText: { fontSize: 14, color: '#007AFF', fontWeight: '700', marginLeft: 8 },

  featuredCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginLeft: 16,
    marginRight: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featuredName: { fontSize: 14, fontWeight: '600', color: '#000' },
  featuredPrice: { fontSize: 15, fontWeight: '800', color: '#007AFF', marginTop: 4 },

  listingCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  listingImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listingInfo: { flex: 1, justifyContent: 'space-between' },
  listingName: { fontSize: 15, fontWeight: '600', color: '#000', lineHeight: 20 },
  listingPrice: { fontSize: 16, fontWeight: '800', color: '#007AFF', marginTop: 4 },
  listingMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 12, color: '#8E8E93', marginLeft: 4 },
  addToCartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
  emptyCta: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyCtaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
