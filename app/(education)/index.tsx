import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { getSchools, getTeachers, getStudents, getFeeds, getEvents } from '@/lib/services/education-service';

export default function EducationLanding() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'feed'|'events'|'admin'>('feed');
  const [schools, setSchools] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [feeds, setFeeds] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [s, t, st, f, ev] = await Promise.all([
        getSchools().catch(() => []),
        getTeachers('').catch(() => []),
        getStudents('').catch(() => []),
        getFeeds('').catch(() => []),
        getEvents('').catch(() => []),
      ]);
      setSchools(s || []); setTeachers(t || []); setStudents(st || []);
      setFeeds(f || []); setEvents(ev || []);
    } catch (e) { console.log('Education load error:', e); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const QuickAccess = ({ icon, label, color, onPress }: any) => (
    <TouchableOpacity style={[styles.quickBtn, { backgroundColor: color + '20' }]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.quickLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );

  const AdminCard = ({ icon, label, color, onPress }: any) => (
    <TouchableOpacity style={styles.adminCard} onPress={onPress}>
      <View style={[styles.adminIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.adminLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Education OS</Text>
            <Text style={styles.headerSub}>{schools.length} Schools · {teachers.length} Teachers · {students.length} Students</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(education)/messages')}>
            <Ionicons name="mail-outline" size={24} color="#fff" />
            <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
          <QuickAccess icon="school-outline" label="Schools" color="#60a5fa" onPress={() => router.push('/(education)/schools')} />
          <QuickAccess icon="people-outline" label="Teachers" color="#34d399" onPress={() => router.push('/(education)/teachers')} />
          <QuickAccess icon="calendar-outline" label="Calendar" color="#fbbf24" onPress={() => router.push('/(education)/timetable')} />
          <QuickAccess icon="shield-checkmark-outline" label="Command" color="#f87171" onPress={() => router.push('/(education)/ict/command-center')} />
          <QuickAccess icon="person-outline" label="Head Teacher" color="#a78bfa" onPress={() => router.push('/(education)/school/head-teacher')} />
          <QuickAccess icon="warning-outline" label="Emergency" color="#ef4444" onPress={() => router.push('/(education)/emergency')} />
        </ScrollView>
      </View>

      <View style={styles.tabBar}>
        {['feed', 'events', 'admin'].map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab as any)}>
            <Ionicons name={tab === 'feed' ? 'newspaper-outline' : tab === 'events' ? 'calendar-outline' : 'grid-outline'} size={16} color={activeTab === tab ? '#3b82f6' : '#94a3b8'} />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'feed' && (
          <View>
            <TouchableOpacity style={styles.createPost} onPress={() => router.push('/(education)/announcements/create')}>
              <View style={styles.avatar}><Text style={styles.avatarText}>N</Text></View>
              <Text style={styles.createPostText}>Share an announcement, update, or achievement...</Text>
              <Ionicons name="image-outline" size={20} color="#94a3b8" />
            </TouchableOpacity>
            {feeds.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No posts yet</Text>
                <Text style={styles.emptySub}>Be the first to share something!</Text>
              </View>
            ) : feeds.map((feed: any) => (
              <View key={feed.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={[styles.avatar, { backgroundColor: '#3b82f6' }]}>
                    <Text style={styles.avatarText}>{feed.author?.charAt(0) || 'A'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.postAuthor}>{feed.author || 'Anonymous'}</Text>
                    <Text style={styles.postTime}>{new Date(feed.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
                <Text style={styles.postContent}>{feed.content}</Text>
                <View style={styles.postActions}>
                  <TouchableOpacity style={styles.postAction}><Ionicons name="heart-outline" size={18} color="#94a3b8" /><Text style={styles.postActionText}>{feed.likes || 0}</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.postAction}><Ionicons name="chatbubble-outline" size={18} color="#94a3b8" /><Text style={styles.postActionText}>{feed.comments || 0}</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.postAction}><Ionicons name="share-outline" size={18} color="#94a3b8" /></TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'events' && (
          <View style={{ padding: 16 }}>
            {events.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No upcoming events</Text>
              </View>
            ) : events.map((event: any) => (
              <TouchableOpacity key={event.id} style={styles.eventCard} onPress={() => {}}>
                <View style={styles.eventDate}>
                  <Text style={styles.eventMonth}>{new Date(event.date).toLocaleString('default', { month: 'short' })}</Text>
                  <Text style={styles.eventDay}>{new Date(event.date).getDate()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventMeta}>{event.location} · {event.time}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'admin' && (
          <View style={{ padding: 16 }}>
            <Text style={styles.sectionTitle}>School Management</Text>
            <View style={styles.adminGrid}>
              <AdminCard icon="school-outline" label="Create School" color="#3b82f6" onPress={() => router.push('/(education)/schools/create')} />
              <AdminCard icon="person-add-outline" label="Invite Teachers" color="#10b981" onPress={() => router.push('/(education)/schools/invite-teacher')} />
              <AdminCard icon="cash-outline" label="Fee Structure" color="#f59e0b" onPress={() => router.push('/(education)/school/fees')} />
              <AdminCard icon="wallet-outline" label="Payroll" color="#8b5cf6" onPress={() => router.push('/(education)/payroll')} />
            </View>
            <Text style={styles.sectionTitle}>Operations</Text>
            <View style={styles.adminGrid}>
              <AdminCard icon="videocam-outline" label="CCTV Monitor" color="#ef4444" onPress={() => router.push('/(education)/ict/cctv')} />
              <AdminCard icon="map-outline" label="School Map" color="#059669" onPress={() => router.push('/(education)/ict/school-map')} />
              <AdminCard icon="bus-outline" label="Transport" color="#0ea5e9" onPress={() => router.push('/(education)/ict/transport')} />
              <AdminCard icon="finger-print-outline" label="Biometrics" color="#6366f1" onPress={() => router.push('/(education)/ict/biometrics')} />
            </View>
            <Text style={styles.sectionTitle}>Emergency & Security</Text>
            <View style={styles.adminGrid}>
              <AdminCard icon="warning-outline" label="Emergency" color="#dc2626" onPress={() => router.push('/(education)/emergency')} />
              <AdminCard icon="shield-checkmark-outline" label="Command Center" color="#1e3a5f" onPress={() => router.push('/(education)/ict/command-center')} />
              <AdminCard icon="people-outline" label="Visitors" color="#64748b" onPress={() => router.push('/(education)/ict/visitors')} />
              <AdminCard icon="qr-code-outline" label="QR System" color="#8b5cf6" onPress={() => router.push('/(education)/ict/qr-system')} />
            </View>
            <Text style={styles.sectionTitle}>Academic</Text>
            <View style={styles.adminGrid}>
              <AdminCard icon="book-outline" label="Assignments" color="#3b82f6" onPress={() => router.push('/(education)/assignments')} />
              <AdminCard icon="trophy-outline" label="Grades" color="#f59e0b" onPress={() => router.push('/(education)/grades')} />
              <AdminCard icon="checkbox-outline" label="Attendance" color="#10b981" onPress={() => router.push('/(education)/attendance')} />
              <AdminCard icon="time-outline" label="Timetable" color="#8b5cf6" onPress={() => router.push('/(education)/timetable')} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { backgroundColor: '#1e3a5f', paddingTop: 50, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', borderRadius: 10, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  quickRow: { paddingHorizontal: 12 },
  quickBtn: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, marginHorizontal: 4, minWidth: 70 },
  quickLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3b82f6' },
  tabText: { fontSize: 13, color: '#94a3b8', marginLeft: 6 },
  tabTextActive: { color: '#3b82f6', fontWeight: '600' },
  createPost: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 12, padding: 12, borderRadius: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  createPostText: { flex: 1, marginLeft: 10, color: '#94a3b8', fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, color: '#94a3b8', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#cbd5e1', marginTop: 4 },
  postCard: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8, padding: 14, borderRadius: 12 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postAuthor: { fontWeight: '600', fontSize: 14, color: '#1e293b' },
  postTime: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  postContent: { fontSize: 14, color: '#334155', lineHeight: 20 },
  postActions: { flexDirection: 'row', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  postAction: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  postActionText: { fontSize: 13, color: '#94a3b8', marginLeft: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginTop: 16, marginBottom: 10 },
  adminGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  adminCard: { width: '23%', backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  adminIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  adminLabel: { fontSize: 11, color: '#475569', textAlign: 'center', fontWeight: '500' },
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8 },
  eventDate: { width: 50, height: 50, backgroundColor: '#3b82f6', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  eventMonth: { fontSize: 10, color: '#fff', textTransform: 'uppercase', fontWeight: '600' },
  eventDay: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  eventTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  eventMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
});
