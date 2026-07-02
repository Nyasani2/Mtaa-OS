import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MessageCircle, Search, Plus } from 'lucide-react-native';

interface Conversation {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_avatar: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Query from messages table grouped by conversation
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      // Group by conversation partner
      const convoMap = new Map<string, Conversation>();
      (data || []).forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        if (!convoMap.has(partnerId)) {
          convoMap.set(partnerId, {
            id: msg.id,
            participant_id: partnerId,
            participant_name: 'User',
            participant_avatar: null,
            last_message: msg.content,
            last_message_at: msg.created_at,
            unread_count: msg.sender_id !== user.id && !msg.read ? 1 : 0,
          });
        } else {
          const existing = convoMap.get(partnerId)!;
          if (msg.sender_id !== user.id && !msg.read) {
            existing.unread_count += 1;
          }
        }
      });

      setConversations(Array.from(convoMap.values()));
    } catch (err) { console.error('Messages fetch error:', err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const onRefresh = () => { setRefreshing(true); fetchConversations(); };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => {}}>
            <Search size={22} color="#f8fafc" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}}>
            <Plus size={22} color="#f8fafc" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#38bdf8" />
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <MessageCircle size={48} color="#475569" />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySub}>Start a conversation with someone</Text>
          <TouchableOpacity style={styles.newChatBtn} onPress={() => {}}>
            <Text style={styles.newChatText}>New Message</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.participant_id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.convo} onPress={() => router.push(`/(os)/messages/${item.participant_id}` as any)}>
              <View style={styles.avatar}>
                {item.participant_avatar ? (
                  <Image source={{ uri: item.participant_avatar }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarText}>{item.participant_name.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View style={styles.convoInfo}>
                <View style={styles.convoTop}>
                  <Text style={styles.convoName}>{item.participant_name}</Text>
                  <Text style={styles.convoTime}>{new Date(item.last_message_at).toLocaleDateString('en-KE')}</Text>
                </View>
                <Text style={styles.convoPreview} numberOfLines={1}>{item.last_message}</Text>
              </View>
              {item.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unread_count}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#94a3b8', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  newChatBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#38bdf8', borderRadius: 24 },
  newChatText: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  convo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#f8fafc' },
  convoInfo: { flex: 1 },
  convoTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  convoName: { fontSize: 15, fontWeight: '600', color: '#e2e8f0' },
  convoTime: { fontSize: 12, color: '#64748b' },
  convoPreview: { fontSize: 14, color: '#94a3b8' },
  unreadBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  unreadText: { fontSize: 11, fontWeight: '700', color: '#0f172a' },
});
