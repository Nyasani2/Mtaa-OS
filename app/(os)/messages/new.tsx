import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

export default function NewMessageScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [search]);

  async function searchUsers() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name, avatar_url, username')
        .ilike('full_name', `%${search}%`)
        .neq('user_id', user?.id)
        .limit(20);
      setUsers(data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function startConversation(otherUserId: string) {
    try {
      // Check if conversation exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${user!.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user!.id})`)
        .single();

      if (existing) {
        router.push(`/messages/${existing.id}` as any);
      } else {
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({ user1_id: user!.id, user2_id: otherUserId })
          .select()
          .single();
        if (error) {
          console.error('Create conv error:', error);
          return;
        }
        if (newConv) router.push(`/messages/${newConv.id}` as any);
      }
    } catch (err) {
      console.error('Start conversation error:', err);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#222' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 12 }}>New Message</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#1a1a1a', margin: 12, borderRadius: 12 }}>
        <Search size={18} color="#888" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search users..."
          placeholderTextColor="#888"
          style={{ flex: 1, color: '#fff', marginLeft: 10, fontSize: 15 }}
        />
      </View>
      {loading ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator color="#e91e63" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => startConversation(item.user_id)}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#111', borderRadius: 12, marginBottom: 8 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#333', overflow: 'hidden', marginRight: 12 }}>
                {item.avatar_url ? (
                  <img src={item.avatar_url} alt="" style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover' }} />
                ) : (
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#e91e63', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{(item.full_name || 'U').charAt(0)}</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>{item.full_name || 'Unknown'}</Text>
                <Text style={{ color: '#888', fontSize: 13 }}>@{item.username || 'user'}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            search.length >= 2 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: '#666' }}>No users found</Text>
              </View>
            ) : (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: '#666' }}>Type to search for users</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}
