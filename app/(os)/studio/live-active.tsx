import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

interface ChatMessage {
  id: string;
  user_name: string;
  body: string;
  is_pinned: boolean;
  created_at: string;
}

interface LiveStream {
  id: string;
  title: string;
  viewer_count: number;
  started_at: string;
  enable_chat: boolean;
}

export default function LiveActiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchStream();
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (!id || !stream?.enable_chat) return;
    const sub = supabase
      .channel(`stream-chat-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'studio_chat_messages', filter: `stream_id=eq.${id}` }, (payload) => {
        setMessages(prev => [payload.new as ChatMessage, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [id, stream?.enable_chat]);

  const fetchStream = async () => {
    try {
      const { data, error } = await supabase
        .from('studio_live_streams')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setStream(data);
    } catch (e) {
      console.error('Fetch stream error:', e);
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return (h > 0 ? h + ':' : '') + m.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !id || !user?.id) return;
    try {
      await supabase.from('studio_chat_messages').insert({
        stream_id: id,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || 'User',
        body: chatInput.trim(),
      });
      setChatInput('');
    } catch (e) {
      console.error('Send message error:', e);
    }
  };

  const endStream = async () => {
    if (!id) return;
    Alert.alert('End Stream', 'Are you sure you want to end this stream?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: async () => {
          setEnding(true);
          try {
            await supabase
              .from('studio_live_streams')
              .update({ status: 'ended', ended_at: new Date().toISOString() })
              .eq('id', id);
            router.replace('/(os)/studio/dashboard');
          } catch (e) {
            Alert.alert('Error', 'Could not end stream');
            setEnding(false);
          }
        },
      },
    ]);
  };

  const pinnedMessages = messages.filter(m => m.is_pinned);
  const regularMessages = messages.filter(m => !m.is_pinned);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text style={styles.viewers}>{stream?.viewer_count || 0} watching</Text>
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>
        <TouchableOpacity style={styles.endBtn} onPress={endStream} disabled={ending}>
          <Text style={styles.endText}>{ending ? 'Ending...' : 'End'}</Text>
        </TouchableOpacity>
      </View>

      {/* Stream Info */}
      <View style={styles.streamInfo}>
        <Text style={styles.streamTitle} numberOfLines={1}>{stream?.title || 'Live Stream'}</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn}><Feather name="mic" size={18} color="#fff" /></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}><Feather name="camera" size={18} color="#fff" /></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}><Feather name="share-2" size={18} color="#fff" /></TouchableOpacity>
        </View>
      </View>

      {/* Chat */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatBox}>
        {stream?.enable_chat === false ? (
          <View style={styles.chatDisabled}>
            <Feather name="message-square" size={32} color="#666" />
            <Text style={styles.chatDisabledText}>Chat is disabled for this stream</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={[...pinnedMessages, ...regularMessages]}
              keyExtractor={m => m.id}
              inverted
              renderItem={({ item }) => (
                <View style={[styles.msg, item.is_pinned && styles.pinnedMsg]}>
                  {item.is_pinned && <Feather name="pin" size={10} color="#6366f1" style={{ marginBottom: 2 }} />}
                  <Text style={styles.msgUser}>{item.user_name}</Text>
                  <Text style={styles.msgBody}>{item.body}</Text>
                </View>
              )}
              contentContainerStyle={{ padding: 12 }}
            />
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Say something..."
                placeholderTextColor="#666"
                value={chatInput}
                onChangeText={setChatInput}
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                <Feather name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  viewers: { color: '#fff', fontSize: 13, fontWeight: '600' },
  timer: { color: '#9ca3af', fontSize: 13, fontVariant: ['tabular-nums'] },
  endBtn: { marginLeft: 'auto', backgroundColor: '#dc2626', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  endText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  streamInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  streamTitle: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1f1f1f', alignItems: 'center', justifyContent: 'center' },
  chatBox: { flex: 1, backgroundColor: '#1a1a1a' },
  chatDisabled: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  chatDisabledText: { color: '#666', fontSize: 14 },
  msg: { marginBottom: 8, padding: 10, backgroundColor: '#262626', borderRadius: 10 },
  pinnedMsg: { backgroundColor: '#6366f115', borderLeftWidth: 3, borderLeftColor: '#6366f1' },
  msgUser: { color: '#6366f1', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  msgBody: { color: '#fff', fontSize: 13 },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: '#262626' },
  input: { flex: 1, backgroundColor: '#262626', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
});
