import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface Restaurant {
  id: string;
  name: string;
  cuisine_type: string;
  rating: number;
  is_open: boolean;
  city: string;
  has_delivery: boolean;
  has_pickup: boolean;
  has_dine_in: boolean;
}

export default function RestaurantScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [myRestaurant, setMyRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'delivery' | 'pickup' | 'dinein'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load my restaurant
      if (user) {
        const { data: mine } = await supabase
          .from('restaurants')
          .select('id, name, cuisine_type, rating, is_open, city, has_delivery, has_pickup, has_dine_in')
          .eq('owner_id', user.id)
          .maybeSingle();
        setMyRestaurant(mine);
      }

      // Load all restaurants
      const { data: all } = await supabase
        .from('restaurants')
        .select('id, name, cuisine_type, rating, is_open, city, has_delivery, has_pickup, has_dine_in')
        .eq('status', 'verified')
        .limit(20);
      setRestaurants(all || []);
    } catch (err) {
      console.error('Restaurant load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = restaurants.filter((r: any) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine_type.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'all' ||
      (activeFilter === 'delivery' && r.has_delivery) ||
      (activeFilter === 'pickup' && r.has_pickup) ||
      (activeFilter === 'dinein' && r.has_dine_in);
    return matchesSearch && matchesFilter;
  });

  const filters = [
    { key: 'all', label: 'All', icon: 'restaurant' },
    { key: 'delivery', label: 'Delivery', icon: 'bicycle' },
    { key: 'pickup', label: 'Pickup', icon: 'bag' },
    { key: 'dinein', label: 'Dine-in', icon: 'wine' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Restaurants</Text>
        <TouchableOpacity onPress={() => router.push('/(restaurant)/orders' as any)}>
          <Ionicons name="receipt-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search restaurants or cuisine..."
          placeholderTextColor="#64748b"
        />
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {filters.map((f: any) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key as any)}
          >
            <Ionicons name={f.icon as any} size={14} color={activeFilter === f.key ? '#fff' : '#94a3b8'} />
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* My Restaurant / Onboarding CTA */}
      {myRestaurant ? (
        <TouchableOpacity style={styles.myRestaurantCard} onPress={() => router.push({ pathname: '/(restaurant)/dashboard', params: { id: myRestaurant.id } } as any)}>
          <View style={styles.myRestHeader}>
            <Ionicons name="storefront" size={24} color="#F59E0B" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.myRestName}>{myRestaurant.name}</Text>
              <Text style={styles.myRestMeta}>{myRestaurant.cuisine_type} · {myRestaurant.city}</Text>
            </View>
            <View style={[styles.statusBadge, myRestaurant.is_open ? styles.statusOpen : styles.statusClosed]}>
              <Text style={styles.statusText}>{myRestaurant.is_open ? 'Open' : 'Closed'}</Text>
            </View>
          </View>
          <View style={styles.myRestStats}>
            <Text style={styles.statText}>⭐ {myRestaurant.rating || 'New'}</Text>
            <Text style={styles.statText}>{myRestaurant.has_delivery ? 'Delivery' : ''}</Text>
            <Text style={styles.statText}>{myRestaurant.has_pickup ? 'Pickup' : ''}</Text>
            <Text style={styles.statText}>{myRestaurant.has_dine_in ? 'Dine-in' : ''}</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.onboardCard} onPress={() => router.push('/(restaurant)/onboarding' as any)}>
          <Ionicons name="storefront-outline" size={32} color="#F59E0B" />
          <Text style={styles.onboardTitle}>Open Your Restaurant</Text>
          <Text style={styles.onboardDesc}>Register your restaurant, add your menu, and start receiving orders.</Text>
          <View style={styles.onboardBtn}>
            <Text style={styles.onboardBtnText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={16} color="#0f172a" />
          </View>
        </TouchableOpacity>
      )}

      {/* Restaurant List */}
      <Text style={styles.sectionTitle}>Nearby Restaurants</Text>
      {loading ? (
        <ActivityIndicator color="#F59E0B" style={{ marginTop: 20 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={48} color="#475569" />
          <Text style={styles.emptyText}>No restaurants found</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {filtered.map((r: any) => (
            <TouchableOpacity key={r.id} style={styles.restCard} onPress={() => router.push({ pathname: '/(restaurant)/menu', params: { id: r.id } } as any)}>
              <View style={styles.restAvatar}>
                <Ionicons name="restaurant" size={20} color="#F59E0B" />
              </View>
              <View style={styles.restInfo}>
                <Text style={styles.restName}>{r.name}</Text>
                <Text style={styles.restMeta}>{r.cuisine_type} · {r.city}</Text>
                <View style={styles.restTags}>
                  {r.has_delivery && <Text style={styles.tag}>Delivery</Text>}
                  {r.has_pickup && <Text style={styles.tag}>Pickup</Text>}
                  {r.has_dine_in && <Text style={styles.tag}>Dine-in</Text>}
                </View>
              </View>
              <View style={styles.restRight}>
                <View style={[styles.dot, r.is_open ? styles.dotOpen : styles.dotClosed]} />
                <Text style={styles.ratingText}>⭐ {r.rating || 'New'}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, marginHorizontal: 20, paddingHorizontal: 12, height: 44, marginBottom: 12 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, marginLeft: 8 },
  filterScroll: { paddingHorizontal: 20, marginBottom: 12 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  filterChipActive: { backgroundColor: '#F59E0B' },
  filterText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#0f172a' },
  onboardCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  onboardTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 12 },
  onboardDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  onboardBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F59E0B', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 14 },
  onboardBtnText: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
  myRestaurantCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  myRestHeader: { flexDirection: 'row', alignItems: 'center' },
  myRestName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  myRestMeta: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusOpen: { backgroundColor: '#10B981' },
  statusClosed: { backgroundColor: '#EF4444' },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  myRestStats: { flexDirection: 'row', gap: 12, marginTop: 12 },
  statText: { color: '#94a3b8', fontSize: 12 },
  sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginHorizontal: 20, marginBottom: 10 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#64748b', fontSize: 14, marginTop: 12 },
  restCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  restAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#451a03', alignItems: 'center', justifyContent: 'center' },
  restInfo: { flex: 1, marginLeft: 12 },
  restName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  restMeta: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  restTags: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tag: { backgroundColor: '#451a03', color: '#F59E0B', fontSize: 10, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  restRight: { alignItems: 'flex-end' },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  dotOpen: { backgroundColor: '#10B981' },
  dotClosed: { backgroundColor: '#EF4444' },
  ratingText: { color: '#F59E0B', fontSize: 12, fontWeight: '600' },
});
