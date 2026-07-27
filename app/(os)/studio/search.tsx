import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

type SearchCategory = 'all' | 'videos' | 'music' | 'courses' | 'podcasts' | 'live' | 'creators' | 'topics';

interface SearchResult {
  id: string;
  type: SearchCategory;
  title: string;
  subtitle: string;
  thumbnail?: string | null;
  creator_name?: string | null;
  views_count?: number;
  created_at: string;
}

const CATEGORIES: { id: SearchCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: 'grid' },
  { id: 'videos', label: 'Videos', icon: 'film' },
  { id: 'music', label: 'Music', icon: 'music' },
  { id: 'courses', label: 'Courses', icon: 'book-open' },
  { id: 'podcasts', label: 'Podcasts', icon: 'mic' },
  { id: 'live', label: 'Live', icon: 'radio' },
  { id: 'creators', label: 'Creators', icon: 'users' },
  { id: 'topics', label: 'Topics', icon: 'hash' },
];

const TRENDING_SEARCHES = [
  'African music',
  'Coding tutorial',
  'Live worship',
  'Business tips',
  'Cooking show',
  'Sports highlights',
  'News today',
  'Kids learning',
];

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterDate, setFilterDate] = useState('any');

  const languages = ['all', 'English', 'Swahili', 'French', 'Arabic', 'Portuguese', 'Zulu', 'Yoruba'];
  const countries = ['all', 'Kenya', 'Nigeria', 'South Africa', 'Ghana', 'Tanzania', 'Uganda', 'Ethiopia'];
  const dateRanges = [
    { id: 'any', label: 'Any time' },
    { id: 'hour', label: 'Last hour' },
    { id: 'day', label: 'Today' },
    { id: 'week', label: 'This week' },
    { id: 'month', label: 'This month' },
    { id: 'year', label: 'This year' },
  ];

  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const searchTerm = `%${query.trim()}%`;
      const allResults: SearchResult[] = [];

      // Search videos
      if (activeCategory === 'all' || activeCategory === 'videos') {
        const { data: videos } = await supabase
          .from('studio_videos')
          .select('id, title, description, thumbnail_url, views_count, created_at, user_profiles(full_name)')
          .ilike('title', searchTerm)
          .eq('status', 'published')
          .eq('visibility', 'public')
          .limit(10);
        allResults.push(...(videos || []).map(v => ({
          id: v.id,
          type: 'videos' as SearchCategory,
          title: v.title,
          subtitle: v.description || '',
          thumbnail: v.thumbnail_url,
          creator_name: v.user_profiles?.full_name,
          views_count: v.views_count,
          created_at: v.created_at,
        })));
      }

      // Search creators
      if (activeCategory === 'all' || activeCategory === 'creators') {
        const { data: creators } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url, bio')
          .ilike('full_name', searchTerm)
          .limit(10);
        allResults.push(...(creators || []).map(c => ({
          id: c.id,
          type: 'creators' as SearchCategory,
          title: c.full_name || 'Creator',
          subtitle: c.bio || '',
          thumbnail: c.avatar_url,
          created_at: new Date().toISOString(),
        })));
      }

      // Search courses (from education module)
      if (activeCategory === 'all' || activeCategory === 'courses') {
        const { data: courses } = await supabase
          .from('education_courses')
          .select('id, title, description, thumbnail_url, created_at, user_profiles(full_name)')
          .ilike('title', searchTerm)
          .eq('status', 'published')
          .limit(10);
        allResults.push(...(courses || []).map(c => ({
          id: c.id,
          type: 'courses' as SearchCategory,
          title: c.title,
          subtitle: c.description || '',
          thumbnail: c.thumbnail_url,
          creator_name: c.user_profiles?.full_name,
          created_at: c.created_at,
        })));
      }

      // Search live streams
      if (activeCategory === 'all' || activeCategory === 'live') {
        const { data: streams } = await supabase
          .from('studio_live_streams')
          .select('id, title, thumbnail_url, viewer_count, created_at, user_profiles(full_name)')
          .ilike('title', searchTerm)
          .eq('status', 'live')
          .limit(10);
        allResults.push(...(streams || []).map(s => ({
          id: s.id,
          type: 'live' as SearchCategory,
          title: s.title,
          subtitle: `${s.viewer_count || 0} watching`,
          thumbnail: s.thumbnail_url,
          creator_name: s.user_profiles?.full_name,
          created_at: s.created_at,
        })));
      }

      setResults(allResults);

      // Save to recent searches
      if (query.trim() && !recentSearches.includes(query.trim())) {
        setRecentSearches(prev => [query.trim(), ...prev].slice(0, 10));
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setLoading(false);
    }
  }, [query, activeCategory, recentSearches]);

  useEffect(() => {
    const timeout = setTimeout(performSearch, 400);
    return () => clearTimeout(timeout);
  }, [query, activeCategory, performSearch]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  const handleResultPress = (item: SearchResult) => {
    switch (item.type) {
      case 'videos':
        router.push(`/(os)/studio/video-player?videoId=${item.id}`);
        break;
      case 'creators':
        router.push(`/(os)/studio/channel?creatorId=${item.id}`);
        break;
      case 'courses':
        router.push(`/(os)/education/course?id=${item.id}`);
        break;
      case 'live':
        router.push(`/(os)/studio/live-active?id=${item.id}`);
        break;
      default:
        break;
    }
  };

  const formatViews = (n?: number) => {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity style={styles.resultCard} onPress={() => handleResultPress(item)}>
      <View style={styles.resultThumb}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.resultThumbImg} />
        ) : (
          <View style={styles.resultThumbPlaceholder}>
            <Feather name={
              item.type === 'videos' ? 'film' :
              item.type === 'music' ? 'music' :
              item.type === 'courses' ? 'book-open' :
              item.type === 'podcasts' ? 'mic' :
              item.type === 'live' ? 'radio' :
              item.type === 'creators' ? 'user' : 'hash'
            } size={24} color="#666" />
          </View>
        )}
        {item.type === 'live' && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.resultSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        <View style={styles.resultMeta}>
          <Text style={styles.resultType}>{item.type}</Text>
          {item.creator_name && <Text style={styles.resultCreator}>• {item.creator_name}</Text>}
          {item.views_count !== undefined && <Text style={styles.resultViews}>• {formatViews(item.views_count)} views</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos, music, courses, creators..."
            placeholderTextColor="#666"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Feather name="x" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(!showFilters)}>
          <Feather name="sliders" size={20} color={showFilters ? '#6366f1' : '#fff'} />
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>Language</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {languages.map(l => (
                  <TouchableOpacity key={l} onPress={() => setFilterLanguage(l)} style={[styles.filterChip, filterLanguage === l && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, filterLanguage === l && styles.filterChipTextActive]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>Country</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {countries.map(c => (
                  <TouchableOpacity key={c} onPress={() => setFilterCountry(c)} style={[styles.filterChip, filterCountry === c && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, filterCountry === c && styles.filterChipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {dateRanges.map(d => (
                  <TouchableOpacity key={d.id} onPress={() => setFilterDate(d.id)} style={[styles.filterChip, filterDate === d.id && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, filterDate === d.id && styles.filterChipTextActive]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.id} onPress={() => setActiveCategory(cat.id)} style={[styles.categoryBtn, activeCategory === cat.id && styles.categoryBtnActive]}>
            <Feather name={cat.icon as any} size={14} color={activeCategory === cat.id ? '#6366f1' : '#9ca3af'} />
            <Text style={[styles.categoryText, activeCategory === cat.id && styles.categoryTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {query.trim() === '' ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Trending Searches</Text>
          <View style={styles.trendingGrid}>
            {TRENDING_SEARCHES.map(term => (
              <TouchableOpacity key={term} style={styles.trendingChip} onPress={() => setQuery(term)}>
                <Feather name="trending-up" size={12} color="#6366f1" />
                <Text style={styles.trendingText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {recentSearches.length > 0 && (
            <>
              <View style={styles.recentHeader}>
                <Text style={styles.emptyTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={() => setRecentSearches([])}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map(term => (
                <TouchableOpacity key={term} style={styles.recentItem} onPress={() => setQuery(term)}>
                  <Feather name="clock" size={14} color="#666" />
                  <Text style={styles.recentText}>{term}</Text>
                  <Feather name="arrow-up-left" size={14} color="#666" />
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => `${item.type}-${item.id}`}
          renderItem={renderResult}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Feather name="search" size={48} color="#333" />
              <Text style={styles.noResultsText}>No results for "{query}"</Text>
              <Text style={styles.noResultsSub}>Try different keywords or categories</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },

  searchHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f1f1f', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1f1f1f', alignItems: 'center', justifyContent: 'center' },

  filtersPanel: { backgroundColor: '#141414', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  filterScroll: { paddingHorizontal: 16 },
  filterGroup: { marginRight: 20 },
  filterGroupLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1f1f1f', marginRight: 6 },
  filterChipActive: { backgroundColor: '#6366f1' },
  filterChipText: { color: '#9ca3af', fontSize: 12, fontWeight: '500' },
  filterChipTextActive: { color: '#fff', fontWeight: '700' },

  categoryScroll: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  categoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1f1f1f', marginRight: 8 },
  categoryBtnActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderWidth: 1, borderColor: '#6366f1' },
  categoryText: { color: '#9ca3af', fontSize: 12, fontWeight: '500' },
  categoryTextActive: { color: '#6366f1', fontWeight: '700' },

  emptyState: { padding: 16 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  trendingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  trendingChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1f1f1f', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  trendingText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  clearText: { color: '#6366f1', fontSize: 13, fontWeight: '600' },
  recentItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  recentText: { flex: 1, color: '#fff', fontSize: 14 },

  resultCard: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  resultThumb: { width: 120, height: 68, borderRadius: 8, overflow: 'hidden', backgroundColor: '#1f1f1f' },
  resultThumbImg: { width: '100%', height: '100%' },
  resultThumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  liveBadge: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#ef4444', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  liveDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  resultInfo: { flex: 1 },
  resultTitle: { color: '#fff', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  resultSubtitle: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  resultType: { color: '#6366f1', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  resultCreator: { color: '#666', fontSize: 11 },
  resultViews: { color: '#666', fontSize: 11 },

  noResults: { alignItems: 'center', marginTop: 60 },
  noResultsText: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 16 },
  noResultsSub: { color: '#666', fontSize: 13, marginTop: 4 },
});
