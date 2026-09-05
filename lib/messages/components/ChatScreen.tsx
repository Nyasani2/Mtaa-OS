// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const id = params.id;
  const router = useRouter();
  const { user } = useAuthStore();
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [title, setTitle] = useState('Conversation');

  const markRead = async () => {
    await supabase.from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', id).eq('user_id', user?.id);
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('chat_messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true });
      setMsgs(data || []);
      setLoading(false);
      markRead();

      if (!data?.length) {
        const { data: conv } = await supabase.from('conversations').select('title').eq('id', id).single();
        if (conv?.title) setTitle(conv.title);
      }
    })();

    const channel = supabase
      .channel('chat-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${id}` }, (payload) => {
        setMsgs((m) => [...m, payload.new]);
        markRead();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const send = async () => {
    if (!draft.trim()) return;
    const body = draft.trim();
    setDraft('');
    await supabase.from('chat_messages').insert({ conversation_id: id, sender_id: user?.id, body });
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color="#0f172a" /></TouchableOpacity>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={msgs}
          keyExtractor={(m) => m.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.empty}>No messages yet — say hi 👋</Text>}
          renderItem={({ item }) => {
            const mine = item.sender_id === user?.id;
            return (
              <View style={[s.bubble, mine ? s.mine : s.theirs]}>
                <Text style={[s.bubbleText, mine && s.mineText]}>{item.body}</Text>
              </View>
            );
          }}
        />
      )}

      <View style={s.inputRow}>
        <TextInput style={s.input} placeholder="Type a message..." value={draft} onChangeText={setDraft} onSubmitEditing={send} />
        <TouchableOpacity style={s.sendBtn} onPress={send}><Ionicons name="send" size={20} color="#fff" /></TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 17, fontWeight: '800', color: '#0f172a', flex: 1, textAlign: 'center' },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 60 },
  bubble: { maxWidth: '75%', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  mine: { alignSelf: 'flex-end', backgroundColor: '#0ea5e9' },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  bubbleText: { fontSize: 15, color: '#0f172a' },
  mineText: { color: '#fff' },
  inputRow: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center' },
});
