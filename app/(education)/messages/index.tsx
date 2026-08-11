
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  subject: string | null;
  read: boolean;
  created_at: string;
  sender_name?: string;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { user, session } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('education_messages')
        .select('*')
        .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      console.error('Fetch messages error:', err);
      Alert.alert('Error', err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);


  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Auth guard
  if (!user || !session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Sign In Required</Text>
        <Text style={styles.subtitle}>Please sign in to view messages.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(os)/auth')}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const handleSendMessage = async (receiverId: string, content: string, subject?: string) => {
    if (!user) {
      Alert.alert('Error', 'You must be signed in');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Validation Error', 'Message content is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('education_messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim(),
          subject: subject?.trim() || null,
          read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      setMessages(prev => [data, ...prev]);
      Alert.alert('Success', 'Message sent');
    } catch (err: any) {
      console.error('Send message error:', err);
      Alert.alert('Error', err.message || 'Failed to send message');
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('education_messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m));
    } catch (err: any) {
      console.error('Mark read error:', err);
    }
  };

  const filteredMessages = messages.filter(m =>
    m.content.toLowerCase().includes(search.toLowerCase()) ||
    m.subject?.toLowerCase().includes(search.toLowerCase()) ||
    m.sender_name?.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: Message }) => {
    const isSent = item.sender_id === user?.id;
    return (
      <TouchableOpacity
        style={[styles.card, !item.read && !isSent && styles.unreadCard]}
        onPress={() => markAsRead(item.id)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardSubject}>{item.subject || 'No Subject'}</Text>
          {!item.read && !isSent && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.cardContent} numberOfLines={2}>{item.content}</Text>
        <Text style={styles.cardMeta}>
          {isSent ? 'Sent' : 'Received'} • {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Messages</Text>

      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search messages..."
        placeholderTextColor="#666"
      />

      <FlatList
        data={filteredMessages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No messages</Text>
            <Text style={styles.emptySubtext}>Your inbox is empty.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(education)/messages/compose')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  header: { fontSize: 24, fontWeight: '700', color: '#fff', padding: 20, paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: '600', color: '#fff', textAlign: 'center', marginTop: 40 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  searchInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  list: { padding: 20, paddingTop: 0, paddingBottom: 100 },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  unreadCard: { borderColor: '#2563eb', borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardSubject: { fontSize: 15, fontWeight: '600', color: '#fff', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563eb', marginLeft: 8 },
  cardContent: { fontSize: 14, color: '#aaa', marginBottom: 6 },
  cardMeta: { fontSize: 12, color: '#666' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#888', fontWeight: '600' },
  emptySubtext: { fontSize: 13, color: '#666', marginTop: 4 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300' },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 40,
    marginTop: 24,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
