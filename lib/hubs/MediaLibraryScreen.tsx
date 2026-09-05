// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export function makeMediaLibrary(type: string, icon: string, accent: string) {
  return function MediaLibraryScreen() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      (async () => {
        try {
          const { data } = await supabase
            .from('studio_tracks')
            .select('*')
            .eq('track_type', type)
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(50);
          setItems(data || []);
        } finally {
          setLoading(false);
        }
      })();
    }, []);

    return (
      <ScrollView style={st.container} contentContainerStyle={st.content}>
        <View style={[st.header, { backgroundColor: accent }]}>
          <Ionicons name={icon} size={28} color="#fff" />
          <Text style={st.title}>{type === 'video' ? 'Videos' : 'Podcasts'}</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color={accent} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <View style={st.empty}>
            <Ionicons name={icon} size={64} color="#cbd5e1" />
            <Text style={st.emptyText}>No {type} published yet</Text>
            <Text style={st.emptyHint}>Creators can upload from Studio</Text>
          </View>
        ) : (
          items.map((it: any) => (
            <View key={it.id} style={st.card}>
              <View style={[st.thumb, { backgroundColor: accent + '22' }]}>
                <Ionicons name={icon} size={26} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.cardTitle}>{it.title}</Text>
                <Text style={st.cardMeta}>{it.artist || 'Unknown creator'}</Text>
              </View>
              <Ionicons name="play-circle" size={28} color={accent} />
            </View>
          ))
        )}
      </ScrollView>
    );
  };
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 52 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 12 },
  emptyHint: { fontSize: 13, color: '#cbd5e1', marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 10 },
  thumb: { width: 52, height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
