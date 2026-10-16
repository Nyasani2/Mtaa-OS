import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function LiveClassListScreen() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await supabase.from('education_live_streams').select('*').order('scheduled_at', { ascending: false });
      setClasses(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const getStatusColor = (status: string) => {
    switch(status) { case 'live': return '#ef4444'; case 'scheduled': return '#3b82f6'; case 'completed': return '#10b981'; default: return '#64748b'; }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#ef4444" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Live Classes</Text>
        <TouchableOpacity onPress={() => router.push('/(education)/live-class/create')}><Ionicons name="add-circle" size={24} color="#ef4444" /></TouchableOpacity>
      </View>
      <FlatList
        data={classes}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.liveBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <View style={[styles.liveDot, { backgroundColor: getStatusColor(item.status) }]} />
                <Text style={[styles.liveText, { color: getStatusColor(item.status) }]}>{item.status?.toUpperCase()}</Text>
              </View>
              <Text style={styles.time}>{item.scheduled_at ? new Date(item.scheduled_at).toLocaleTimeString() : 'TBD'}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            {item.description && <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>}
            <Text style={styles.meta}><Ionicons name="person-outline" size={12} color="#94a3b8" /> {item.host_name || 'Teacher'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No live classes scheduled</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 10, fontWeight: '700' },
  time: { color: '#94a3b8', fontSize: 12 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  desc: { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
  meta: { color: '#94a3b8', fontSize: 12 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 40 },
});
