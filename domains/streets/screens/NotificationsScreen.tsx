import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'tip' | 'live' | 'collab' | 'share';
  actor_id: string;
  actor_name: string;
  actor_avatar: string | null;
  post_id: string | null;
  content: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setNotifications([]); return; }

      const { data, error } = await supabase
        .from('streets_notifications')
        .select(`
          id, type, actor_id, post_id, content, read, created_at,
          actor:user_profiles!streets_notifications_actor_id_fkey(display_name, avatar_url)
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mapped = (data || []).map((n: any) => ({
        id: n.id,
        type: n.type,
        actor_id: n.actor_id,
        actor_name: n.actor?.display_name || 'Someone',
        actor_avatar: n.actor?.avatar_url || null,
        post_id: n.post_id,
        content: n.content,
        read: n.read,
        created_at: n.created_at,
      }));

      setNotifications(mapped);
    } catch (e) {
      console.error('Notifications error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase.from('streets_notifications').update({ read: true }).eq('id', notificationId);
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('streets_notifications').update({ read: true }).eq('recipient_id', user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return 'heart';
      case 'comment': return 'chatbubble';
      case 'follow': return 'person-add';
      case 'mention': return 'at';
      case 'tip': return 'cash';
      case 'live': return 'radio';
      case 'collab': return 'people';
      case 'share': return 'share';
      default: return 'notifications';
    }
  };

  const getMessage = (n: NotificationItem) => {
    switch (n.type) {
      case 'like': return 'liked your post';
      case 'comment': return `commented: "${n.content || ''}"`;
      case 'follow': return 'started following you';
      case 'mention': return 'mentioned you in a post';
      case 'tip': return `tipped you ${n.content || ''}`;
      case 'live': return 'started a live stream';
      case 'collab': return 'invited you to collaborate';
      case 'share': return 'shared your post';
      default: return 'interacted with you';
    }
  };

  const handlePress = (n: NotificationItem) => {
    markAsRead(n.id);
    if (n.post_id) {
      router.push(`/streets/post/${n.post_id}`);
    } else if (n.type === 'follow') {
      router.push(`/profile/${n.actor_id}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#222', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>Notifications {unreadCount > 0 && <Text style={{ color: '#ff3040' }}>({unreadCount})</Text>}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={{ color: '#00d4ff', fontSize: 14 }}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={n => n.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePress(item)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#1a1a1a',
              backgroundColor: item.read ? '#000' : '#0a1a2a',
            }}
          >
            <View style={{ position: 'relative' }}>
              {item.actor_avatar ? (
                <Image source={{ uri: item.actor_avatar }} style={{ width: 48, height: 48, borderRadius: 24 }} />
              ) : (
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="person" size={24} color="#666" />
                </View>
              )}
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#ff3040', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={getIcon(item.type)} size={12} color="#fff" />
              </View>
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 14 }}>
                <Text style={{ fontWeight: '700' }}>{item.actor_name}</Text> {getMessage(item)}
              </Text>
              <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            {!item.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#00d4ff' }} />}
          </TouchableOpacity>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#fff" />}
        ListEmptyComponent={!loading ? (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <Ionicons name="notifications-off" size={48} color="#333" />
            <Text style={{ color: '#666', fontSize: 16, marginTop: 12 }}>No notifications yet</Text>
          </View>
        ) : <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />}
      />
    </View>
  );
}
