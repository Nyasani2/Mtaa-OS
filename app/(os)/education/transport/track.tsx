// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function TransportTrackScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('education_transport_logs')
        .select('*, student:student_id(full_name)')
        .eq('parent_id', user?.id)
        .order('timestamp', { ascending: false })
        .limit(20);
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Transport Tracking</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />} contentContainerStyle={styles.content}>
          {logs.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="bus-outline" size={48} color="#64748b" />
              <Text style={styles.emptyText}>No transport activity yet</Text>
            </View>
          ) : (
            logs.map((log, idx) => (
              <View key={idx} style={styles.logCard}>
                <View style={styles.logIcon}>
                  <Ionicons name={log.action === 'boarded' ? 'log-in' : 'log-out'} size={20} color={log.action === 'boarded' ? '#22c55e' : '#f59e0b'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logTitle}>{log.student?.full_name || 'Student'}</Text>
                  <Text style={styles.logMeta}>{log.action === 'boarded' ? 'Boarded the bus' : 'Arrived at destination'}</Text>
                  <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: log.action === 'boarded' ? '#dcfce7' : '#fef3c7' }]}>
                  <Text style={[styles.statusText, { color: log.action === 'boarded' ? '#16a34a' : '#d97706' }]}>{log.action.toUpperCase()}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#64748b', fontSize: 16, marginTop: 12 },
  logCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  logIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  logMeta: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  logTime: { fontSize: 11, color: '#64748b', marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
});
