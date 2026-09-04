import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

interface SafetyAlert {
  id: string;
  type: string;
  status: string;
  created_at: string;
  description?: string;
  reporter_name: string;
}

interface VerificationRequest {
  id: string;
  teacher_name: string;
  verification_status: string;
  submitted_at: string;
  document_count: number;
}

export default function SafetyAdminScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'alerts' | 'verifications'>('alerts');

  const fetchData = useCallback(async () => {
    try {
      // Verify admin access
      const { data: teacherData } = await supabase
        .from('education_teachers')
        .select('id, institution_id, role')
        .eq('user_id', user?.id)
        .single();

      const adminRoles = ['admin', 'principal', 'headteacher'];
      if (!adminRoles.includes(teacherData?.role)) {
        setIsAdmin(false);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setIsAdmin(true);

      const institutionId = teacherData?.institution_id;

      // Fetch transport alerts
      const { data: alertData } = await supabase
        .from('education_transport_alerts')
        .select(`
          id, type, status, created_at, description,
          parent:parent_id(full_name)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(20);

      setAlerts((alertData || []).map((a: any) => ({
        id: a.id,
        type: a.type,
        status: a.status,
        created_at: a.created_at,
        description: a.description,
        reporter_name: a.parent?.full_name || 'Unknown',
      })));

      // Fetch pending verifications
      const { data: verifyData } = await supabase
        .from('education_teachers')
        .select('id, full_name, verification_status, verification_submitted_at')
        .eq('institution_id', institutionId)
        .eq('verification_status', 'pending');

      // Get document counts
      const teacherIds = (verifyData || []).map((t: any) => t.id);
      const { data: docData } = await supabase
        .from('education_teacher_documents')
        .select('teacher_id')
        .in('teacher_id', teacherIds);

      const docCountMap = new Map();
      (docData || []).forEach((d: any) => {
        docCountMap.set(d.teacher_id, (docCountMap.get(d.teacher_id) || 0) + 1);
      });

      setVerifications((verifyData || []).map((t: any) => ({
        id: t.id,
        teacher_name: t.full_name,
        verification_status: t.verification_status,
        submitted_at: t.verification_submitted_at,
        document_count: docCountMap.get(t.id) || 0,
      })));
    } catch (e) {
      console.error('[SafetyAdmin]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('education_transport_alerts')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;
      fetchData();
      Alert.alert('Resolved', 'Alert has been marked as resolved');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to resolve alert');
    }
  };

  const handleVerifyTeacher = async (teacherId: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from('education_teachers')
        .update({
          verification_status: approve ? 'verified' : 'rejected',
          verification_reviewed_at: new Date().toISOString(),
        })
        .eq('id', teacherId);

      if (error) throw error;
      fetchData();
      Alert.alert(approve ? 'Approved' : 'Rejected', `Teacher has been ${approve ? 'verified' : 'rejected'}.`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update verification');
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Ionicons name="lock-closed" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>Admin Access Required</Text>
        <Text style={[styles.errorSub, { color: colors.textSecondary }]}>You do not have permission to access this screen.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Safety & Admin</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Manage alerts & verifications</Text>
      </View>

      {/* Tab Switcher */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'alerts' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('alerts')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'alerts' ? colors.primary : colors.textSecondary }]}>
            Alerts ({alerts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'verifications' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('verifications')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'verifications' ? colors.primary : colors.textSecondary }]}>
            Verifications ({verifications.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ padding: 16 }}>
        {activeTab === 'alerts' ? (
          alerts.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="shield-checkmark" size={48} color="#059669" />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No open alerts</Text>
            </View>
          ) : (
            alerts.map((a: any) => (
              <View key={a.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.alertIcon, { backgroundColor: a.type === 'emergency' ? '#FEE2E2' : '#FEF3C7' }]}>
                    <Ionicons name={a.type === 'emergency' ? 'warning' : 'alert-circle'} size={18} color={a.type === 'emergency' ? '#DC2626' : '#D97706'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {a.type.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                      {a.reporter_name} · {new Date(a.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
                {a.description && <Text style={[styles.cardContent, { color: colors.textSecondary }]}>{a.description}</Text>}
                <TouchableOpacity style={[styles.resolveBtn, { backgroundColor: '#059669' }]} onPress={() => handleResolveAlert(a.id)}>
                  <Text style={styles.resolveText}>Mark Resolved</Text>
                </TouchableOpacity>
              </View>
            ))
          )
        ) : (
          verifications.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="checkmark-circle" size={48} color="#059669" />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No pending verifications</Text>
            </View>
          ) : (
            verifications.map((v: any) => (
              <View key={v.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.alertIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="person" size={18} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{v.teacher_name}</Text>
                    <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                      {v.document_count} documents · Submitted {new Date(v.submitted_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#059669' }]} onPress={() => handleVerifyTeacher(v.id, true)}>
                    <Text style={styles.actionText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#DC2626' }]} onPress={() => handleVerifyTeacher(v.id, false)}>
                    <Text style={styles.actionText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  errorText: { marginTop: 12, fontSize: 16, fontWeight: '700', color: '#DC2626' },
  errorSub: { marginTop: 4, fontSize: 13, textAlign: 'center' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  alertIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardMeta: { fontSize: 12, marginTop: 2 },
  cardContent: { fontSize: 13, lineHeight: 18, marginTop: 8, marginBottom: 10 },
  resolveBtn: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  resolveText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyText: { marginTop: 12, fontSize: 14 },
});
