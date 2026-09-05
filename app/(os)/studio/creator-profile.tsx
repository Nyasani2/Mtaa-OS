// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const TABS = [
  { key: 'tracks', label: 'Published', table: 'studio_tracks', icon: 'musical-notes', accent: '#8b5cf6' },
  { key: 'drafts', label: 'Drafts', table: 'studio_drafts', icon: 'document', accent: '#f59e0b' },
  { key: 'broadcasts', label: 'Broadcasts', table: 'studio_broadcasts', icon: 'radio', accent: '#ef4444' },
];

export default function CreatorProfileScreen() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('tracks');
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      const results: any = {};
      for (const tab of TABS) {
        const userIdField = tab.table === 'studio_broadcasts' ? 'broadcaster_id' : 'creator_id';
        const { data } = await supabase
          .from(tab.table)
          .select('*')
          .eq(userIdField, user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        results[tab.key] = data || [];
      }
      setData(results);
      setLoading(false);
    })();
  }, [user?.id]);

  const current = TABS.find((t) => t.key === activeTab) || TABS[0];
  const items = data[activeTab] || [];

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#8b5cf6" /></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Ionicons name="person-circle" size={48} color="#8b5cf6" />
        <Text style={s.title}>Creator Profile</Text>
      </View>

      <View style={s.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab.key} style={[s.tab, activeTab === tab.key && { borderColor: tab.accent, backgroundColor: tab.accent + '18' }]} onPress={() => setActiveTab(tab.key)}>
            <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.key ? tab.accent : '#64748b'} />
            <Text style={[s.tabText, activeTab === tab.key && { color: tab.accent }]}>{tab.label}</Text>
            <View style={[s.badge, { backgroundColor: tab.accent }]}>
              <Text style={s.badgeText}>{(data[tab.key] || []).length}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {items.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name={current.icon} size={56} color="#cbd5e1" />
          <Text style={s.emptyText}>No {current.label.toLowerCase()} yet</Text>
        </View>
      ) : (
        items.map((item: any) => (
          <View key={item.id} style={s.card}>
            <Ionicons name={current.icon} size={22} color={current.accent} />
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{item.title || item.name || 'Untitled'}</Text>
              <Text style={s.cardMeta}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </View>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  tabBar: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#94a3b8', marginTop: 12 },
});
