import { Dimensions } from 'react-native';
const { width } = Dimensions.get('window');
import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  ActivityIndicator, TextInput 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface TrendingTopic {
  id: string;
  tag: string;
  posts_count: number;
}

interface SuggestedUser {
  id: string;
  full_name: string;
  avatar_url: string;
  followers_count: number;
}

export default function DiscoverScreen() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDiscover();
  }, []);

  const fetchDiscover = async () => {
    setLoading(true);

    const { data: tagsData } = await supabase
      .from('street_hashtags')
      .select('*')
      .order('posts_count', { ascending: false })
      .limit(10);

    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .limit(10);

    setLoading(false);

    if (tagsData) {
      setTopics(tagsData.map((t: any) => ({
        id: t.id,
        tag: t.tag,
        posts_count: t.posts_count || 0,
      })));
    }

    if (usersData) {
      setUsers(usersData.map((u: any) => ({
        id: u.id,
        full_name: u.full_name || 'Unknown',
        avatar_url: u.avatar_url || '',
        followers_count: 0,
      })));
    }
  };

  const renderTopic = ({ item }: { item: TrendingTopic }) => (
    <TouchableOpacity 
      style={styles.topicCard}
      onPress={() => router.push({ pathname: '/(streets)/search', params: { q: item.tag } })}
    >
      <Text style={styles.topicTag}>#{item.tag}</Text>
      <Text style={styles.topicCount}>{item.posts_count.toLocaleString()} posts</Text>
    </TouchableOpacity>
  );

  const renderUser = ({ item }: { item: SuggestedUser }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => router.push({ pathname: '/profile/edit', params: { id: item.id } })}>
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.userAvatar} />
      ) : (
        <View style={styles.userAvatarPlaceholder}>
          <Text style={styles.userAvatarText}>👤</Text>
        </View>
      )}
      <Text style={styles.userName} numberOfLines={1}>{item.full_name}</Text>
      <TouchableOpacity style={styles.followBtn}>
        <Text style={styles.followText}>Follow</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discover</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search people, topics, tags..."
        placeholderTextColor="#888"
        value={search}
        onChange={setSearch}
        onSubmitEditing={() => router.push({ pathname: '/(streets)/search', params: { q: search } })}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ListHeaderComponent={
            <>
              <Text style={styles.sectionTitle}>🔥 Trending</Text>
              <FlatList
                data={topics}
                renderItem={renderTopic}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.topicsRow}
              />
              <Text style={styles.sectionTitle}>👥 Suggested</Text>
            </>
          }
          data={users}
          renderItem={renderUser}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  searchInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', paddingHorizontal: 16, marginTop: 16, marginBottom: 12 },
  topicsRow: { paddingHorizontal: 12, paddingBottom: 8 },
  topicCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 4,
    minWidth: 140,
  },
  topicTag: { color: '#6366f1', fontSize: 14, fontWeight: '600' },
  topicCount: { color: '#888', fontSize: 12, marginTop: 4 },
  list: { paddingHorizontal: 12, paddingBottom: 100 },
  userCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    width: (width - 48) / 2,
    alignItems: 'center',
  },
  userAvatar: { width: 60, height: 60, borderRadius: 30, marginBottom: 8 },
  userAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  userAvatarText: { fontSize: 24 },
  userName: { color: '#fff', fontSize: 14, fontWeight: '500', marginBottom: 8 },
  followBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  followText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
