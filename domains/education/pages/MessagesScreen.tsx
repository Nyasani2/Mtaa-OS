import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

interface MessageThread {
  id: string;
  participant_name: string;
  participant_role: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchThreads = useCallback(async () => {
    try {
      // Get education-related conversations
      const { data: convData } = await supabase
        .from('education_conversations')
        .select(`
          id,
          participant:participant_id(full_name, role),
          last_message,
          last_message_at,
          unread_count
        `)
        .or(`participant_id.eq.${user?.id},creator_id.eq.${user?.id}`)
        .order('last_message_at', { ascending: false });

      const mapped: MessageThread[] = (convData || []).map((c: any) => ({
        id: c.id,
        participant_name: c.participant?.full_name || 'Unknown',
        participant_role: c.participant?.role || 'User',
        last_message: c.last_message || 'No messages yet',
        last_message_at: c.last_message_at,
        unread_count: c.unread_count || 0,
      }));

      setThreads(mapped);
    } catch (e) {
      console.error('[Messages]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);
  const onRefresh = () => { setRefreshing(true); fetchThreads(); };

  const fetchMessages = async (threadId: string) => {
    try {
      const { data } = await supabase
        .from('education_messages')
        .select('id, sender_id, content, created_at, sender:sender_id(full_name)')
        .eq('conversation_id', threadId)
        .order('created_at', { ascending: true });

      setMessages((data || []).map((m: any) => ({
        id: m.id,
        sender_id: m.sender_id,
        content: m.content,
        created_at: m.created_at,
        sender_name: m.sender?.full_name || 'Unknown',
      })));
    } catch (e) {
      console.error('[Messages] Fetch messages:', e);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;
    setSending(true);
    try {
      const { error } = await supabase.from('education_messages').insert({
        conversation_id: selectedThread.id,
        sender_id: user?.id,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Update conversation last message
      await supabase
        .from('education_conversations')
        .update({
          last_message: newMessage.trim(),
          last_message_at: new Date().toISOString(),
        })
        .eq('id', selectedThread.id);

      setNewMessage('');
      fetchMessages(selectedThread.id);
      fetchThreads();
    } catch (e: any) {
      console.error('[Messages] Send:', e);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (selectedThread) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
        <View style={[styles.chatHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelectedThread(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.chatTitle, { color: colors.text }]}>{selectedThread.participant_name}</Text>
            <Text style={[styles.chatSub, { color: colors.textSecondary }]}>{selectedThread.participant_role}</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {messages.map((m: any) => (
            <View key={m.id} style={[styles.messageBubble, m.sender_id === user?.id ? styles.myMessage : styles.theirMessage]}>
              <Text style={[styles.messageText, { color: m.sender_id === user?.id ? '#fff' : colors.text }]}>{m.content}</Text>
              <Text style={[styles.messageTime, { color: m.sender_id === user?.id ? '#fff' + '99' : colors.textSecondary }]}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}
          {messages.length === 0 && (
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No messages yet</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.chatInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={sendMessage} disabled={sending || !newMessage.trim()}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{threads.length} conversations</Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ padding: 16 }}>
        {threads.map((t: any) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.threadCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => { setSelectedThread(t); fetchMessages(t.id); }}
          >
            <View style={[styles.threadAvatar, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.threadAvatarText, { color: colors.primary }]}>{t.participant_name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.threadHeader}>
                <Text style={[styles.threadName, { color: colors.text }]}>{t.participant_name}</Text>
                <Text style={[styles.threadTime, { color: colors.textSecondary }]}>
                  {new Date(t.last_message_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.threadPreview, { color: colors.textSecondary }]} numberOfLines={1}>{t.last_message}</Text>
            </View>
            {t.unread_count > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadText}>{t.unread_count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        {threads.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="chatbubble-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No conversations yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  threadCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  threadAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  threadAvatarText: { fontSize: 18, fontWeight: '700' },
  threadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  threadName: { fontSize: 15, fontWeight: '600' },
  threadTime: { fontSize: 11 },
  threadPreview: { fontSize: 13, marginTop: 4 },
  unreadBadge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  backBtn: { padding: 4 },
  chatTitle: { fontSize: 16, fontWeight: '700' },
  chatSub: { fontSize: 12, marginTop: 2 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#2563EB', borderBottomRightRadius: 4 },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#f3f4f6', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 14, lineHeight: 20 },
  messageTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  inputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, gap: 8 },
  chatInput: { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, borderWidth: 1, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 12, fontSize: 14 },
});
