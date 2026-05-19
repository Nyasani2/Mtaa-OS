import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  ActivityIndicator, TextInput 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface SearchResult {
  id: string;
  type: 'post' | 'user' | 'tag';
  title: string;
  subtitle: string;
}

export default function SearchScreen() {
  const { q } = useLocalSearchParams();
  const [query, setQuery] = useState(q as string || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'users' | 'tags'>('all');

  useEffect(() => {
    if (q) handleSearch(q as string);
  }, [q]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    const allResults: SearchResult[] = [];

    // Search posts
    if (activeTab === 'all' || activeTab === 'posts') {
      const { data: posts } = await supabase
        .from('streets_posts')
        .select('id, content, user_id')
        .ilike('content', `%${searchQuery}%`)
        .limit(10);

      if (posts) {
        allResults.push(...posts.map((p: any) => ({
          id: p.id,
          type: 'post' as const,
          title: p.content.slice(0, 60) + (p.content.length > 60 ? '...' : ''),
          subtitle: 'Post',
        })));
      }
    }

    // Search users
    if (activeTab === 'all' || activeTab === 'users') {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .limit(10);

      if (users) {
        allResults.push(...users.map((u: any) => ({
          id: u.id,
          type: 'user' as const,
          title: u.full_name || u.username,
          subtitle: '@' + (u.username || 'user'),
        })));
      }
    }

    // Search tags
    if (activeTab === 'all' || activeTab === 'tags') {
      const { data: tags } = await supabase
        .from('street_hashtags')
        .select('id, tag, posts_count')
        .ilike('tag', `%${searchQuery}%`)
        .limit(10);

      if (tags) {
        allResults.push(...tags.map((t: any) => ({
          id: t.id,
          type: 'tag' as const,
          title: '#' + t.tag,
          subtitle: `${t.posts_count || 0} posts`,
        })));
      }
    }

    setResults(allResults);
    setLoading(false);
  };

  const handlePress = (item: SearchResult) => {
    switch (item.type) {
      case 'post':
        router.push({ pathname: '/(streets)/comments/[id]', params: { id: item.id } });
        break;
      case 'user':
        router.push({ pathname: '/profile/edit', params: { id: item.id } });
        break;
      case 'tag':
        // Filter feed by tag
        router.push('/(streets)/feed');
        break;
    }
  };

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'posts', label: 'Posts' },
    { id: 'users', label: 'Users' },
    { id: 'tags', label: 'Tags' },
  ];

  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity style={styles.resultRow} onPress={() => handlePress(item)}>
      <Text style={styles.resultIcon}>
        {item.type === 'post' ? '📝' : item.type === 'user' ? '👤' : '🏷️'}
      </Text>
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor="#888"
          value={query}
          onChange={setQuery}
          onSubmitEditing={() => handleSearch(query)}
          autoFocus
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => handleSearch(query)}>
          <Text style={styles.searchBtnText}>🔍</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
            onPress={() => {
              setActiveTab(tab.id);
              handleSearch(query);
            }}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={item => `${item.type}-${item.id}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            query ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No results for "{query}"</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Start typing to search</Text>
              </View>
            )
          }
        />
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  searchBtnText: { fontSize: 18 },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  tabBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  tabBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  tabText: { color: '#888', fontSize: 12 },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 1,
    borderRadius: 8,
  },
  resultIcon: { fontSize: 20, marginRight: 12, width: 28 },
  resultInfo: { flex: 1 },
  resultTitle: { color: '#fff', fontSize: 15 },
  resultSubtitle: { color: '#888', fontSize: 12, marginTop: 2 },
  chevron: { color: '#666', fontSize: 18 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666', fontSize: 16 },
  backButton: { marginTop: 24, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
