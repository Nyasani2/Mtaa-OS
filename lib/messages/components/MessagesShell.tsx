// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const fmt = (t) => {
  if (!t) return '';
  const s = (Date.now() - new Date(t).getTime()) / 1000;
  if (s < 60) return 'now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
};

export default function MessagesShell() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [users, setUsers] = useState([]);
  const [userQuery, setUserQuery] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const { data: parts } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at, conversations(id, title, is_group)')
      .eq('user_id', user.id);
    const list = [];
    for (const p of parts || []) {
      const conv = p.conversations;
      if (!conv) continue;
      const { data: last } = await supabase
        .from('chat_messages').select('body, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false }).limit(1);
      let name = conv.title || 'Conversation';
      if (!conv.is_group) {
        const { data: others } = await supabase
          .from('conversation_participants')
          .select('user_id, user_profiles(first_name, last_name)')
          .eq('conversation_id', conv.id).neq('user_id', user.id);
        const o = others?.[0]?.user_profiles;
        if (o) name = `${o.first_name || ''} ${o.last_name || ''}`.trim() || name;
      }
      const { count } = await supabase
        .from('chat_messages').select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id).neq('sender_id', user.id)
        .gt('created_at', p.last_read_at || '1970-01-01T00:00:00Z');
      list.push({ id: conv.id, name, preview: last?.[0]?.body || 'No messages yet', time: last?.[0]?.created_at || null, unread: count || 0 });
    }
    list.sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')));
    setRows(list);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const loadUsers = async (q) => {
    let req = supabase.from('user_profiles').select('user_id, first_name, last_name').neq('user_id', user?.id).limit(20);
    if (q) req = req.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
    const { data } = await req;
    setUsers(data || []);
  };

  const startChat = async (u) => {
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Conversation';
    const { data: conv, error } = await supabase
      .from('conversations').insert({ is_group: false, title: name, created_by: user.id }).select().single();
    if (error) { Alert.alert('Error', error.message); return; }
    await supabase.from('conversation_participants').insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: u.user_id },
    ]);
    setShowNew(false);
    router.push(`/messages/${conv.id}`);
  };

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()) || r.preview.toLowerCase().includes(query.toLowerCase()));

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Messages</Text>
        <TouchableOpacity onPress={() => { setShowNew(true); loadUsers(''); }}>
          <Ionicons name="create-outline" size={24} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color="#94a3b8" />
        <TextInput style={s.search} placeholder="Search messages..." value={query} onChangeText={setQuery} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<View style={s.empty}><Ionicons name="chatbubbles-outline" size={56} color="#cbd5e1" /><Text style={s.emptyText}>No conversations yet</Text><Text style={s.emptyHint}>Tap the compose icon to start chatting</Text></View>}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.row} onPress={() => router.push(`/messages/${item.id}`)}>
              <View style={s.avatar}><Ionicons name="person" size={22} color="#94a3b8" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.preview} numberOfLines={1}>{item.preview}</Text>
              </View>
              <View style={s.meta}>
                <Text style={s.time}>{fmt(item.time)}</Text>
                {item.unread > 0 && <View style={s.badge}><Text style={s.badgeText}>{item.unread}</Text></View>}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={showNew} transparent animationType="slide">
        <View style={s.modalBack}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>New Message</Text>
            <TextInput style={s.search} placeholder="Search people..." value={userQuery} onChangeText={(v) => { setUserQuery(v); loadUsers(v); }} />
            <FlatList
              data={users}
              keyExtractor={(u) => u.user_id}
              style={{ marginTop: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.userRow} onPress={() => startChat(item)}>
                  <View style={s.avatar}><Ionicons name="person" size={20} color="#94a3b8" /></View>
                  <Text style={s.name}>{item.first_name} {item.last_name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={s.closeBtn} onPress={() => setShowNew(false)}><Text style={s.closeText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 48 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  search: { flex: 1, fontSize: 15, color: '#0f172a' },
  list: { padding: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  preview: { fontSize: 13, color: '#64748b', marginTop: 2 },
  meta: { alignItems: 'flex-end', gap: 6 },
  time: { fontSize: 12, color: '#94a3b8' },
  badge: { backgroundColor: '#0ea5e9', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 12 },
  emptyHint: { fontSize: 13, color: '#cbd5e1', marginTop: 4 },
  modalBack: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  closeBtn: { padding: 14, alignItems: 'center', marginTop: 8 },
  closeText: { color: '#64748b', fontWeight: '600' },
});
