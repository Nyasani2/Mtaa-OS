import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  MessageSquare,
  Send,
  Bell,
  Filter,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth/useAuthStore';

interface MessageThread {
  id: string;
  participant_name: string;
  participant_role: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  avatar_url?: string;
}

const MOCK_THREADS: MessageThread[] = [
  {
    id: '1',
    participant_name: 'Mrs. Wanjiku',
    participant_role: 'Head Teacher',
    last_message: 'Please submit the term reports by Friday.',
    last_message_time: '10:30 AM',
    unread_count: 2,
  },
  {
    id: '2',
    participant_name: 'Mr. Ochieng',
    participant_role: 'Mathematics',
    last_message: 'The exam schedule has been updated.',
    last_message_time: 'Yesterday',
    unread_count: 0,
  },
  {
    id: '3',
    participant_name: 'School Admin',
    participant_role: 'Administration',
    last_message: 'Fee payment reminder: Term 2 dues due next week.',
    last_message_time: 'Jun 9',
    unread_count: 1,
  },
  {
    id: '4',
    participant_name: 'Ms. Achieng',
    participant_role: 'Science Dept',
    last_message: 'Lab equipment delivery confirmed for Monday.',
    last_message_time: 'Jun 8',
    unread_count: 0,
  },
];

export default function EducationMessages() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [threads, setThreads] = useState<MessageThread[]>(MOCK_THREADS);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredThreads = threads.filter(
    (t) =>
      t.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = threads.reduce((sum, t) => sum + t.unread_count, 0);

  const renderThread = ({ item }: { item: MessageThread }) => (
    <TouchableOpacity style={styles.threadCard} activeOpacity={0.75}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.participant_name.charAt(0)}
        </Text>
        {item.unread_count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unread_count}</Text>
          </View>
        )}
      </View>
      <View style={styles.threadBody}>
        <View style={styles.threadHeader}>
          <Text style={styles.participantName}>{item.participant_name}</Text>
          <Text style={styles.timeText}>{item.last_message_time}</Text>
        </View>
        <Text style={styles.roleText}>{item.participant_role}</Text>
        <Text
          style={[
            styles.lastMessage,
            item.unread_count > 0 && styles.lastMessageUnread,
          ]}
          numberOfLines={1}
        >
          {item.last_message}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Messages</Text>
          {totalUnread > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Bell size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Search size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterBtn}>
          <Filter size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Threads List */}
      <FlatList
        data={filteredThreads}
        keyExtractor={(item) => item.id}
        renderItem={renderThread}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MessageSquare size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No messages found</Text>
          </View>
        }
      />

      {/* Compose FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <Send size={22} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { padding: 8, borderRadius: 10, backgroundColor: '#F3F4F6' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  headerBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  iconBtn: { padding: 8, borderRadius: 10, backgroundColor: '#F3F4F6' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#111827',
  },
  filterBtn: { padding: 4 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#4F46E5' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  threadBody: { flex: 1, marginLeft: 12 },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  timeText: { fontSize: 12, color: '#9CA3AF' },
  roleText: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  lastMessage: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  lastMessageUnread: { color: '#374151', fontWeight: '500' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 15, color: '#9CA3AF', marginTop: 12 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
