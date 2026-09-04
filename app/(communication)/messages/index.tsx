import React, { useEffect, useState } from 'react';
// @ts-nocheck
import { supabase } from '@/lib/supabase';
// app/(communication)/messages/index.tsx
// MTAA Messenger — Conversations

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const FALLBACK_CHATS = [
  { id: '1', name: 'John Doe', message: 'Hey, are you available?', time: '2m', unread: 2 },
  { id: '2', name: 'Jane Smith', message: 'Meeting at 3pm', time: '1h', unread: 0 },
  { id: '3', name: 'Team Alpha', message: 'Project update sent', time: '3h', unread: 5 },
  { id: '4', name: 'Sarah Kim', message: 'Thanks!', time: '1d', unread: 0 },
];

export default function MessagesScreen() {
  const [chats, setChats] = useState(FALLBACK_CHATS);
  useEffect(() => {
    supabase.from('conversations').select('*').order('created_at', { ascending: false }).limit(20).then(({ data }) => {
      if (data && data.length > 0) setChats(data.map((c: any) => ({ id: c.id, name: c.title || 'Chat', message: c.last_message || '', time: 'now', unread: c.unread_count || 0 })));
    });
  }, []);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity>
          <Ionicons name="create-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {chats.map((chat: any) => (
          <TouchableOpacity key={chat.id} style={styles.chatRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#C7C7CC" />
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{chat.name}</Text>
                <Text style={styles.chatTime}>{chat.time}</Text>
              </View>
              <View style={styles.chatFooter}>
                <Text style={styles.chatMessage} numberOfLines={1}>{chat.message}</Text>
                {chat.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{chat.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#000' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#000' },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfo: { flex: 1, marginLeft: 12 },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: { fontSize: 16, fontWeight: '600', color: '#000' },
  chatTime: { fontSize: 12, color: '#8E8E93' },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  chatMessage: { fontSize: 14, color: '#8E8E93', flex: 1 },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
