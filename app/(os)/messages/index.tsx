import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaWrapper } from '../../components/ui/SafeAreaWrapper';
import { EmptyState } from '../../components/ui/EmptyState';

interface MessageThread {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
}

const mockThreads: MessageThread[] = [
  { id: '1', name: 'Command Centre', lastMessage: 'New alert: System update required', time: '10:30', unread: 2, avatar: 'shield-alt' },
  { id: '2', name: 'Officer Johnson', lastMessage: 'Case #4521 evidence uploaded', time: '09:15', unread: 0, avatar: 'user-shield' },
  { id: '3', name: 'Court Clerk', lastMessage: 'Hearing rescheduled to 2PM', time: 'Yesterday', unread: 1, avatar: 'gavel' },
];

export default function MessagesIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const filtered = mockThreads.filter(t => {
    if (activeTab === 'unread' && t.unread === 0) return false;
    return t.name.toLowerCase().includes(search.toLowerCase()) || t.lastMessage.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <SafeAreaWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.composeBtn} onPress={() => router.push('/(os)/messages/compose')}>
          <FontAwesome5 name="edit" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <FontAwesome5 name="search" size={14} color="#94A3B8" />
          <TextInput style={styles.searchInput} placeholder="Search messages..." value={search} onChangeText={setSearch} placeholderTextColor="#94A3B8" />
        </View>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'all' && styles.tabActive]} onPress={() => setActiveTab('all')}>
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'unread' && styles.tabActive]} onPress={() => setActiveTab('unread')}>
          <Text style={[styles.tabText, activeTab === 'unread' && styles.tabTextActive]}>Unread</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <EmptyState icon="inbox" title="No messages found" message="Your messages will appear here" />
        ) : (
          filtered.map((thread) => (
            <TouchableOpacity key={thread.id} style={styles.threadItem} onPress={() => router.push(`/(os)/messages/thread/${thread.id}` as any)}>
              <View style={styles.avatar}>
                <FontAwesome5 name={thread.avatar} size={20} color="#64748B" />
              </View>
              <View style={styles.threadContent}>
                <View style={styles.threadTop}>
                  <Text style={styles.threadName}>{thread.name}</Text>
                  <Text style={styles.threadTime}>{thread.time}</Text>
                </View>
                <Text style={styles.threadMessage} numberOfLines={1}>{thread.lastMessage}</Text>
              </View>
              {thread.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{thread.unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  composeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  searchRow: { paddingHorizontal: 16, marginBottom: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: '#334155' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 10 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E2E8F0' },
  tabActive: { backgroundColor: '#10B981' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF' },
  threadItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, marginBottom: 10, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  threadContent: { flex: 1 },
  threadTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  threadName: { fontSize: 14, fontWeight: '700', color: '#334155' },
  threadTime: { fontSize: 11, color: '#94A3B8' },
  threadMessage: { fontSize: 13, color: '#64748B', marginTop: 4 },
  unreadBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  unreadText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
});
