// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function AuditLogsScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('health_audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      setLogs(data || []);
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetch(); }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Audit Logs</Text>
        <TouchableOpacity onPress={() => Alert.alert('Export', 'CSV export would generate here.')}><Ionicons name="download" size={24} color="#fff" /></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#10b981" /> : (
        <FlatList data={logs} keyExtractor={i => i.id} renderItem={({item}) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: item.action === 'DELETE' ? '#ef4444' : item.action === 'UPDATE' ? '#f59e0b' : '#10b981' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.action}>{item.action} - {item.table_name || 'system'}</Text>
                <Text style={styles.meta}>User: {item.user_id ? item.user_id.substring(0,8) : 'system'} • {new Date(item.created_at).toLocaleString()}</Text>
              </View>
            </View>
          </View>
        )} contentContainerStyle={styles.list} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} />} />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#1e293b' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  list: { padding: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  action: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  meta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
});
