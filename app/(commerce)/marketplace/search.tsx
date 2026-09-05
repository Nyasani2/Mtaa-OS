// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { marketplaceSearchService } from '@/lib/services/marketplace-search-service';

export default function MarketplaceSearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await marketplaceSearchService.search({
        query: searchQuery,
        category: selectedCategory || undefined,
      });
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { marketplaceSearchService.getCategories().then(setCategories); }, []);
  useEffect(() => {
    const t = setTimeout(() => { if (searchQuery.trim().length > 2 || selectedCategory) handleSearch(); }, 500);
    return () => clearTimeout(t);
  }, [searchQuery, selectedCategory]);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Ionicons name="search" size={20} color="#64748b" />
        <TextInput
          style={s.searchInput}
          placeholder="Search products, sellers, categories…"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}>
        <TouchableOpacity style={[s.chip, !selectedCategory && s.chipActive]} onPress={() => setSelectedCategory('')}>
          <Text style={[s.chipText, !selectedCategory && s.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity key={cat} style={[s.chip, selectedCategory === cat && s.chipActive]} onPress={() => setSelectedCategory(cat)}>
            <Text style={[s.chipText, selectedCategory === cat && s.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={s.results}>
          {results.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="search-outline" size={64} color="#cbd5e1" />
              <Text style={s.emptyText}>{searchQuery ? 'No results found' : 'Search the marketplace'}</Text>
            </View>
          ) : (
            results.map((item) => (
              <TouchableOpacity key={item.id} style={s.card} onPress={() => router.push(`/marketplace/listing/${item.id}` as any)}>
                <View style={s.cardBody}>
                  <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={s.cardPrice}>{item.currency} {Number(item.price || 0).toLocaleString()}</Text>
                  <Text style={s.cardMeta}>{item.seller_name}{item.location ? ` • ${item.location}` : ''}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8, gap: 8 },
  searchInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  filterRow: { paddingHorizontal: 16, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: '#e2e8f0', marginRight: 8 },
  chipActive: { backgroundColor: '#0ea5e9' },
  chipText: { fontSize: 13, color: '#475569' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  results: { flex: 1, paddingHorizontal: 16 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94a3b8', marginTop: 12 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  cardPrice: { fontSize: 16, fontWeight: '700', color: '#059669', marginTop: 4 },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
