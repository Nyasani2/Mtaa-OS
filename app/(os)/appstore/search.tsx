import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore, AppItem } from '@/hooks/useAppStore';
import { AppCard } from '@/components/appstore/AppCard';

const TRENDING = [
  { term: 'MTaxi', searches: '12.4K' },
  { term: 'Wallet', searches: '8.7K' },
  { term: 'Health', searches: '6.2K' },
  { term: 'Tribes', searches: '5.1K' },
  { term: 'Shop', searches: '4.8K' },
  { term: 'Edu', searches: '3.9K' },
];

const RECENT_SEARCHES = ['mtaxi', 'wallet', 'health', 'jobs'];

const CATEGORIES = [
  { name: 'Social', icon: 'users', color: '#FF6B6B', apps: 12 },
  { name: 'Finance', icon: 'dollar-sign', color: '#4ECDC4', apps: 8 },
  { name: 'Transport', icon: 'truck', color: '#45B7D1', apps: 6 },
  { name: 'Health', icon: 'heart', color: '#96CEB4', apps: 5 },
  { name: 'Education', icon: 'book', color: '#FFEAA7', apps: 7 },
  { name: 'Shopping', icon: 'shopping-bag', color: '#DDA0DD', apps: 9 },
];

export default function AppStoreSearch() {
  const router = useRouter();
  const { searchApps, isInstalled, isInstalling, installApp, apps } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>(RECENT_SEARCHES);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      setResults(searchApps(query));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchApps]);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (text.trim() && !recent.includes(text.toLowerCase())) {
      setRecent(prev => [text.toLowerCase(), ...prev.slice(0, 4)]);
    }
  }, [recent]);

  const handleInstall = (appId: string) => installApp(appId);
  const handleOpen = (route: string) => router.push(route as any);
  const handleAppPress = (appId: string) => router.push(`/(os)/appstore/${appId}` as any);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {/* Recent */}
      {recent.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity onPress={() => setRecent([])}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          {recent.map(term => (
            <TouchableOpacity key={term} style={styles.recentRow} onPress={() => handleSearch(term)}>
              <Feather name="clock" size={16} color="#666" />
              <Text style={styles.recentText}>{term}</Text>
              <Feather name="arrow-up-left" size={16} color="#666" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Trending */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trending Searches</Text>
        {TRENDING.map((item, idx) => (
          <TouchableOpacity key={item.term} style={styles.trendingRow} onPress={() => handleSearch(item.term)}>
            <View style={styles.trendingRank}>
              <Text style={[styles.trendingRankText, idx < 3 && styles.trendingRankTop]}>{idx + 1}</Text>
            </View>
            <View style={styles.trendingInfo}>
              <Text style={styles.trendingTerm}>{item.term}</Text>
              <Text style={styles.trendingCount}>{item.searches} searches</Text>
            </View>
            <Feather name="trending-up" size={16} color={idx < 3 ? '#4ECDC4' : '#666'} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.name}
              style={[styles.categoryCard, { borderColor: cat.color + '30' }]}
              onPress={() => router.push(`/(os)/appstore/categories?category=${cat.name.toLowerCase()}` as any)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                <Feather name={cat.icon as any} size={24} color={cat.color} />
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={styles.categoryCount}>{cat.apps} apps</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Suggestions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suggested for You</Text>
        <View style={styles.suggestionChips}>
          {['Ride-hailing', 'Payments', 'Health tracking', 'Job search', 'Education', 'Shopping'].map(s => (
            <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => handleSearch(s)}>
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#888" />
          <TextInput
            style={styles.input}
            placeholder="Search apps, games, and more..."
            placeholderTextColor="#666"
            value={query}
            onChangeText={handleSearch}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Feather name="x-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {query.trim().length === 0 ? (
        <FlatList
          data={[{ key: 'empty' }]}
          renderItem={renderEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#4ECDC4" />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.noResults}>
          <Feather name="search" size={48} color="#333" />
          <Text style={styles.noResultsTitle}>No results for "{query}"</Text>
          <Text style={styles.noResultsSub}>Try different keywords or browse categories</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <AppCard
              app={item}
              isInstalled={isInstalled(item.id)}
              isInstalling={isInstalling(item.id)}
              onInstall={handleInstall}
              onOpen={handleOpen}
              onPress={handleAppPress}
              variant="horizontal"
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    padding: 0,
  },
  emptyContainer: {
    paddingTop: 8,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  clearText: {
    color: '#4ECDC4',
    fontSize: 14,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
  },
  recentText: {
    flex: 1,
    color: '#ccc',
    fontSize: 15,
  },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
    gap: 12,
  },
  trendingRank: {
    width: 28,
    alignItems: 'center',
  },
  trendingRankText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '700',
  },
  trendingRankTop: {
    color: '#4ECDC4',
  },
  trendingInfo: {
    flex: 1,
  },
  trendingTerm: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  trendingCount: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#1C1C1C',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  categoryCount: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  suggestionChip: {
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  suggestionText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noResultsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  noResultsSub: {
    color: '#888',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
});
