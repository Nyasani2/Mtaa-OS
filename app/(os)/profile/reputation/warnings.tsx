import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface WarningRecord {
  id: string;
  reason: string;
  severity: string;
  issued_at: string;
  status: string;
  appeal_status: string | null;
  appeal_reason: string | null;
  resolved_at: string | null;
  issued_by: string | null;
}

export default function WarningsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<WarningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appealingId, setAppealingId] = useState<string | null>(null);
  const [appealText, setAppealText] = useState('');

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data } = await supabase
      .from('profile_reports')
      .select('id, reason, severity, issued_at, status, appeal_status, appeal_reason, resolved_at, issued_by')
      .eq('reported_user_id', user.id)
      .eq('status', 'resolved')
      .order('issued_at', { ascending: false });

    setRecords(data || []);
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleAppeal = (recordId: string) => {
    setAppealingId(recordId);
    setAppealText('');
  };

  const submitAppeal = async () => {
    if (!appealText.trim() || !appealingId) return;

    const { error } = await supabase
      .from('profile_reports')
      .update({ appeal_status: 'pending', appeal_reason: appealText.trim() })
      .eq('id', appealingId);

    if (error) {
      Alert.alert('Error', 'Failed to submit appeal. Please try again.');
      return;
    }

    Alert.alert('Appeal Submitted', 'Your appeal is under review.');
    setAppealingId(null);
    setAppealText('');
    loadData();
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return '#ff0000';
    if (severity === 'high') return '#ff4444';
    if (severity === 'medium') return '#ffaa00';
    return '#ffdd00';
  };

  const getAppealStatusColor = (status: string | null) => {
    if (!status) return '#888';
    if (status === 'approved') return '#00ff88';
    if (status === 'pending') return '#ffaa00';
    if (status === 'rejected') return '#ff4444';
    return '#888';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Warnings & Appeals</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />}
      >
        {records.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#333" />
            <Text style={styles.emptyTitle}>No Warnings</Text>
            <Text style={styles.emptySub}>Your record is clean. Keep it that way.</Text>
          </View>
        ) : (
          records.map((record: any) => (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={[styles.severityDot, { backgroundColor: getSeverityColor(record.severity) }]} />
                <View style={styles.recordInfo}>
                  <Text style={styles.recordReason}>{record.reason}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(record.severity) + '22' }]}>
                      <Text style={[styles.severityText, { color: getSeverityColor(record.severity) }]}>
                        {record.severity.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.recordDate}>{formatDate(record.issued_at)}</Text>
                  </View>
                </View>
              </View>

              {record.appeal_status && (
                <View style={styles.appealRow}>
                  <Ionicons name="git-pull-request-outline" size={14} color={getAppealStatusColor(record.appeal_status)} />
                  <Text style={[styles.appealStatus, { color: getAppealStatusColor(record.appeal_status) }]}>
                    Appeal: {record.appeal_status.toUpperCase()}
                  </Text>
                </View>
              )}

              {record.appeal_reason && (
                <Text style={styles.appealReason}>Your appeal: {record.appeal_reason}</Text>
              )}

              {!record.appeal_status && (
                <TouchableOpacity style={styles.appealBtn} onPress={() => handleAppeal(record.id)}>
                  <Ionicons name="create-outline" size={14} color="#00d4ff" />
                  <Text style={styles.appealBtnText}>File Appeal</Text>
                </TouchableOpacity>
              )}

              {appealingId === record.id && (
                <View style={styles.appealForm}>
                  <TextInput
                    style={styles.appealInput}
                    placeholder="Explain why this warning should be reviewed..."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={3}
                    value={appealText}
                    onChangeText={setAppealText}
                  />
                  <View style={styles.appealActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setAppealingId(null)}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.submitBtn} onPress={submitAppeal}>
                      <Text style={styles.submitBtnText}>Submit Appeal</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySub: { color: '#666', fontSize: 14, textAlign: 'center', marginTop: 8 },
  recordCard: { backgroundColor: '#111', marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#1a1a1a' },
  recordHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  severityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: 10 },
  recordInfo: { flex: 1 },
  recordReason: { color: '#fff', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  severityText: { fontSize: 10, fontWeight: '700' },
  recordDate: { color: '#666', fontSize: 12 },
  appealRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  appealStatus: { fontSize: 12, fontWeight: '700', marginLeft: 6 },
  appealReason: { color: '#888', fontSize: 13, marginTop: 6, fontStyle: 'italic' },
  appealBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 10, alignSelf: 'flex-start' },
  appealBtnText: { color: '#00d4ff', fontSize: 13, fontWeight: '600', marginLeft: 4 },
  appealForm: { marginTop: 12, backgroundColor: '#0a0a0a', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  appealInput: { color: '#fff', fontSize: 14, backgroundColor: '#1a1a1a', borderRadius: 8, padding: 10, minHeight: 80, textAlignVertical: 'top' },
  appealActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  cancelBtnText: { color: '#888', fontSize: 13 },
  submitBtn: { backgroundColor: '#00d4ff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  submitBtnText: { color: '#000', fontSize: 13, fontWeight: '700' },
});
