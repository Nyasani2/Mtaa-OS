// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface VerificationRecord {
  id: string;
  verification_type: string;
  status: string;
  verified_at: string;
  method: string;
  document_url: string | null;
  notes: string | null;
}

export default function VerifiedHistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data } = await supabase
      .from('profile_verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('verified_at', { ascending: false });

    setRecords(data || []);
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const getStatusColor = (status: string) => {
    if (status === 'verified') return '#00ff88';
    if (status === 'pending') return '#ffaa00';
    if (status === 'rejected') return '#ff4444';
    return '#888';
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('identity')) return 'card-outline';
    if (type.includes('phone')) return 'call-outline';
    if (type.includes('email')) return 'mail-outline';
    if (type.includes('business')) return 'business-outline';
    if (type.includes('address')) return 'location-outline';
    return 'shield-checkmark-outline';
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
        <Text style={styles.headerTitle}>Verified History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />}
      >
        {records.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="shield-outline" size={48} color="#333" />
            <Text style={styles.emptyTitle}>No Verifications Yet</Text>
            <Text style={styles.emptySub}>Complete identity verification to build trust.</Text>
            <TouchableOpacity style={styles.verifyBtn} onPress={() => router.push('/(os)/settings/verification' as any)}>
              <Text style={styles.verifyBtnText}>Start Verification</Text>
            </TouchableOpacity>
          </View>
        ) : (
          records.map((record: any) => (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={[styles.iconCircle, { backgroundColor: getStatusColor(record.status) + '22' }]}>
                  <Ionicons name={getTypeIcon(record.verification_type) as any} size={20} color={getStatusColor(record.status)} />
                </View>
                <View style={styles.recordInfo}>
                  <Text style={styles.recordType}>{record.verification_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                  <Text style={[styles.recordStatus, { color: getStatusColor(record.status) }]}>
                    {record.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.recordDate}>{formatDate(record.verified_at)}</Text>
              </View>
              {record.notes && (
                <Text style={styles.recordNotes}>{record.notes}</Text>
              )}
              {record.method && (
                <View style={styles.methodRow}>
                  <Ionicons name="information-circle-outline" size={14} color="#666" />
                  <Text style={styles.methodText}>Method: {record.method}</Text>
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
  verifyBtn: { marginTop: 24, backgroundColor: '#00d4ff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  verifyBtnText: { color: '#000', fontSize: 14, fontWeight: '700' },
  recordCard: { backgroundColor: '#111', marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#1a1a1a' },
  recordHeader: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  recordInfo: { flex: 1, marginLeft: 12 },
  recordType: { color: '#fff', fontSize: 14, fontWeight: '600' },
  recordStatus: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  recordDate: { color: '#666', fontSize: 12 },
  recordNotes: { color: '#888', fontSize: 13, marginTop: 10, lineHeight: 18 },
  methodRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  methodText: { color: '#666', fontSize: 12, marginLeft: 6 },
});
