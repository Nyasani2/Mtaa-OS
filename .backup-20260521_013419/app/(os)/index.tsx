// app/(os)/index.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

const quickActions = [
  { icon: 'wallet', label: 'Wallet', route: '/wallet', color: '#10B981' },
  { icon: 'medical', label: 'Health', route: '/health', color: '#EF4444' },
  { icon: 'apps', label: 'App Store', route: '/appstore', color: '#3B82F6' },
  { icon: 'car', label: 'MTaxi', route: '/mtaxi', color: '#F59E0B' },
  { icon: 'cart', label: 'Market', route: '/marketplace', color: '#8B5CF6' },
  { icon: 'people', label: 'Tribes', route: '/tribes', color: '#EC4899' },
];

const recentActivity = [
  { icon: 'arrow-down', label: 'Deposit', desc: 'KES 5,000 received', time: '2h ago', color: '#10B981' },
  { icon: 'medical', label: 'Health', desc: 'Appointment confirmed', time: '5h ago', color: '#EF4444' },
  { icon: 'swap-horizontal', label: 'Transfer', desc: 'Sent to John Doe', time: '1d ago', color: '#3B82F6' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.userName}>{profile?.display_name || profile?.full_name || user?.email?.split('@')[0] || 'User'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications' as any)}>
            <Ionicons name="notifications" size={22} color="#1E293B" />
            <View style={styles.badge} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/settings' as any)}>
            <Ionicons name="settings" size={22} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionItem}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.map((activity, index) => (
            <View key={index} style={styles.activityRow}>
              <View style={[styles.activityIcon, { backgroundColor: activity.color + '15' }]}>
                <Ionicons name={activity.icon as any} size={18} color={activity.color} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>{activity.label}</Text>
                <Text style={styles.activityDesc}>{activity.desc}</Text>
              </View>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          ))}
        </View>

        {/* Health Summary */}
        <TouchableOpacity style={styles.summaryCard} onPress={() => router.push('/health' as any)}>
          <View style={styles.summaryHeader}>
            <Ionicons name="medical" size={20} color="#EF4444" />
            <Text style={styles.summaryTitle}>Health</Text>
          </View>
          <Text style={styles.summaryText}>Next appointment: Not scheduled</Text>
          <Text style={styles.summarySub}>Tap to book or view records</Text>
        </TouchableOpacity>

        {/* Wallet Summary */}
        <TouchableOpacity style={styles.summaryCard} onPress={() => router.push('/wallet' as any)}>
          <View style={styles.summaryHeader}>
            <Ionicons name="wallet" size={20} color="#10B981" />
            <Text style={styles.summaryTitle}>Wallet</Text>
          </View>
          <Text style={styles.summaryText}>Quick access to balance & transfers</Text>
          <Text style={styles.summarySub}>Tap to manage accounts</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  greeting: { fontSize: 14, color: '#64748B' },
  userName: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  badge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  content: { flex: 1, paddingHorizontal: 16 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  actionItem: { width: '30%', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 16 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#475569' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  activityRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 8 },
  activityIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activityInfo: { flex: 1 },
  activityLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  activityDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  activityTime: { fontSize: 11, color: '#94A3B8' },
  summaryCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  summaryText: { fontSize: 14, color: '#475569' },
  summarySub: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
});
