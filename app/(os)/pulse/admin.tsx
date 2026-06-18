// app/(os)/pulse/admin.tsx
// MTAA Pulse — Admin Moderation Dashboard (ported from old AdminDashboard.tsx)

import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/useAuthStore';
import type { PulseReport, PulseModerationItem } from '@/domains/pulse/types';

export default function PulseAdmin() {
  const { user } = useAuth();
  const [reports, setReports] = useState<PulseReport[]>([]);
  const [moderation, setModeration] = useState<PulseModerationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'moderation' | 'fraud'>('reports');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsData, modData] = await Promise.all([
        supabase.from('pulse_reports').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('pulse_moderation_queue').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(50),
      ]);

      setReports(reportsData.data || []);
      setModeration(modData.data || []);
    } catch (e) {
      console.error('Admin load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string, resolution: string) => {
    try {
      await supabase.from('pulse_reports').update({
        status: 'resolved',
        resolution,
        resolved_at: new Date().toISOString(),
      }).eq('id', reportId);

      setReports(prev => prev.filter(r => r.id !== reportId));
      Alert.alert('Resolved', 'Report has been resolved.');
    } catch (e) {
      Alert.alert('Error', 'Failed to resolve report.');
    }
  };

  const handleModerate = async (itemId: string, action: 'flagged' | 'limited' | 'removed' | 'restored') => {
    try {
      await supabase.from('pulse_moderation_queue').update({
        status: action,
        moderator_id: user?.id,
        action_taken: action,
      }).eq('id', itemId);

      setModeration(prev => prev.filter(m => m.id !== itemId));
      Alert.alert('Action Taken', `Content has been ${action}.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to take action.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading admin panel...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pulse Admin</Text>
        <Text style={styles.subtitle}>Content Moderation and Reports</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{reports.length}</Text>
          <Text style={styles.statLabel}>Pending Reports</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{moderation.length}</Text>
          <Text style={styles.statLabel}>In Queue</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {(['reports', 'moderation', 'fraud'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'reports' && (
        <View style={styles.list}>
          {reports.length === 0 && (
            <Text style={styles.empty}>No pending reports</Text>
          )}
          {reports.map(report => (
            <View key={report.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardType}>{report.entity_type}</Text>
                <Text style={styles.cardStatus}>{report.status}</Text>
              </View>
              <Text style={styles.cardReason}>{report.reason}</Text>
              {report.description && (
                <Text style={styles.cardDesc}>{report.description}</Text>
              )}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.resolveBtn]}
                  onPress={() => handleResolveReport(report.id, 'Content reviewed, no violation found')}
                >
                  <Text style={styles.actionBtnText}>Resolve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.removeBtn]}
                  onPress={() => handleResolveReport(report.id, 'Content removed for violation')}
                >
                  <Text style={styles.actionBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'moderation' && (
        <View style={styles.list}>
          {moderation.length === 0 && (
            <Text style={styles.empty}>No items in moderation queue</Text>
          )}
          {moderation.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardType}>{item.entity_type}</Text>
                <Text style={styles.cardStatus}>{item.status}</Text>
              </View>
              <Text style={styles.cardReason}>{item.report_reason}</Text>
              {item.ai_score && (
                <Text style={styles.aiScore}>AI Score: {item.ai_score.toFixed(2)}</Text>
              )}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleModerate(item.id, 'restored')}
                >
                  <Text style={styles.actionBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.flagBtn]}
                  onPress={() => handleModerate(item.id, 'flagged')}
                >
                  <Text style={styles.actionBtnText}>Flag</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.removeBtn]}
                  onPress={() => handleModerate(item.id, 'removed')}
                >
                  <Text style={styles.actionBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'fraud' && (
        <View style={styles.list}>
          <Text style={styles.empty}>Fraud detection logs will appear here</Text>
          <Text style={styles.hint}>Connect to fraudEngine.ts for automated fraud detection</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statBox: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#ff6b00' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  tabs: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  tabActive: { backgroundColor: '#ff6b00' },
  tabText: { fontSize: 14, color: '#666' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
  hint: { textAlign: 'center', color: '#bbb', marginTop: 8, fontSize: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardType: { fontSize: 12, color: '#ff6b00', fontWeight: '600', textTransform: 'uppercase' },
  cardStatus: { fontSize: 12, color: '#666', backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  cardReason: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#666', marginBottom: 12 },
  aiScore: { fontSize: 12, color: '#ff6b00', marginBottom: 12 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flex: 1, alignItems: 'center' },
  resolveBtn: { backgroundColor: '#4CAF50' },
  approveBtn: { backgroundColor: '#4CAF50' },
  flagBtn: { backgroundColor: '#FF9800' },
  removeBtn: { backgroundColor: '#F44336' },
  actionBtnText: { color: '#fff', fontWeight: '600' },
});
