import React, { useState, useEffect } from 'react';
import { marketplaceSearchService, SearchResult } from '@/lib/services/marketplace-search-service';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';


  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const cats = await marketplaceSearchService.getCategories();
    setCategories(cats);
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await marketplaceSearchService.search({
        query: searchQuery,
        category: selectedCategory || undefined,
      });
      setResults(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => handleSearch(), 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, selectedCategory]);

export default function CommerceMarketplaceSearchScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Ionicons name="construct-outline" size={64} color="#64748b" />
      <Text style={styles.title}>Search</Text>
      <TextInput
          style={styles.searchInput}
          placeholder="Search marketplace..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.chip, !selectedCategory && styles.chipActive]}
            onPress={() => setSelectedCategory('')}
          >
            <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, selectedCategory === cat && styles.chipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.resultsContainer}>
          {loading ? (
            <Text style={styles.loadingText}>Searching...</Text>
          ) : results.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          ) : (
            results.map(item => (
              <TouchableOpacity key={item.id} style={styles.resultCard}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultPrice}>{item.currency} {item.price.toLocaleString()}</Text>
                <Text style={styles.resultSeller}>{item.seller_name} • {item.location}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({

    searchInput: {
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      marginBottom: 12,
    },
    filterRow: {
      marginBottom: 16,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#f1f5f9',
      marginRight: 8,
    },
    chipActive: {
      backgroundColor: '#0ea5e9',
    },
    chipText: {
      fontSize: 14,
      color: '#64748b',
    },
    chipTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    resultsContainer: {
      flex: 1,
    },
    loadingText: {
      textAlign: 'center',
      marginTop: 40,
      color: '#64748b',
    },
    resultCard: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    resultPrice: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#0ea5e9',
      marginBottom: 4,
    },
    resultSeller: {
      fontSize: 13,
      color: '#64748b',
    },
    emptyState: {
      alignItems: 'center',
      marginTop: 60,
    },
    emptyText: {
      fontSize: 16,
      color: '#94a3b8',
      marginTop: 12,
    },

  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
  button: { marginTop: 24, backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
