import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { ProfileService } from '@/lib/profile/services/profile-service';
import type { ProfileNotification } from '@/lib/profile/types';

const NOTIFICATION_ICONS: Record<string, string> = {
  profile_view: 'eye-outline', follow: 'person-add-outline', follow_request: 'person-add-outline',
  verification_update: 'shield-checkmark-outline', mention: 'at-outline', tag: 'pricetag-outline',
  recommendation: 'thumbs-up-outline', business_update: 'business-outline', creator_earnings: 'cash-outline',
  tip: 'gift-outline', subscription: 'star-outline', achievement: 'trophy-outline',
  report_update: 'flag-outline', block: 'ban-outline', new_subscriber: 'people-outline',
};

export default function NotificationCenterScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<ProfileNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchData = async () => { if (!user?.id) return; const data = await ProfileService.getNotifications(user.id, filter === 'unread'); setNotifications(data); setLoading(false); };
  useEffect(() => { fetchData(); }, [user?.id, filter]);

  const markRead = async (id: string) => { await ProfileService.markNotificationRead(id); setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n)); };
  const markAllRead = async () => { if (!user?.id) return; await Promise.all(notifications.filter(n => !n.is_read).map(n => ProfileService.markNotificationRead(n.id))); setNotifications(prev => prev.map(n => ({ ...n, is_read: true }))); };
  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#00d4ff" /></View>;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const renderItem = ({ item }: { item: ProfileNotification }) => (
    <TouchableOpacity style={[styles.notifCard, !item.is_read && styles.notifUnread]} onPress={() => markRead(item.id)}>
      <View style={[styles.notifIcon, { backgroundColor: !item.is_read ? '#00d4ff22' : '#111' }]}>
        <Ionicons name={(NOTIFICATION_ICONS[item.notification_type] || 'notifications-outline') as any} size={18} color={!item.is_read ? '#00d4ff' : '#555'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.notifTitle, !item.is_read && styles.notifTitleUnread]}>{item.title}</Text>
        {item.body && <Text style={styles.notifBody}>{item.body}</Text>}
        <Text style={styles.notifTime}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? <TouchableOpacity onPress={markAllRead}><Text style={styles.markAll}>Mark all read</Text></TouchableOpacity> : <View style={{ width: 60 }} />}
      </View>
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]} onPress={() => setFilter('all')}><Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, filter === 'unread' && styles.filterBtnActive]} onPress={() => setFilter('unread')}><Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>Unread ({unreadCount})</Text></TouchableOpacity>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="notifications-off-outline" size={48} color="#444" /><Text style={styles.emptyText}>No notifications</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  markAll: { color: '#00d4ff', fontSize: 12, fontWeight: '600' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, backgroundColor: '#111' },
  filterBtnActive: { backgroundColor: '#00d4ff22' },
  filterText: { color: '#888', fontSize: 12 },
  filterTextActive: { color: '#00d4ff', fontWeight: '600' },
  notifCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  notifUnread: { backgroundColor: '#00d4ff08' },
  notifIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifTitle: { color: '#888', fontSize: 13, fontWeight: '500' },
  notifTitleUnread: { color: '#fff', fontWeight: '700' },
  notifBody: { color: '#666', fontSize: 12, marginTop: 2 },
  notifTime: { color: '#444', fontSize: 10, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00d4ff', marginLeft: 8 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#666', fontSize: 14, marginTop: 12 },
});
