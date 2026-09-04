import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Send, Phone, Video } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
};

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id || !user?.id) return;
    loadOtherUser();
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [id, user?.id]);

  async function loadOtherUser() {
    try {
      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .single();
      if (!conv) return;
      const otherId = conv.user1_id === user!.id ? conv.user2_id : conv.user1_id;
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url, username')
        .eq('user_id', otherId)
        .single();
      setOtherUser(profile || { full_name: 'User', avatar_url: null, username: 'user' });
    } catch (err) {
      console.error('Load other user error:', err);
    }
  }

  async function loadMessages() {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    } catch (err) {
      console.error('Load messages error:', err);
    } finally {
      setLoading(false);
    }
  }

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user?.id) return;
    const content = newMessage.trim();
    setNewMessage('');
    try {
      const { data } = await supabase
        .from('messages')
        .insert({ conversation_id: id, sender_id: user.id, content, read: false })
        .select()
        .single();
      if (data) {
        setMessages((prev) => [...prev, data]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      console.error('Send message error:', err);
    }
  }, [newMessage, user?.id, id]);

  const isMyMessage = (msg: Message) => msg.sender_id === user?.id;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#222' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', overflow: 'hidden', marginLeft: 8 }}>
          {otherUser?.avatar_url ? (
            <img src={otherUser.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: 20, objectFit: 'cover' }} />
          ) : (
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#e91e63', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{(otherUser?.full_name || 'U').charAt(0)}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{otherUser?.full_name || 'User'}</Text>
          <Text style={{ color: '#888', fontSize: 12 }}>@{otherUser?.username || 'user'}</Text>
        </View>
        <TouchableOpacity style={{ padding: 8 }}><Phone size={22} color="#fff" /></TouchableOpacity>
        <TouchableOpacity style={{ padding: 8 }}><Video size={22} color="#fff" /></TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#e91e63" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const mine = isMyMessage(item);
            return (
              <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '75%', marginBottom: 12 }}>
                <View style={{ backgroundColor: mine ? '#e91e63' : '#333', borderRadius: 16, borderBottomRightRadius: mine ? 4 : 16, borderBottomLeftRadius: mine ? 16 : 4, padding: 12 }}>
                  <Text style={{ color: '#fff', fontSize: 15 }}>{item.content}</Text>
                </View>
                <Text style={{ color: '#666', fontSize: 11, marginTop: 4, alignSelf: mine ? 'flex-end' : 'flex-start' }}>
                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 }}>
              <Text style={{ color: '#666', fontSize: 16 }}>No messages yet</Text>
              <Text style={{ color: '#555', fontSize: 13, marginTop: 8 }}>Send a message to start the conversation</Text>
            </View>
          }
        />
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#222' }}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#888"
          multiline
          style={{ flex: 1, color: '#fff', padding: 12, backgroundColor: '#1a1a1a', borderRadius: 24, maxHeight: 100, fontSize: 15 }}
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!newMessage.trim()}
          style={{ marginLeft: 10, backgroundColor: newMessage.trim() ? '#e91e63' : '#333', borderRadius: 24, padding: 12 }}
        >
          <Send size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
