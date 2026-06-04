import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore, AppItem } from '@/hooks/useAppStore';
import { AppCard } from './AppCard';

interface SearchOverlayProps {
  visible: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES = ['mtaxi', 'wallet', 'health', 'jobs', 'tribes'];
const TRENDING = ['MTaxi', 'Wallet', 'Health', 'Tribes', 'Shop', 'Edu'];

export function SearchOverlay({ visible, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const { searchApps, isInstalled, isInstalling, installApp } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>(RECENT_SEARCHES);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
    }
  }, [visible]);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      const r = searchApps(query);
      setResults(r);
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
  const handleAppPress = (appId: string) => {
    onClose();
    router.push(`/(os)/appstore/${appId}` as any);
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Search Header */}
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
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {query.trim().length === 0 ? (
        <View style={styles.emptyState}>
          {/* Recent Searches */}
          {recent.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent</Text>
                <TouchableOpacity onPress={() => setRecent([])}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>
              {recent.map(term => (
                <TouchableOpacity
                  key={term}
                  style={styles.recentRow}
                  onPress={() => handleSearch(term)}
                >
                  <Feather name="clock" size={16} color="#666" />
                  <Text style={styles.recentText}>{term}</Text>
                  <Feather name="arrow-up-left" size={16} color="#666" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Trending */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending</Text>
            <View style={styles.trendingGrid}>
              {TRENDING.map((term, idx) => (
                <TouchableOpacity
                  key={term}
                  style={styles.trendingChip}
                  onPress={() => handleSearch(term)}
                >
                  <Text style={[styles.trendingRank, idx < 3 && styles.trendingRankTop]}>
                    {idx + 1}
                  </Text>
                  <Text style={styles.trendingText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Categories Quick Access */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse Categories</Text>
            <View style={styles.categoryGrid}>
              {[
                { name: 'Social', icon: 'users', color: '#FF6B6B' },
                { name: 'Finance', icon: 'dollar-sign', color: '#4ECDC4' },
                { name: 'Transport', icon: 'truck', color: '#45B7D1' },
                { name: 'Health', icon: 'heart', color: '#96CEB4' },
                { name: 'Education', icon: 'book', color: '#FFEAA7' },
                { name: 'Shopping', icon: 'shopping-bag', color: '#DDA0DD' },
              ].map(cat => (
                <TouchableOpacity
                  key={cat.name}
                  style={[styles.categoryChip, { borderColor: cat.color + '40' }]}
                  onPress={() => {
                    onClose();
                    router.push(`/(os)/appstore/categories?category=${cat.name.toLowerCase()}` as any);
                  }}
                >
                  <Feather name={cat.icon as any} size={16} color={cat.color} />
                  <Text style={styles.categoryChipText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#121212',
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    padding: 0,
  },
  cancelButton: {
    paddingHorizontal: 4,
  },
  cancelText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
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
  trendingGrid: {
    gap: 8,
  },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  trendingRank: {
    color: '#666',
    fontSize: 16,
    fontWeight: '700',
    width: 24,
  },
  trendingRankTop: {
    color: '#4ECDC4',
  },
  trendingText: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  categoryChipText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
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
    paddingBottom: 40,
  },
});
