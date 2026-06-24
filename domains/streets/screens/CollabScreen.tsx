import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  TextInput, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface CollabRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_avatar: string | null;
  post_id: string | null;
  post_preview: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface CollabPost {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  collaborators: string[];
  created_at: string;
}

export default function CollabScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'requests' | 'sent' | 'posts'>('requests');
  const [requests, setRequests] = useState<CollabRequest[]>([]);
  const [collabPosts, setCollabPosts] = useState<CollabPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [invitePostId, setInvitePostId] = useState('');

  const loadRequests = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('streets_collabs')
      .select(`
        id, requester_id, post_id, status, created_at,
        requester:user_profiles!streets_collabs_requester_id_fkey(display_name, avatar_url),
        post:streets_posts!streets_collabs_post_id_fkey(content, media_url)
      `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error('Collab load error:', error);
    setRequests((data || []).map((c: any) => ({
      id: c.id,
      requester_id: c.requester_id,
      requester_name: c.requester?.display_name || 'Unknown',
      requester_avatar: c.requester?.avatar_url || null,
      post_id: c.post_id,
      post_preview: c.post?.content?.substring(0, 60) || null,
      status: c.status,
      created_at: c.created_at,
    })));
  }, []);

  const loadCollabPosts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('streets_posts')
      .select('id, content, media_url, media_type, likes_count, comments_count, created_at')
      .contains('collaborators', [user.id])
      .order('created_at', { ascending: false });

    if (error) console.error('Collab posts error:', error);
    setCollabPosts(data || []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadRequests(), loadCollabPosts()]);
    setLoading(false);
    setRefreshing(false);
  }, [loadRequests, loadCollabPosts]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadAll();
  }, [loadAll]);

  const searchCreators = async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    const { data } = await supabase
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .ilike('display_name', `%${query.trim()}%`)
      .limit(10);
    setSearchResults(data || []);
  };

  const sendInvite = async (recipientId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (user.id === recipientId) throw new Error('Cannot invite yourself');

      const { error } = await supabase.from('streets_collabs').insert({
        requester_id: user.id,
        recipient_id: recipientId,
        post_id: invitePostId || null,
        status: 'pending',
      });

      if (error) throw error;

      await supabase.from('streets_notifications').insert({
        recipient_id: recipientId,
        type: 'collab',
        actor_id: user.id,
        post_id: invitePostId || null,
        content: 'invited you to collaborate',
      });

      Alert.alert('Invite Sent', 'Collaboration request sent successfully.');
      setSearchQuery('');
      setSearchResults([]);
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  };

  const respondToRequest = async (requestId: string, accept: boolean) => {
    try {
      await supabase.from('streets_collabs').update({ status: accept ? 'accepted' : 'rejected' }).eq('id', requestId);

      const request = requests.find(r => r.id === requestId);
      if (request) {
        await supabase.from('streets_notifications').insert({
          recipient_id: request.requester_id,
          type: 'collab',
          actor_id: (await supabase.auth.getUser()).data.user?.id || '',
          content: accept ? 'accepted your collaboration request' : 'declined your collaboration request',
        });
      }

      loadRequests();
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>Collaborations</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222', marginHorizontal: 16 }}>
        {(['requests', 'sent', 'posts'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: activeTab === tab ? 2 : 0, borderBottomColor: '#00d4ff' }}
          >
            <Text style={{ color: activeTab === tab ? '#00d4ff' : '#888', fontSize: 15, fontWeight: activeTab === tab ? '700' : '400' }}>
              {tab === 'requests' ? 'Requests' : tab === 'sent' ? 'Send Invite' : 'Collab Posts'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <FlatList
          data={requests}
          keyExtractor={r => r.id}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
              {item.requester_avatar ? (
                <Image source={{ uri: item.requester_avatar }} style={{ width: 48, height: 48, borderRadius: 24 }} />
              ) : (
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="person" size={24} color="#fff" />
                </View>
              )}
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{item.requester_name}</Text>
                {item.post_preview && <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }} numberOfLines={1}>{item.post_preview}</Text>}
                <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>{item.status}</Text>
              </View>
              {item.status === 'pending' && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => respondToRequest(item.id, true)} style={{ backgroundColor: '#00d4ff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 }}>
                    <Text style={{ color: '#000', fontWeight: '700', fontSize: 13 }}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => respondToRequest(item.id, false)} style={{ backgroundColor: '#333', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#fff" />}
          ListEmptyComponent={!loading ? (
            <View style={{ paddingTop: 60, alignItems: 'center' }}>
              <Ionicons name="people" size={48} color="#333" />
              <Text style={{ color: '#666', fontSize: 16, marginTop: 12 }}>No collaboration requests</Text>
            </View>
          ) : <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />}
        />
      )}

      {/* Send Invite Tab */}
      {activeTab === 'sent' && (
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>Search creator to invite</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 16 }}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              value={searchQuery}
              onChangeText={(text) => { setSearchQuery(text); searchCreators(text); }}
              placeholder="Search by name..."
              placeholderTextColor="#666"
              style={{ flex: 1, color: '#fff', fontSize: 15, marginLeft: 10 }}
            />
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={c => c.id}
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                ) : (
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="person" size={20} color="#fff" />
                  </View>
                )}
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{item.display_name}</Text>
                </View>
                <TouchableOpacity onPress={() => sendInvite(item.id)} style={{ backgroundColor: '#00d4ff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ color: '#000', fontWeight: '700', fontSize: 13 }}>Invite</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}

      {/* Collab Posts Tab */}
      {activeTab === 'posts' && (
        <FlatList
          data={collabPosts}
          keyExtractor={p => p.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/streets/post/${item.id}`)}
              style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}
            >
              <Text style={{ color: '#fff', fontSize: 14 }} numberOfLines={2}>{item.content}</Text>
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 16 }}>
                <Text style={{ color: '#888', fontSize: 12 }}><Ionicons name="heart" size={12} color="#ff3040" /> {item.likes_count}</Text>
                <Text style={{ color: '#888', fontSize: 12 }}><Ionicons name="chatbubble" size={12} color="#ffaa00" /> {item.comments_count}</Text>
              </View>
            </TouchableOpacity>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#fff" />}
          ListEmptyComponent={!loading ? (
            <View style={{ paddingTop: 60, alignItems: 'center' }}>
              <Ionicons name="document-text" size={48} color="#333" />
              <Text style={{ color: '#666', fontSize: 16, marginTop: 12 }}>No collaboration posts yet</Text>
            </View>
          ) : null}
        />
      )}
    </View>
  );
}
