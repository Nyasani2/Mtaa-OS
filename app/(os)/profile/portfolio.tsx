import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, FolderOpen, Plus } from 'lucide-react-native';

interface PortfolioItem {
  id: string; title: string; description?: string; media_url?: string; category?: string; created_at: string;
}

export default function PortfolioScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    supabase.from('portfolio_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setItems(data || []); setLoading(false); })
      ; setLoading(false);
  }, [user?.id]);

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#f97316" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color="#f8fafc" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Portfolio</Text>
        <TouchableOpacity onPress={() => { /* TODO: add portfolio item */ }}><Plus size={24} color="#f97316" /></TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <FolderOpen size={48} color="#475569" />
            <Text style={styles.emptyText}>No Portfolio Items</Text>
            <Text style={styles.emptySub}>Showcase your work and projects</Text>
          </View>
        ) : (
          items.map(item => (
            <View key={item.id} style={styles.card}>
              {item.media_url ? <Image source={{ uri: item.media_url }} style={styles.media} /> : null}
              <Text style={styles.title}>{item.title}</Text>
              {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
              {item.category ? <Text style={styles.badge}>{item.category}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  scroll: { flex: 1, padding: 16 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#f8fafc', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  media: { width: '100%', height: 180, borderRadius: 10, marginBottom: 12 },
  title: { color: '#f8fafc', fontSize: 16, fontWeight: '600' },
  desc: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  badge: { color: '#f97316', fontSize: 11, fontWeight: '600', marginTop: 8, textTransform: 'uppercase' },
});
