import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface InboxItem {
  id: string;
  type: 'message' | 'like' | 'comment' | 'follow' | 'gift' | 'mention' | 'monetization' | 'wallet' | 'system';
  title: string;
  body: string;
  sender_id: string | null;
  sender_name: string | null;
  content_id: string | null;
  read: boolean;
  created_at: string;
  amount: number | null;
  currency: string | null;
}

export default function InboxScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'messages' | 'activity' | 'monetization'>('all');

  const fetchInbox = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('street_notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'messages') {
        query = query.eq('type', 'message');
      } else if (filter === 'activity') {
        query = query.in('type', ['like', 'comment', 'follow', 'mention']);
      } else if (filter === 'monetization') {
        query = query.in('type', ['gift', 'monetization', 'wallet']);
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Inbox error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, [filter, user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInbox();
  };

  const markAsRead = async (id: string) => {
    await supabase.from('street_notifications').update({ read: true }).eq('id', id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
  };

  const handlePress = (item: InboxItem) => {
    markAsRead(item.id);

    switch (item.type) {
      case 'message':
        router.push(`/chat/${item.sender_id}`);
        break;
      case 'like':
      case 'comment':
      case 'mention':
        if (item.content_id) {
          router.push(`/streets/feed?contentId=${item.content_id}`);
        }
        break;
      case 'follow':
        if (item.sender_id) {
          router.push(`/streets/profile/${item.sender_id}`);
        }
        break;
      case 'gift':
      case 'monetization':
      case 'wallet':
        router.push('/wallet');
        break;
      default:
        break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return 'mail-outline';
      case 'like': return 'heart';
      case 'comment': return 'chatbubble-outline';
      case 'follow': return 'person-add-outline';
      case 'gift': return 'gift-outline';
      case 'mention': return 'at-outline';
      case 'monetization': return 'trending-up-outline';
      case 'wallet': return 'wallet-outline';
      default: return 'notifications-outline';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'like': return '#ef4444';
      case 'comment': return '#3b82f6';
      case 'follow': return '#10b981';
      case 'gift': return '#f59e0b';
      case 'monetization': return '#8b5cf6';
      case 'wallet': return '#10b981';
      default: return '#94a3b8';
    }
  };

  const renderItem = ({ item }: { item: InboxItem }) => (
    <TouchableOpacity
      style={[styles.itemCard, !item.read && styles.unreadCard]}
      onPress={() => handlePress(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.type) + '20' }]}>
        <Ionicons name={getIcon(item.type) as any} size={20} color={getIconColor(item.type)} />
      </View>

      <View style={styles.itemInfo}>
        <Text style={[styles.itemTitle, !item.read && styles.unreadText]}>
          {item.title}
        </Text>
        <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
          {item.amount && (
            <Text style={styles.amountText}>
              +{item.currency} {item.amount}
            </Text>
          )}
        </View>
      </View>

      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
        <TouchableOpacity onPress={() => router.push('/chat')}>
          <Ionicons name="create-outline" size={24} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {(['all', 'messages', 'activity', 'monetization'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="mail-open-outline" size={48} color="#334155" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#f8fafc' },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1e293b',
  },
  filterBtnActive: { backgroundColor: '#3b82f6' },
  filterText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  unreadCard: { borderColor: '#3b82f6', backgroundColor: '#1e293b' },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: '#94a3b8' },
  unreadText: { color: '#f8fafc', fontWeight: '700' },
  itemBody: { fontSize: 13, color: '#64748b', marginTop: 2, lineHeight: 18 },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  itemTime: { fontSize: 11, color: '#475569' },
  amountText: { fontSize: 13, fontWeight: '700', color: '#10b981' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
  },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#94a3b8', marginTop: 16 },
});
