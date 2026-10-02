// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('system_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Initializing ASIS Admin Core...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>OS Admin Command Center</Text>
        <Text style={styles.headerSub}>Welcome, {user?.email?.split('@')[0] || 'Admin'}</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />}
      >
        {/* ASIS Health Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="sparkles" size={20} color="#8b5cf6" />
            <Text style={styles.cardTitle}>ASIS Core Status</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Engine</Text>
              <Text style={styles.statusValue}>Local Qwen v3.6</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Health Score</Text>
              <Text style={[styles.statusValue, { color: '#00ff88' }]}>98.5%</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="grid" size={20} color="#60a5fa" />
            <Text style={styles.cardTitle}>Module Administration</Text>
          </View>
          <View style={styles.grid}>
            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(os)/wallet/merchant-dashboard')}>
              <Ionicons name="wallet" size={24} color="#fbbf24" />
              <Text style={styles.gridText}>Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(education)/admin-dashboard')}>
              <Ionicons name="school" size={24} color="#34d399" />
              <Text style={styles.gridText}>Education</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(os)/health/facility-admin')}>
              <Ionicons name="medical" size={24} color="#f87171" />
              <Text style={styles.gridText}>Health</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(mtaxi)/driver/dashboard')}>
              <Ionicons name="car" size={24} color="#60a5fa" />
              <Text style={styles.gridText}>Transport</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Event Logs Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={20} color="#60a5fa" />
            <Text style={styles.cardTitle}>Recent Audit Logs</Text>
          </View>
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>No recent events logged.</Text>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logIcon}>
                  <Ionicons 
                    name={log.event_type?.includes('error') ? 'warning' : 'checkmark-circle'} 
                    size={16} 
                    color={log.event_type?.includes('error') ? '#ef4444' : '#00ff88'} 
                  />
                </View>
                <View style={styles.logContent}>
                  <Text style={styles.logType}>{log.event_type || 'System Event'}</Text>
                  <Text style={styles.logDetails} numberOfLines={2}>
                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                  </Text>
                  <Text style={styles.logTime}>
                    {new Date(log.created_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 14, color: '#60a5fa', marginTop: 4 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusItem: { alignItems: 'center' },
  statusLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  statusValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { flex: 1, minWidth: '45%', backgroundColor: '#0f172a', borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  gridText: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  emptyText: { color: '#64748b', textAlign: 'center', paddingVertical: 20 },
  logItem: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  logIcon: { marginTop: 2 },
  logContent: { flex: 1 },
  logType: { fontSize: 14, fontWeight: '600', color: '#e2e8f0', marginBottom: 4 },
  logDetails: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  logTime: { fontSize: 10, color: '#64748b' },
});
