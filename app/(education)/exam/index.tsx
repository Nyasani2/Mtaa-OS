import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function ExamListScreen() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await supabase.from('education_exams').select('*').order('exam_date', { ascending: false });
      setExams(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#ef4444" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Exams</Text>
        <TouchableOpacity onPress={() => router.push('/(education)/exams/create')}><Ionicons name="add-circle" size={24} color="#ef4444" /></TouchableOpacity>
      </View>
      <FlatList
        data={exams}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/(education)/exam/take?id=${item.id}`)}>
            <View style={styles.cardHeader}>
              <Text style={styles.examTitle}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: item.status === 'published' ? '#064e3b' : '#451a03' }]}>
                <Text style={{ color: item.status === 'published' ? '#6ee7b7' : '#fcd34d', fontSize: 10, fontWeight: '700' }}>{item.status?.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.examMeta}>{item.subject} • {item.exam_type?.replace('_', ' ')} • {item.duration_minutes} mins</Text>
            <Text style={styles.examDate}><Ionicons name="calendar-outline" size={12} color="#94a3b8" /> {item.exam_date ? new Date(item.exam_date).toLocaleDateString() : 'TBD'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No exams scheduled</Text>}
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  examTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
  examMeta: { color: '#94a3b8', fontSize: 13, marginBottom: 4 },
  examDate: { color: '#94a3b8', fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 40 },
});
