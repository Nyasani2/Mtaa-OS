import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, Plus } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

type Conversation = {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  other_user?: { full_name: string; avatar_url?: string; username?: string };
  last_message?: string;
};

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadConversations();
  }, [user?.id]);

  async function loadConversations() {
    setLoading(true);
    try {
      const { data: convs } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
        .order('created_at', { ascending: false });

      if (!convs || convs.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Enrich with other user info
      const enriched = await Promise.all(
        convs.map(async (conv) => {
          const otherId = conv.user1_id === user!.id ? conv.user2_id : conv.user1_id;
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name, avatar_url, username')
            .eq('user_id', otherId)
            .single();

          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            other_user: profile || { full_name: 'User', username: 'user' },
            last_message: lastMsg?.content || 'No messages yet',
          };
        })
      );

      setConversations(enriched);
    } catch (err) {
      console.error('Load conversations error:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#222' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' }}>Messages</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => router.push('/messages/new')}>
            <Search size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/messages/new')}>
            <Plus size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#e91e63" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/messages/${item.id}`)}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#111', borderRadius: 12, marginBottom: 8 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#333', overflow: 'hidden', marginRight: 12 }}>
                {item.other_user?.avatar_url ? (
                  <img src={item.other_user.avatar_url} alt="" style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover' }} />
                ) : (
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#e91e63', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{(item.other_user?.full_name || 'U').charAt(0)}</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>{item.other_user?.full_name || 'User'}</Text>
                <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }} numberOfLines={1}>{item.last_message}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <Text style={{ color: '#666', fontSize: 16 }}>No messages yet</Text>
              <Text style={{ color: '#555', fontSize: 13, marginTop: 8 }}>Start a conversation with someone</Text>
              <TouchableOpacity
                onPress={() => router.push('/messages/new')}
                style={{ marginTop: 16, backgroundColor: '#e91e63', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>New Message</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}
