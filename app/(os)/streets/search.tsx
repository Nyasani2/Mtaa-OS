import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface SearchResult {
  id: string;
  type: 'user' | 'content' | 'hashtag' | 'shop' | 'job' | 'service';
  title: string;
  subtitle: string;
  image?: string;
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    // Load from local storage or Supabase
    setRecentSearches(['#africa', '#tech', '#business', 'Nairobi creators']);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);

    const searchTerm = `%${query}%`;
    const allResults: SearchResult[] = [];

    // Search users
    const { data: users } = await supabase
      .from('profiles')
      .select('id, display_name, bio')
      .ilike('display_name', searchTerm)
      .limit(5);
    users?.forEach((u: any) => allResults.push({
      id: u.id, type: 'user', title: u.display_name, subtitle: u.bio || 'Creator',
    }));

    // Search content
    const { data: content } = await supabase
      .from('street_content')
      .select('id, caption, content_type')
      .ilike('caption', searchTerm)
      .eq('status', 'published')
      .limit(5);
    content?.forEach((c: any) => allResults.push({
      id: c.id, type: 'content', title: c.caption.slice(0, 50), subtitle: c.content_type,
    }));

    // Search hashtags
    const { data: hashtags } = await supabase
      .from('street_hashtags')
      .select('tag, count')
      .ilike('tag', searchTerm)
      .limit(5);
    hashtags?.forEach((h: any) => allResults.push({
      id: h.tag, type: 'hashtag', title: `#${h.tag}`, subtitle: `${h.count} posts`,
    }));

    // Search shops
    const { data: shops } = await supabase
      .from('shops')
      .select('id, name, description')
      .ilike('name', searchTerm)
      .limit(5);
    shops?.forEach((s: any) => allResults.push({
      id: s.id, type: 'shop', title: s.name, subtitle: s.description || 'Shop',
    }));

    // Search jobs
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title, company_name')
      .ilike('title', searchTerm)
      .limit(5);
    jobs?.forEach((j: any) => allResults.push({
      id: j.id, type: 'job', title: j.title, subtitle: j.company_name,
    }));

    setResults(allResults);
    setLoading(false);
  };

  const openResult = (item: SearchResult) => {
    switch (item.type) {
      case 'user': router.push(`/streets/profile/${item.id}`); break;
      case 'content': router.push(`/streets/feed?contentId=${item.id}`); break;
      case 'hashtag': router.push(`/streets/feed?hashtag=${item.id}`); break;
      case 'shop': router.push(`/shop/${item.id}`); break;
      case 'job': router.push(`/jobs/${item.id}`); break;
      case 'service': router.push(`/marketplace/service/${item.id}`); break;
    }
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => openResult(item)}>
      <View style={styles.resultIcon}>
        <Ionicons
          name={
            item.type === 'user' ? 'person-outline' :
            item.type === 'content' ? 'videocam-outline' :
            item.type === 'hashtag' ? 'pricetag-outline' :
            item.type === 'shop' ? 'cart-outline' :
            item.type === 'job' ? 'briefcase-outline' : 'construct-outline'
          }
          size={20}
          color="#3b82f6"
        />
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>{item.title}</Text>
        <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#64748b" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Streets..."
            placeholderTextColor="#475569"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {query.length === 0 ? (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          {recentSearches.map((search, i) => (
            <TouchableOpacity
              key={i}
              style={styles.recentItem}
              onPress={() => { setQuery(search); handleSearch(); }}
            >
              <Ionicons name="time-outline" size={18} color="#64748b" />
              <Text style={styles.recentText}>{search}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
      ) : (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item, i) => `${item.type}-${item.id}-${i}`}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={40} color="#334155" />
              <Text style={styles.emptyText}>No results for "{query}"</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 15,
  },
  recentSection: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginBottom: 12 },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  recentText: { fontSize: 14, color: '#94a3b8' },
  resultsList: { padding: 16 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 15, fontWeight: '600', color: '#f8fafc' },
  resultSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#94a3b8', marginTop: 12 },
});
