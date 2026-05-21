import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotification } from '../hooks/use-notification';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Card } from '../components/ui/Card';
import { SafeAreaWrapper } from '../components/ui/SafeAreaWrapper';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { notifications, isLoading, error, markAsRead, markAllAsRead, refetch } = useNotification();
  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  if (isLoading) return <SafeAreaWrapper><LoadingState message="Loading notifications..." /></SafeAreaWrapper>;
  if (error) return <SafeAreaWrapper><ErrorState title="Notifications unavailable" message={error.message || 'Failed to load notifications'} onRetry={refetch} /></SafeAreaWrapper>;

  return (
    <SafeAreaWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}><Text style={styles.markAllText}>Mark all read</Text></TouchableOpacity>}
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        {(!notifications || notifications.length === 0) ? (
          <EmptyState icon="bell" title="No notifications" message="You're all caught up. New alerts will appear here." />
        ) : (
          notifications.map((notification: any) => (
            <TouchableOpacity key={notification.id} onPress={() => { markAsRead(notification.id); if (notification.route) router.push(notification.route); }}>
              <Card title={notification.title} subtitle={notification.time} icon={notification.icon || 'bell'} iconColor={notification.color || '#1E40AF'} badge={!notification.read ? 'NEW' : undefined} badgeColor={!notification.read ? '#DC2626' : '#10B981'}>
                <Text style={styles.message}>{notification.message}</Text>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F1F5F9' },
  markAllText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  message: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },
});
