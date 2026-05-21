import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface SearchResult {
  id: string;
  type: 'video' | 'creator' | 'hashtag' | 'business' | 'shop' | 'job' | 'event' | 'live' | 'service';
  title: string;
  subtitle: string;
  image: string | null;
  count: number;
}

export default function DiscoverScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [trendingHashtags, setTrendingHashtags] = useState<{tag: string; count: number}[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<any[]>([]);
  const [suggestedCreators, setSuggestedCreators] = useState<any[]>([]);
  const [nearbyServices, setNearbyServices] = useState<any[]>([]);

  const categories = [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'videos', label: 'Videos', icon: 'videocam-outline' },
    { id: 'creators', label: 'Creators', icon: 'people-outline' },
    { id: 'shops', label: 'Shops', icon: 'cart-outline' },
    { id: 'jobs', label: 'Jobs', icon: 'briefcase-outline' },
    { id: 'events', label: 'Events', icon: 'calendar-outline' },
    { id: 'live', label: 'Live', icon: 'radio-outline' },
    { id: 'services', label: 'Services', icon: 'construct-outline' },
  ];

  useEffect(() => {
    loadTrending();
    loadSuggested();
  }, []);

  const loadTrending = async () => {
    const { data: hashtags } = await supabase
      .from('street_hashtags')
      .select('tag, count')
      .order('count', { ascending: false })
      .limit(20);
    setTrendingHashtags(hashtags || []);

    const { data: videos } = await supabase
      .from('street_content')
      .select('*')
      .order('views_count', { ascending: false })
      .limit(10);
    setTrendingVideos(videos || []);
  };

  const loadSuggested = async () => {
    const { data: creators } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, follower_count, verified')
      .order('follower_count', { ascending: false })
      .limit(10);
    setSuggestedCreators(creators || []);

    const { data: services } = await supabase
      .from('marketplace_services')
      .select('*')
      .eq('status', 'active')
      .limit(10);
    setNearbyServices(services || []);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);

    const searchTerm = `%${query}%`;
    const allResults: SearchResult[] = [];

    // Search content
    const { data: content } = await supabase
      .from('street_content')
      .select('id, caption, content_type, views_count')
      .ilike('caption', searchTerm)
      .limit(10);
    content?.forEach((c: any) => allResults.push({
      id: c.id, type: 'video', title: c.caption,
      subtitle: `${c.views_count} views`, image: null, count: c.views_count,
    }));

    // Search creators
    const { data: creators } = await supabase
      .from('profiles')
      .select('id, display_name, follower_count, verified')
      .ilike('display_name', searchTerm)
      .limit(10);
    creators?.forEach((c: any) => allResults.push({
      id: c.id, type: 'creator', title: c.display_name,
      subtitle: `${c.follower_count} followers`, image: null, count: c.follower_count,
    }));

    // Search hashtags
    const { data: hashtags } = await supabase
      .from('street_hashtags')
      .select('tag, count')
      .ilike('tag', searchTerm)
      .limit(10);
    hashtags?.forEach((h: any) => allResults.push({
      id: h.tag, type: 'hashtag', title: `#${h.tag}`,
      subtitle: `${h.count} posts`, image: null, count: h.count,
    }));

    // Search shops
    const { data: shops } = await supabase
      .from('shops')
      .select('id, name, product_count')
      .ilike('name', searchTerm)
      .limit(10);
    shops?.forEach((s: any) => allResults.push({
      id: s.id, type: 'shop', title: s.name,
      subtitle: `${s.product_count} products`, image: null, count: s.product_count,
    }));

    // Search jobs
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title, company_name')
      .ilike('title', searchTerm)
      .limit(10);
    jobs?.forEach((j: any) => allResults.push({
      id: j.id, type: 'job', title: j.title,
      subtitle: j.company_name, image: null, count: 0,
    }));

    setResults(allResults);
    setLoading(false);
  };

  const openResult = (item: SearchResult) => {
    switch (item.type) {
      case 'video': router.push(`/streets/feed?contentId=${item.id}`); break;
      case 'creator': router.push(`/streets/profile/${item.id}`); break;
      case 'hashtag': router.push(`/streets/feed?hashtag=${item.id}`); break;
      case 'shop': router.push(`/shop/${item.id}`); break;
      case 'job': router.push(`/jobs/${item.id}`); break;
      case 'event': router.push(`/events/${item.id}`); break;
      case 'live': router.push(`/streets/live/${item.id}`); break;
      case 'service': router.push(`/marketplace/service/${item.id}`); break;
    }
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => openResult(item)}>
      <View style={styles.resultIcon}>
        <Ionicons
          name={
            item.type === 'video' ? 'videocam-outline' :
            item.type === 'creator' ? 'person-outline' :
            item.type === 'hashtag' ? 'pricetag-outline' :
            item.type === 'shop' ? 'cart-outline' :
            item.type === 'job' ? 'briefcase-outline' :
            item.type === 'event' ? 'calendar-outline' :
            item.type === 'live' ? 'radio-outline' : 'construct-outline'
          }
          size={22}
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search videos, creators, shops, jobs..."
          placeholderTextColor="#475569"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
            <Ionicons name="close-circle" size={20} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryBtn, activeCategory === cat.id && styles.categoryBtnActive]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <Ionicons
              name={cat.icon as any}
              size={16}
              color={activeCategory === cat.id ? '#fff' : '#94a3b8'}
            />
            <Text style={[styles.categoryText, activeCategory === cat.id && styles.categoryTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results or Discovery Content */}
      {query.length > 0 ? (
        loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" />
        ) : (
          <FlatList
            data={results}
            renderItem={renderResult}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={styles.resultsList}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={40} color="#334155" />
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            }
          />
        )
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Trending Hashtags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Hashtags</Text>
            <View style={styles.hashtagGrid}>
              {trendingHashtags.map((h, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.hashtagChip}
                  onPress={() => router.push(`/streets/feed?hashtag=${h.tag}`)}
                >
                  <Text style={styles.hashtagChipText}>#{h.tag}</Text>
                  <Text style={styles.hashtagCount}>{h.count} posts</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Trending Videos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Now</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {trendingVideos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  style={styles.videoCard}
                  onPress={() => router.push(`/streets/feed?contentId=${video.id}`)}
                >
                  <View style={styles.videoThumb}>
                    <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.8)" />
                  </View>
                  <Text style={styles.videoTitle} numberOfLines={2}>{video.caption}</Text>
                  <Text style={styles.videoViews}>{video.views_count} views</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Suggested Creators */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Creators</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {suggestedCreators.map((creator) => (
                <TouchableOpacity
                  key={creator.id}
                  style={styles.creatorCard}
                  onPress={() => router.push(`/streets/profile/${creator.id}`)}
                >
                  <View style={styles.creatorAvatar}>
                    <Text style={styles.creatorAvatarText}>
                      {creator.display_name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <Text style={styles.creatorName} numberOfLines={1}>{creator.display_name}</Text>
                  <Text style={styles.creatorFollowers}>{creator.follower_count} followers</Text>
                  {creator.verified && (
                    <View style={styles.creatorVerified}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Nearby Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services Near You</Text>
            {nearbyServices.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => router.push(`/marketplace/service/${service.id}`)}
              >
                <View style={styles.serviceIcon}>
                  <Ionicons name="construct-outline" size={24} color="#3b82f6" />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.servicePrice}>KES {service.price}</Text>
                  <Text style={styles.serviceProvider}>{service.provider_name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#64748b" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#f8fafc' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 15,
  },
  categoryScroll: { marginTop: 12 },
  categoryContent: { paddingHorizontal: 16, gap: 8 },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  categoryBtnActive: { backgroundColor: '#3b82f6' },
  categoryText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  categoryTextActive: { color: '#fff' },
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
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', marginBottom: 12 },
  hashtagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hashtagChip: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hashtagChipText: { fontSize: 14, fontWeight: '600', color: '#3b82f6' },
  hashtagCount: { fontSize: 11, color: '#64748b', marginTop: 2 },
  videoCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  videoThumb: {
    width: 160,
    height: 220,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: { fontSize: 13, fontWeight: '600', color: '#f8fafc', padding: 8 },
  videoViews: { fontSize: 11, color: '#94a3b8', paddingHorizontal: 8, paddingBottom: 8 },
  creatorCard: {
    width: 110,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  creatorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  creatorAvatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  creatorName: { fontSize: 13, fontWeight: '600', color: '#f8fafc', textAlign: 'center' },
  creatorFollowers: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  creatorVerified: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 2,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceInfo: { flex: 1 },
  serviceTitle: { fontSize: 15, fontWeight: '600', color: '#f8fafc' },
  servicePrice: { fontSize: 14, fontWeight: '700', color: '#10b981', marginTop: 2 },
  serviceProvider: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#94a3b8', marginTop: 12 },
});
