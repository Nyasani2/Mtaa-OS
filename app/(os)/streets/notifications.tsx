import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Heart, MessageCircle, UserPlus, Share2 } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

type NotificationItem = {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'share';
  actor_name: string;
  actor_avatar?: string;
  post_id?: string;
  content?: string;
  created_at: string;
  read: boolean;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadNotifications();
  }, [user?.id]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('streets_notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        console.error('Notifications DB error:', error);
        setNotifications([]);
      } else {
        setNotifications((data as NotificationItem[]) || []);
      }
    } catch (err) {
      console.error('Notifications error:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  const iconMap: any = {
    like: <Heart size={20} color="#e91e63" fill="#e91e63" />,
    comment: <MessageCircle size={20} color="#4fc3f7" />,
    follow: <UserPlus size={20} color="#81c784" />,
    share: <Share2 size={20} color="#ffb74d" />,
  };

  const textMap: any = {
    like: 'liked your post',
    comment: 'commented on your post',
    follow: 'started following you',
    share: 'shared your post',
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#222' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 12 }}>Notifications</Text>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#e91e63" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => item.post_id && router.push(`/streets/post/${item.post_id}` as any)}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: item.read ? '#111' : '#1a1a2e', borderRadius: 12, marginBottom: 8 }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                {iconMap[item.type] || iconMap.like}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 14 }}>
                  <Text style={{ fontWeight: '700' }}>{item.actor_name}</Text> {textMap[item.type] || 'interacted with you'}
                </Text>
                {item.content && <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>"{item.content}"</Text>}
                <Text style={{ color: '#555', fontSize: 11, marginTop: 4 }}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              {!item.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#e91e63' }} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <Text style={{ color: '#666', fontSize: 16 }}>No notifications yet</Text>
              <Text style={{ color: '#555', fontSize: 13, marginTop: 8 }}>When someone likes, comments, or follows you, it will appear here</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
