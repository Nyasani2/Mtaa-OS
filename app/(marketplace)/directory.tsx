// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = ['All', 'Restaurant', 'Shop', 'Service', 'Transport', 'Health', 'Education'];

export default function BusinessDirectoryScreen() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchBusinesses();
  }, [activeCategory]);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('businesses')
        .select('id, name, category, business_type, location, rating, cover_url, status')
        .eq('status', 'active');

      if (activeCategory !== 'All') {
        query = query.or(`category.ilike.%${activeCategory}%,business_type.ilike.%${activeCategory}%`);
      }

      const { data, error } = await query.order('rating', { ascending: false }).limit(50);
      if (error) throw error;
      setBusinesses(data || []);
    } catch (err) {
      console.error('Directory fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.location?.toLowerCase().includes(search.toLowerCase())
  );

  const renderBusiness = ({ item }) => (
    <TouchableOpacity style={styles.bizCard} onPress={() => router.push(`/(os)/business/${item.id}`)}>
      <View style={styles.imageContainer}>
        {item.cover_url ? (
          <Image source={{ uri: item.cover_url }} style={styles.bizImage} />
        ) : (
          <View style={[styles.bizImage, styles.placeholderImage]}>
            <Ionicons name="business" size={32} color="#94a3b8" />
          </View>
        )}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#fbbf24" />
          <Text style={styles.ratingText}>{item.rating ? item.rating.toFixed(1) : 'New'}</Text>
        </View>
      </View>
      <View style={styles.bizInfo}>
        <Text style={styles.bizName}>{item.name}</Text>
        <Text style={styles.bizCategory}>{item.category || item.business_type}</Text>
        {item.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location" size={12} color="#64748b" />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Businesses</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput style={styles.searchInput} placeholder="Search businesses, locations..." placeholderTextColor="#64748b" value={search} onChangeText={setSearch} />
        </View>
      </View>
      <FlatList horizontal showsHorizontalScrollIndicator={false} data={CATEGORIES} keyExtractor={item => item} contentContainerStyle={styles.categoryRow} renderItem={({ item }) => (
        <TouchableOpacity style={[styles.categoryPill, activeCategory === item && styles.categoryPillActive]} onPress={() => setActiveCategory(item)}>
          <Text style={[styles.categoryText, activeCategory === item && styles.categoryTextActive]}>{item}</Text>
        </TouchableOpacity>
      )} />
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
      ) : filteredBusinesses.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="business-outline" size={48} color="#334155" />
          <Text style={styles.emptyText}>No businesses found</Text>
        </View>
      ) : (
        <FlatList data={filteredBusinesses} keyExtractor={item => item.id} renderItem={renderBusiness} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 16, paddingTop: 50, backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', marginBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#334155' },
  searchInput: { flex: 1, color: '#fff', paddingVertical: 12, paddingHorizontal: 8, fontSize: 15 },
  categoryRow: { paddingVertical: 12, paddingHorizontal: 16, gap: 10 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  categoryPillActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  categoryText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  list: { padding: 16, paddingTop: 8 },
  bizCard: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
  imageContainer: { width: 100, height: 100, position: 'relative' },
  bizImage: { width: '100%', height: '100%' },
  placeholderImage: { backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  ratingBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  bizInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  bizName: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 4 },
  bizCategory: { fontSize: 12, color: '#3b82f6', fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: '#94a3b8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: '#64748b', fontSize: 16, marginTop: 12 },
});
