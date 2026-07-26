import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, TextInput, ActivityIndicator, ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface SearchResult {
  id: string;
  title: string;
  thumbnail_url: string;
  type: 'video' | 'channel' | 'music' | 'podcast' | 'course';
  creator_name: string;
  view_count: number;
  subscriber_count?: number;
}

const FILTERS = ['All', 'Videos', 'Channels', 'Music', 'Podcasts', 'Courses', 'Live'];

export default function SearchResultsScreen() {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q: string }>();
  const [query, setQuery] = useState(q || '');
  const [activeFilter, setActiveFilter] = useState('All');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(['Afrobeat', 'Coding Tutorial', 'Kenya News', 'Gospel Music']);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    let dbQuery = supabase
      .from('studio_videos_with_creator')
      .select('id, title, thumbnail_url, view_count, creator_name, type')
      .ilike('title', `%${searchQuery.trim()}%`)
      .eq('status', 'published')
      .limit(30);

    if (activeFilter === 'Music') dbQuery = dbQuery.eq('type', 'music');
    else if (activeFilter === 'Podcasts') dbQuery = dbQuery.eq('type', 'podcast');
    else if (activeFilter === 'Courses') dbQuery = dbQuery.eq('type', 'course');
    else if (activeFilter === 'Live') dbQuery = dbQuery.eq('is_live', true);

    const { data, error } = await dbQuery;

    if (!error) {
      setResults((data || []).map((v: any) => ({
        id: v.id,
        title: v.title,
        thumbnail_url: v.thumbnail_url,
        type: v.type || 'video',
        creator_name: v.creator?.full_name || 'Unknown',
        view_count: v.view_count || 0,
      })));
    }
    setLoading(false);
  }, [activeFilter]);

  useEffect(() => { if (q) search(q); }, [q]);

  const handleSearch = () => {
    if (query.trim()) {
      search(query);
      if (!recentSearches.includes(query.trim())) {
        setRecentSearches(prev => [query.trim(), ...prev].slice(0, 10));
      }
    }
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(os)/studio/video-player?id=${item.id}`)}
      style={{ flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', alignItems: 'center' }}
    >
      <View style={{ width: 120, height: 68, borderRadius: 6, overflow: 'hidden', backgroundColor: '#1a1a1a', marginRight: 12 }}>
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Feather name="film" size={20} color="#444" />
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }} numberOfLines={2}>{item.title}</Text>
        <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{item.creator_name} • {item.type}</Text>
        <Text style={{ color: '#666', fontSize: 11, marginTop: 2 }}>{item.view_count.toLocaleString()} views</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      {/* Search Bar */}
      <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 }}>
          <Feather name="search" size={16} color="#888" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            placeholder="Search MStudio"
            placeholderTextColor="#555"
            style={{ flex: 1, color: '#fff', fontSize: 14, marginLeft: 10 }}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
              <Feather name="x" size={16} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={handleSearch} style={{ marginLeft: 12, padding: 8 }}>
          <Text style={{ color: '#ff0000', fontWeight: 'bold' }}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, marginBottom: 8 }}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => { setActiveFilter(f); if (query.trim()) search(query); }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 16,
              marginRight: 8,
              backgroundColor: activeFilter === f ? '#fff' : '#1a1a1a',
              borderWidth: 1,
              borderColor: activeFilter === f ? '#fff' : '#333',
            }}
          >
            <Text style={{ color: activeFilter === f ? '#000' : '#fff', fontSize: 12, fontWeight: '500' }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#ff0000" />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={renderResult}
          showsVerticalScrollIndicator={false}
        />
      ) : query.trim() ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Feather name="search" size={48} color="#333" />
          <Text style={{ color: '#666', marginTop: 16 }}>No results for "{query}"</Text>
          <Text style={{ color: '#444', marginTop: 4 }}>Try different keywords</Text>
        </View>
      ) : (
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>Recent Searches</Text>
          {recentSearches.map((term, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => { setQuery(term); search(term); }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}
            >
              <Feather name="clock" size={14} color="#666" />
              <Text style={{ color: '#fff', marginLeft: 12, fontSize: 14 }}>{term}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}