import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileIndexScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const fetchCounts = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { count: posts } = await supabase.from('streets_posts').select('*', { count: 'exact', head: true }).eq('creator_id', user.id);
      setPostCount(posts || 0);
      const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id);
      setFollowerCount(followers || 0);
      const { count: following } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);
      setFollowingCount(following || 0);
    } catch (err) {
      console.error('Count fetch error:', err);
    }
  }, [user?.id]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProfile();
    await fetchCounts();
    setRefreshing(false);
  }, [refreshProfile, fetchCounts]);

  const menuItems = [
    { icon: 'create-outline', label: 'Edit Profile', color: '#3b82f6', route: '/profile/edit' },
    { icon: 'shield-checkmark-outline', label: 'Privacy & Security', color: '#10b981', route: '/profile/privacy' },
    { icon: 'trophy-outline', label: 'Achievements', color: '#f59e0b', route: '/profile/achievements' },
    { icon: 'briefcase-outline', label: 'Professional', color: '#8b5cf6', route: '/profile/professional' },
    { icon: 'people-outline', label: 'Family', color: '#ef4444', route: '/profile/family' },
    { icon: 'qr-code-outline', label: 'My QR Code', color: '#06b6d4', route: '/profile/qr' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Profile</Text>
          <TouchableOpacity onPress={() => router.push('/profile/settings' as any)}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <View style={{ position: 'relative' }}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#3b82f6' }} resizeMode="cover" onError={(e) => console.error('Profile avatar load error:', e.nativeEvent.error)} />
            ) : (
              <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#333' }}>
                <Ionicons name="person" size={50} color="#555" />
              </View>
            )}
            {profile?.verified && (
              <View style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: '#3b82f6', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0a0a0a' }}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </View>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 16 }}>{profile?.display_name || profile?.full_name || 'User'}</Text>
          {profile?.username ? <Text style={{ color: '#888', fontSize: 15, marginTop: 4 }}>@{profile.username}</Text> : null}
          {profile?.bio ? <Text style={{ color: '#aaa', fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>{profile.bio}</Text> : null}
          {(profile?.city || profile?.country) ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={{ color: '#666', fontSize: 13, marginLeft: 4 }}>{[profile.city, profile.country].filter(Boolean).join(', ')}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, marginHorizontal: 16, marginBottom: 16, backgroundColor: '#1a1a1a', borderRadius: 12 }}>
          <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => router.push('/profile/posts' as any)}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{postCount}</Text>
            <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => router.push('/profile/followers' as any)}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{followerCount}</Text>
            <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => router.push('/profile/following' as any)}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{followingCount}</Text>
            <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>Following</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginHorizontal: 16, backgroundColor: '#1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={item.route} onPress={() => router.push(item.route as any)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: index < menuItems.length - 1 ? 1 : 0, borderBottomColor: '#252525' }}>
              <Ionicons name={item.icon as any} size={22} color={item.color} style={{ marginRight: 14 }} />
              <Text style={{ color: '#fff', fontSize: 15, flex: 1 }}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={async () => { await supabase.auth.signOut(); router.replace('/'); }} style={{ marginHorizontal: 16, marginTop: 24, marginBottom: 32, backgroundColor: '#1a1a1a', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: '600' }}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
