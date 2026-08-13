// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  Alert, ActivityIndicator, Modal, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { BlurView } from 'expo-blur';

interface ComplianceCheck {
  id: string;
  check_type: string;
  status: 'passed' | 'pending' | 'failed' | 'warning';
  description: string;
  completed_at: string | null;
  expires_at: string | null;
  document_url: string | null;
}

interface RegulatoryReport {
  id: string;
  report_type: string;
  period: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  performed_by: string;
  performed_at: string;
  details: Record<string, any>;
}

const COMPLIANCE_CHECKS = [
  { key: 'kyc_verified', label: 'KYC Verification', icon: 'id-card', desc: 'Government ID verified' },
  { key: 'phone_verified', label: 'Phone Verified', icon: 'phone', desc: 'Mobile number confirmed' },
  { key: 'email_verified', label: 'Email Verified', icon: 'email', desc: 'Email address confirmed' },
  { key: 'pin_set', label: 'PIN Set', icon: 'lock', desc: 'Wallet PIN configured' },
  { key: 'biometric_enabled', label: 'Biometric Auth', icon: 'fingerprint', desc: 'Face/Touch ID enabled' },
  { key: 'tax_id_linked', label: 'Tax ID Linked', icon: 'file-invoice', desc: 'KRA PIN connected' },
  { key: 'address_verified', label: 'Address Verified', icon: 'home', desc: 'Physical address confirmed' },
  { key: 'source_of_funds', label: 'Source of Funds', icon: 'money-bill-wave', desc: 'Income source declared' },
];

export default function RegulatoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [compliance, setCompliance] = useState<ComplianceCheck[]>([]);
  const [reports, setReports] = useState<RegulatoryReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'compliance' | 'reports' | 'audit'>('compliance');
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportPeriod, setReportPeriod] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchCompliance = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('compliance_checks').select('*').eq('user_id', user.id);
    if (!error && data) setCompliance(data);
  }, [user]);

  const fetchReports = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('regulatory_reports').select('*').eq('user_id', user.id).order('submitted_at', { ascending: false });
    if (!error && data) setReports(data);
  }, [user]);

  const fetchAudit = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('audit_logs').select('*').eq('performed_by', user.id).order('performed_at', { ascending: false }).limit(50);
    if (!error && data) setAuditLogs(data);
  }, [user]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCompliance(), fetchReports(), fetchAudit()]);
    setLoading(false);
  }, [fetchCompliance, fetchReports, fetchAudit]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadAll(); setRefreshing(false);
  }, [loadAll]);

  const handleSubmitReport = async () => {
    if (!user || !reportType.trim() || !reportPeriod.trim()) { Alert.alert('Error', 'Fill all fields'); return; }
    setProcessing(true);
    const { error } = await supabase.from('regulatory_reports').insert({
      user_id: user.id, report_type: reportType.trim(), period: reportPeriod.trim(), status: 'draft'
    });
    setProcessing(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Success', 'Report draft created');
    setReportModalVisible(false); setReportType(''); setReportPeriod('');
    fetchReports();
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = { passed: '#34C759', pending: '#FF9500', failed: '#FF3B30', warning: '#FF9500', draft: '#8E8E93', submitted: '#007AFF', approved: '#34C759', rejected: '#FF3B30' };
    return map[status] || '#8E8E93';
  };

  const getStatusIcon = (status: string) => {
    const map: Record<string, string> = { passed: 'checkmark-circle', pending: 'time', failed: 'close-circle', warning: 'warning', draft: 'document', submitted: 'send', approved: 'shield-checkmark', rejected: 'close-circle' };
    return map[status] || 'help-circle';
  };

  const passedCount = compliance.filter((c: any) => c.status === 'passed').length;
  const totalCount = COMPLIANCE_CHECKS.length;

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading regulatory...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Regulatory</Text>
        <TouchableOpacity style={styles.reportBtn} onPress={() => setReportModalVisible(true)}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Compliance Score */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreValue}>{Math.round((passedCount / totalCount) * 100)}%</Text>
          <Text style={styles.scoreLabel}>Compliant</Text>
        </View>
        <View style={styles.scoreDetails}>
          <Text style={styles.scoreTitle}>Compliance Status</Text>
          <Text style={styles.scoreDesc}>{passedCount} of {totalCount} checks passed</Text>
          <View style={styles.scoreBar}>
            <View style={[styles.scoreFill, { width: `${(passedCount / totalCount) * 100}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.tabBar}>
        {(['compliance', 'reports', 'audit'] as const).map((tab: any) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'compliance' && COMPLIANCE_CHECKS.map((check: any) => {
          const status = compliance.find((c: any) => c.check_type === check.key)?.status || 'pending';
          return (
            <View key={check.key} style={styles.checkCard}>
              <View style={[styles.checkIcon, { backgroundColor: getStatusColor(status) + '15' }]}>
                <FontAwesome5 name={check.icon as any} size={18} color={getStatusColor(status)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkLabel}>{check.label}</Text>
                <Text style={styles.checkDesc}>{check.desc}</Text>
              </View>
              <View style={[styles.checkBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
                <Ionicons name={getStatusIcon(status) as any} size={14} color={getStatusColor(status)} />
                <Text style={[styles.checkStatus, { color: getStatusColor(status) }]}>{status.toUpperCase()}</Text>
              </View>
            </View>
          );
        })}

        {activeTab === 'reports' && (
          <>
            {reports.map((r: any) => (
              <View key={r.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <Text style={styles.reportType}>{r.report_type}</Text>
                  <View style={[styles.reportBadge, { backgroundColor: getStatusColor(r.status) + '20' }]}>
                    <Text style={[styles.reportStatus, { color: getStatusColor(r.status) }]}>{r.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.reportPeriod}>Period: {r.period}</Text>
                {r.submitted_at && <Text style={styles.reportDate}>Submitted: {new Date(r.submitted_at).toLocaleDateString()}</Text>}
                {r.reviewer_notes && <Text style={styles.reportNotes}>Notes: {r.reviewer_notes}</Text>}
              </View>
            ))}
            {reports.length === 0 && <Text style={styles.emptyText}>No reports submitted yet</Text>}
          </>
        )}

        {activeTab === 'audit' && (
          <>
            {auditLogs.map((log: any) => (
              <View key={log.id} style={styles.auditCard}>
                <View style={styles.auditDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.auditAction}>{log.action}</Text>
                  <Text style={styles.auditEntity}>{log.entity_type} • {new Date(log.performed_at).toLocaleString()}</Text>
                </View>
              </View>
            ))}
            {auditLogs.length === 0 && <Text style={styles.emptyText}>No audit logs yet</Text>}
          </>
        )}
      </ScrollView>

      <Modal visible={reportModalVisible} transparent animationType="slide">
        <BlurView intensity={60} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Regulatory Report</Text>
            <TextInput style={styles.input} placeholder="Report Type (e.g. Annual, Quarterly)" value={reportType} onChangeText={setReportType} />
            <TextInput style={styles.input} placeholder="Period (e.g. Q1 2026)" value={reportPeriod} onChangeText={setReportPeriod} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setReportModalVisible(false)}><Text style={styles.modalBtnSecondaryText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleSubmitReport} disabled={processing}>
                {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnPrimaryText}>Create Draft</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0F' },
  loadingText: { color: '#8E8E93', marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: '#1C1C1E' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  reportBtn: { padding: 4 },
  scoreCard: { flexDirection: 'row', backgroundColor: '#1C1C1E', margin: 16, borderRadius: 20, padding: 20, alignItems: 'center' },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#34C759', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  scoreValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  scoreLabel: { fontSize: 10, color: '#8E8E93' },
  scoreDetails: { flex: 1 },
  scoreTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  scoreDesc: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  scoreBar: { height: 6, backgroundColor: '#2C2C2E', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  scoreFill: { height: '100%', backgroundColor: '#34C759', borderRadius: 3 },
  tabBar: { flexDirection: 'row', backgroundColor: '#1C1C1E', paddingHorizontal: 16, paddingBottom: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: '#2C2C2E' },
  tabText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  checkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 10 },
  checkIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkLabel: { fontSize: 15, fontWeight: '600', color: '#fff' },
  checkDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  checkBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  checkStatus: { fontSize: 10, fontWeight: '800' },
  reportCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 10 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reportType: { fontSize: 15, fontWeight: '600', color: '#fff' },
  reportBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  reportStatus: { fontSize: 10, fontWeight: '800' },
  reportPeriod: { fontSize: 13, color: '#8E8E93' },
  reportDate: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  reportNotes: { fontSize: 12, color: '#FF9500', marginTop: 6, fontStyle: 'italic' },
  emptyText: { fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingVertical: 40 },
  auditCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 12, padding: 14, marginBottom: 8 },
  auditDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#007AFF', marginRight: 12 },
  auditAction: { fontSize: 14, fontWeight: '600', color: '#fff' },
  auditEntity: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
  input: { backgroundColor: '#2C2C2E', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#2C2C2E', alignItems: 'center' },
  modalBtnSecondaryText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#007AFF', alignItems: 'center' },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
