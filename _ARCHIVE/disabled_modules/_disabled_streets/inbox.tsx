import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  ActivityIndicator, Alert 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url: string | null;
}

export default function InboxScreen() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('street_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    setLoading(false);

    if (error) {
      setNotifications([]);
      return;
    }

    if (data) {
      setNotifications(data.map((n: any) => ({
        id: n.id,
        type: n.type || 'general',
        title: n.title || 'Notification',
        message: n.message || '',
        is_read: n.is_read || false,
        created_at: n.created_at,
        action_url: n.action_url,
      })));
    }
  };

  const handleMarkRead = async (id: string) => {
    const { error } = await supabase
      .from('street_notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const handleMarkAllRead = async () => {
    const { error } = await supabase
      .from('street_notifications')
      .update({ is_read: true })
      .eq('user_id', user?.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    }
  };

  const handlePress = (item: Notification) => {
    handleMarkRead(item.id);
    if (item.action_url) {
      router.push(item.action_url as any);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👤';
      case 'mention': return '@️';
      case 'transaction': return '💰';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[styles.notifRow, !item.is_read && styles.notifUnread]}
      onPress={() => handlePress(item)}
    >
      <Text style={styles.notifIcon}>{getIcon(item.type)}</Text>
      <View style={styles.notifContent}>
        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.notifTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No notifications</Text>
              <Text style={styles.emptySub}>Activity will appear here</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  markAllText: { color: '#6366f1', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    padding: 14,
    marginBottom: 1,
    borderRadius: 8,
  },
  notifUnread: { backgroundColor: '#6366f108' },
  notifIcon: { fontSize: 20, marginRight: 12, marginTop: 2 },
  notifContent: { flex: 1 },
  notifTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  notifMessage: { color: '#aaa', fontSize: 13, marginTop: 2, lineHeight: 18 },
  notifTime: { color: '#666', fontSize: 11, marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
    marginLeft: 8,
    marginTop: 6,
  },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666', fontSize: 16 },
  emptySub: { color: '#444', fontSize: 12, marginTop: 8 },
  backButton: { marginTop: 24, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
