import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface LikeItem {
  id: string;
  user_id: string;
  photos: string[];
  created_at: string;
  direction: string;
}

export default function LikesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [likes, setLikes] = useState<LikeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) fetchLikes();
  }, [user, activeTab]);

  const fetchLikes = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let query;
      if (activeTab === 'received') {
        query = supabase.from('hookup_swipes').select('swiper_id, created_at, direction').eq('swiped_id', user.id).eq('direction', 'like').order('created_at', { ascending: false });
      } else {
        query = supabase.from('hookup_swipes').select('swiped_id, created_at, direction').eq('swiper_id', user.id).eq('direction', 'like').order('created_at', { ascending: false });
      }

      const { data: swipeData, error } = await query;
      if (error) throw error;

      const userIds = (swipeData || []).map((s: any) => activeTab === 'received' ? s.swiper_id : s.swiped_id);
      if (userIds.length === 0) {
        setLikes([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase.from('hookup_profiles').select('user_id, photos').in('user_id', userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      setLikes((swipeData || []).map((s: any) => {
        const uid = activeTab === 'received' ? s.swiper_id : s.swiped_id;
        const profile = profileMap.get(uid);
        return {
          id: uid,
          user_id: uid,
          photos: profile?.photos || [],
          created_at: s.created_at,
          direction: s.direction,
        };
      }));
    } catch (err) {
      console.error('Likes fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLikes();
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff3366" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Likes</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
        <TouchableOpacity onPress={() => setActiveTab('received')}
          style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'received' ? '#ff3366' : 'transparent' }}>
          <Text style={{ color: activeTab === 'received' ? '#ff3366' : '#888', fontWeight: activeTab === 'received' ? 'bold' : 'normal' }}>Received</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('sent')}
          style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'sent' ? '#ff3366' : 'transparent' }}>
          <Text style={{ color: activeTab === 'sent' ? '#ff3366' : '#888', fontWeight: activeTab === 'sent' ? 'bold' : 'normal' }}>Sent</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff3366" />}>
        {likes.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Feather name="heart" size={48} color="#333" />
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16 }}>
              {activeTab === 'received' ? 'No Likes Received' : 'No Likes Sent'}
            </Text>
          </View>
        ) : (
          <View style={{ padding: 16 }}>
            {likes.map((like) => (
              <TouchableOpacity key={like.id} onPress={() => router.push(`/(os)/hookup/profile-detail?id=${like.user_id}` as any)}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 14, marginBottom: 12 }}>
                <Image source={{ uri: like.photos[0] || undefined }} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#2a2a2a' }} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>User</Text>
                  <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{activeTab === 'received' ? 'Liked you' : 'You liked'}</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
