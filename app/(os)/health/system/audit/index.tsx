// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function AuditLogScreen() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(100);
      setLogs(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const exportLogs = async () => {
    const csv = [
      'Timestamp,Action,Resource,Details,IP',
      ...logs.map((l) => [
        new Date(l.created_at).toISOString(),
        l.action,
        `${l.resource_type || ''}:${l.resource_id || ''}`,
        JSON.stringify(l.details || {}),
        l.ip_address || '',
      ].join(','))
    ].join('\n');

    try {
      await Share.share({
        message: csv,
        title: 'MTAA Audit Log Export',
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const getIcon = (action) => {
    if (action.includes('login')) return 'log-in';
    if (action.includes('logout')) return 'log-out';
    if (action.includes('create')) return 'add-circle';
    if (action.includes('update')) return 'create';
    if (action.includes('delete')) return 'trash';
    return 'document-text';
  };

  if (loading) return <View style={[s.container, s.center]}><ActivityIndicator size="large" color="#0f172a" /></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Audit Logs</Text>
          <Text style={s.subtitle}>{logs.length} activities recorded</Text>
        </View>
        <TouchableOpacity style={s.exportBtn} onPress={exportLogs}>
          <Ionicons name="download-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {logs.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
          <Text style={s.emptyText}>No audit logs found</Text>
        </View>
      ) : (
        logs.map((log) => (
          <View key={log.id} style={s.logItem}>
            <View style={s.logIcon}>
              <Ionicons name={getIcon(log.action) as any} size={24} color="#0f172a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.logAction}>{log.action}</Text>
              {log.resource_type && <Text style={s.logResource}>{log.resource_type} • {log.resource_id?.slice(0, 8)}...</Text>}
              <Text style={s.logTime}>{new Date(log.created_at).toLocaleString()}</Text>
            </View>
            {log.ip_address && <Text style={s.logIP}>{log.ip_address}</Text>}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  exportBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 12 },
  logItem: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  logIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  logAction: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  logResource: { fontSize: 13, color: '#64748b', marginTop: 2 },
  logTime: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  logIP: { fontSize: 11, color: '#94a3b8', alignSelf: 'flex-start', marginTop: 4 },
});
