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
      const [f, ev] = await Promise.all([
        supabase.from('education_feed_posts').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('education_events').select('*').order('date', { ascending: false }).limit(10),
      ]);
      setFeeds(f.data || []);
      setEvents(ev.data || []);
    } catch (e) { console.error('Education load error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Education OS</Text>
        <Text style={styles.headerSub}>{user?.email?.split('@')[0] || 'Guest'}</Text>
      </View>
      <View style={styles.tabBar}>
        {(['feed', 'events', 'admin'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {activeTab === 'feed' && feeds.map((f: any) => (
          <View key={f.id} style={styles.card}>
            <Text style={styles.cardTitle}>{f.title || 'Update'}</Text>
            <Text style={styles.cardContent}>{f.content}</Text>
          </View>
        ))}
        {activeTab === 'events' && events.map((e: any) => (
          <View key={e.id} style={styles.card}>
            <Text style={styles.cardTitle}>{e.title}</Text>
            <Text style={styles.cardContent}>{e.date ? new Date(e.date).toLocaleDateString() : 'TBD'}</Text>
          </View>
        ))}
        {activeTab === 'admin' && (
          <View style={styles.adminGrid}>
            <TouchableOpacity style={styles.adminCard} onPress={() => router.push('/(education)/schools' as any)}>
              <Ionicons name="school" size={24} color="#3b82f6" />
              <Text style={styles.adminLabel}>Schools</Text>
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
  headerTitle: { fontSize: 22, fontWeight: '800' as const, color: '#fff' },
  headerSub: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3b82f6' },
  tabText: { color: '#64748b', fontSize: 14, fontWeight: '600' as const },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700' as const, color: '#fff', marginBottom: 8 },
  cardContent: { fontSize: 14, color: '#cbd5e1', lineHeight: 20 },
  adminGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  adminCard: { width: '47%', backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center' },
  adminLabel: { fontSize: 13, color: '#fff', marginTop: 8 },
});
