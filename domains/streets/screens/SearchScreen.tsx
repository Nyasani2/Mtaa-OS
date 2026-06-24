import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  Image, ActivityIndicator, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface SearchResult {
  id: string;
  type: 'creator' | 'hashtag' | 'post';
  title: string;
  subtitle?: string;
  image?: string;
  data?: any;
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const q = searchQuery.trim();
      const [creatorsRes, postsRes] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, display_name, avatar_url, bio')
          .ilike('display_name', `%${q}%`)
          .limit(10),
        supabase
          .from('streets_posts')
          .select('id, content, media_url, media_type, user_id, user:user_profiles!user_id(display_name, avatar_url)')
          .ilike('content', `%${q}%`)
          .eq('is_public', true)
          .limit(10),
      ]);

      const combined: SearchResult[] = [];

      (creatorsRes.data || []).forEach((c: any) => {
        combined.push({
          id: `creator-${c.id}`,
          type: 'creator',
          title: c.display_name || 'Unknown',
          subtitle: c.bio || '',
          image: c.avatar_url,
          data: c,
        });
      });

      (postsRes.data || []).forEach((p: any) => {
        combined.push({
          id: `post-${p.id}`,
          type: 'post',
          title: p.content.substring(0, 60) || 'Post',
          subtitle: `By ${p.user?.display_name || 'Unknown'}`,
          image: p.media_url,
          data: p,
        });
      });

      // Extract hashtags from content
      const hashtagMatches = q.match(/#\w+/g);
      if (hashtagMatches) {
        hashtagMatches.forEach((tag: string) => {
          combined.unshift({
            id: `hashtag-${tag}`,
            type: 'hashtag',
            title: tag,
            subtitle: 'Hashtag',
          });
        });
      }

      setResults(combined);
      if (!recentSearches.includes(q)) {
        setRecentSearches(prev => [q, ...prev].slice(0, 10));
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setLoading(false);
    }
  }, [recentSearches]);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 300);
    return () => clearTimeout(timeout);
  }, [query, search]);

  const handleResultPress = (item: SearchResult) => {
    if (item.type === 'creator') {
      router.push(`/profile/${item.data.id}`);
    } else if (item.type === 'post') {
      router.push(`/streets/post/${item.data.id}`);
    } else if (item.type === 'hashtag') {
      router.push(`/streets/hashtag/${item.title.replace('#', '')}`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 }}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search creators, posts, hashtags..."
            placeholderTextColor="#666"
            style={{ flex: 1, color: '#fff', fontSize: 16, marginLeft: 10 }}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!query && recentSearches.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Recent</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {recentSearches.map((s, i) => (
              <TouchableOpacity key={i} onPress={() => setQuery(s)} style={{ backgroundColor: '#1a1a1a', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 }}>
                <Text style={{ color: '#fff', fontSize: 13 }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {loading && <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />}

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleResultPress(item)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={{ width: 48, height: 48, borderRadius: item.type === 'creator' ? 24 : 8 }} />
            ) : (
              <View style={{ width: 48, height: 48, borderRadius: item.type === 'creator' ? 24 : 8, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={item.type === 'creator' ? 'person' : item.type === 'hashtag' ? 'pricetag' : 'image'} size={24} color="#666" />
              </View>
            )}
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{item.title}</Text>
              {item.subtitle && <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{item.subtitle}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading && query.length > 0 ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <Text style={{ color: '#666', fontSize: 16 }}>No results found</Text>
          </View>
        ) : null}
      />
    </View>
  );
}
