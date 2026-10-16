import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function EducationLanding() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'feed'|'events'|'admin'>('feed');
  const [feeds, setFeeds] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: f } = await supabase.from('education_feeds').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(20);
      const { data: e } = await supabase.from('education_events').select('*').order('date', { ascending: false }).limit(10);
      setFeeds(f || []);
      setEvents(e || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Education OS</Text>
          <Text style={styles.headerSub}>National Schooling System</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {(['feed', 'events', 'admin'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {activeTab === 'feed' && (
          <View>
            {feeds.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="document-text-outline" size={48} color="#475569" />
                <Text style={styles.emptyText}>No posts yet</Text>
              </View>
            ) : feeds.map((feed: any) => (
              <View key={feed.id} style={styles.card}>
                <Text style={styles.cardTitle}>{feed.title || 'Update'}</Text>
                <Text style={styles.cardContent}>{feed.content}</Text>
                <Text style={styles.cardMeta}>{new Date(feed.created_at).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'events' && (
          <View>
            {events.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="calendar-outline" size={48} color="#475569" />
                <Text style={styles.emptyText}>No upcoming events</Text>
              </View>
            ) : events.map((event: any) => (
              <View key={event.id} style={styles.card}>
                <Text style={styles.cardTitle}>{event.title}</Text>
                <Text style={styles.cardMeta}>{event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'admin' && (
          <View style={styles.adminGrid}>
            <TouchableOpacity style={styles.adminCard} onPress={() => router.push('/(education)/schools' as any)}>
              <Ionicons name="school" size={24} color="#3b82f6" />
              <Text style={styles.adminLabel}>Schools</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminCard} onPress={() => router.push('/(education)/teachers' as any)}>
              <Ionicons name="people" size={24} color="#10b981" />
              <Text style={styles.adminLabel}>Teachers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminCard} onPress={() => router.push('/(education)/students' as any)}>
              <Ionicons name="person" size={24} color="#f59e0b" />
              <Text style={styles.adminLabel}>Students</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminCard} onPress={() => router.push('/(education)/emergency-console' as any)}>
              <Ionicons name="warning" size={24} color="#ef4444" />
              <Text style={styles.adminLabel}>Emergency</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  tabBar: { flexDirection: 'row', backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3b82f6' },
  tabText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardContent: { color: '#cbd5e1', fontSize: 14, lineHeight: 20 },
  cardMeta: { color: '#64748b', fontSize: 12, marginTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#64748b', fontSize: 16, marginTop: 12 },
  adminGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  adminCard: { width: '47%', backgroundColor: '#1e293b', borderRadius: 12, padding: 20, alignItems: 'center', gap: 8 },
  adminLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
