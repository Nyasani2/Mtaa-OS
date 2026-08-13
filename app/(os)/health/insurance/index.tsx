// @ts-nocheck
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Shield, FileCheck, AlertCircle, Clock, CheckCircle2, XCircle,
  Calendar, Plus, X
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';

interface InsurancePolicy {
  id: string; provider_name: string; policy_number: string; policy_type: string;
  coverage_type: string; premium_amount: number; coverage_limit: number;
  deductible: number; co_pay_percent: number; effective_date: string;
  expiry_date: string; is_active: boolean;
}

interface Claim {
  id: string; claim_type: string; claim_amount: number;
  approved_amount: number; status: string; submitted_at: string; facility: string;
}

interface PreAuth {
  id: string; procedure: string; facility: string;
  estimated_cost: number; status: string; requested_at: string;
}

export default function InsuranceDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'coverage' | 'claims' | 'preauth'>('coverage');
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [preAuths, setPreAuths] = useState<PreAuth[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    provider_name: '', policy_number: '', policy_type: 'individual',
    coverage_type: 'comprehensive', premium_amount: '', coverage_limit: '',
    deductible: '0', co_pay_percent: '0', effective_date: '', expiry_date: '',
  });
  const [addingPolicy, setAddingPolicy] = useState(false);
  const [preAuthModalVisible, setPreAuthModalVisible] = useState(false);
  const [newPreAuth, setNewPreAuth] = useState({ procedure: '', facility: '', estimated_cost: '' });
  const [requestingPreAuth, setRequestingPreAuth] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [{ data: policyData }, { data: claimData }, { data: preAuthData }] = await Promise.all([
        supabase.from('health_insurance_policies').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('health_insurance_claims').select('*').eq('user_id', user.id).order('submitted_at', { ascending: false }),
        supabase.from('health_insurance_preauths').select('*').eq('user_id', user.id).order('requested_at', { ascending: false }),
      ]);
      setPolicies((policyData || []) as InsurancePolicy[]);
      setClaims((claimData || []) as Claim[]);
      setPreAuths((preAuthData || []) as PreAuth[]);
    } catch (e) { console.error('Failed to load insurance data:', e); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  async function handleAddPolicy() {
    if (!newPolicy.provider_name.trim() || !newPolicy.policy_number.trim()) {
      Alert.alert('Error', 'Provider name and policy number are required'); return;
    }
    if (!user?.id) return;
    setAddingPolicy(true);
    try {
      const { error } = await supabase.from('health_insurance_policies').insert({
        user_id: user.id, provider_name: newPolicy.provider_name.trim(),
        policy_number: newPolicy.policy_number.trim(), policy_type: newPolicy.policy_type,
        coverage_type: newPolicy.coverage_type, premium_amount: Number(newPolicy.premium_amount) || 0,
        coverage_limit: Number(newPolicy.coverage_limit) || 0, deductible: Number(newPolicy.deductible) || 0,
        co_pay_percent: Number(newPolicy.co_pay_percent) || 0,
        effective_date: newPolicy.effective_date || new Date().toISOString().split('T')[0],
        expiry_date: newPolicy.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true,
      });
      if (error) throw error;
      Alert.alert('Success', 'Policy added successfully');
      setAddModalVisible(false);
      setNewPolicy({ provider_name: '', policy_number: '', policy_type: 'individual', coverage_type: 'comprehensive', premium_amount: '', coverage_limit: '', deductible: '0', co_pay_percent: '0', effective_date: '', expiry_date: '' });
      loadData();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setAddingPolicy(false); }
  }

  async function handleRequestPreAuth() {
    if (!newPreAuth.procedure.trim() || !newPreAuth.facility.trim()) {
      Alert.alert('Error', 'Procedure and facility are required'); return;
    }
    if (!user?.id) return;
    setRequestingPreAuth(true);
    try {
      const { error } = await supabase.from('health_insurance_preauths').insert({
        user_id: user.id, procedure: newPreAuth.procedure.trim(),
        facility: newPreAuth.facility.trim(), estimated_cost: Number(newPreAuth.estimated_cost) || 0,
        status: 'pending', requested_at: new Date().toISOString(),
      });
      if (error) throw error;
      Alert.alert('Submitted', 'Pre-authorization request submitted. You will be notified once approved.');
      setPreAuthModalVisible(false);
      setNewPreAuth({ procedure: '', facility: '', estimated_cost: '' });
      loadData();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setRequestingPreAuth(false); }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'settled': return { color: '#4CAF50', bg: '#E8F5E9', icon: CheckCircle2 };
      case 'approved': return { color: '#2196F3', bg: '#E3F2FD', icon: CheckCircle2 };
      case 'under_review': return { color: '#FF9800', bg: '#FFF3E0', icon: Clock };
      case 'rejected': return { color: '#F44336', bg: '#FFEBEE', icon: XCircle };
      case 'submitted': return { color: '#9E9E9E', bg: '#F5F5F5', icon: Clock };
      case 'pending': return { color: '#FF9800', bg: '#FFF3E0', icon: Clock };
      default: return { color: '#999', bg: '#f5f5f5', icon: AlertCircle };
    }
  };

  const totalCoverage = policies.reduce((sum, p) => sum + p.coverage_limit, 0);
  const totalUsed = claims.filter((c: any) => c.status === 'settled').reduce((sum, c) => sum + c.approved_amount, 0);
  const remaining = totalCoverage - totalUsed;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Insurance</Text>
          <Text style={styles.subtitle}>{policies.length} active policies</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Shield size={20} color={Colors.primary} />
          <Text style={styles.summaryTitle}>Coverage Overview</Text>
        </View>
        <View style={styles.coverageBar}>
          <View style={[styles.coverageFill, { width: `${totalCoverage > 0 ? (totalUsed / totalCoverage) * 100 : 0}%` }]} />
        </View>
        <View style={styles.coverageStats}>
          <View style={styles.coverageItem}>
            <Text style={styles.coverageValue}>KES {remaining.toLocaleString()}</Text>
            <Text style={styles.coverageLabel}>Remaining</Text>
          </View>
          <View style={styles.coverageItem}>
            <Text style={styles.coverageValue}>KES {totalUsed.toLocaleString()}</Text>
            <Text style={styles.coverageLabel}>Used</Text>
          </View>
          <View style={styles.coverageItem}>
            <Text style={styles.coverageValue}>KES {totalCoverage.toLocaleString()}</Text>
            <Text style={styles.coverageLabel}>Total</Text>
          </View>
        </View>
      </View>
      <View style={styles.tabBar}>
        {(['coverage', 'claims', 'preauth'] as const).map((tab: any) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'preauth' ? 'Pre-Auth' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
        {activeTab === 'coverage' && (
          <>
            {policies.length === 0 ? (
              <View style={styles.emptyState}>
                <Shield size={40} color="#ccc" />
                <Text style={styles.emptyText}>No policies added yet</Text>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setAddModalVisible(true)}>
                  <Text style={styles.actionBtnText}>Add Your First Policy</Text>
                </TouchableOpacity>
              </View>
            ) : (
              policies.map((policy: any) => (
                <TouchableOpacity key={policy.id} style={styles.policyCard} onPress={() => router.push({ pathname: '/(os)/health/insurance/policy-detail', params: { id: policy.id } } as any)}>
                  <View style={styles.policyHeader}>
                    <View style={styles.policyIcon}><Shield size={22} color={Colors.primary} /></View>
                    <View style={styles.policyInfo}>
                      <Text style={styles.policyName}>{policy.provider_name}</Text>
                      <Text style={styles.policyNumber}>{policy.policy_number}</Text>
                    </View>
                    <View style={[styles.activeBadge, { backgroundColor: policy.is_active ? '#E8F5E9' : '#FFEBEE' }]}>
                      <Text style={[styles.activeText, { color: policy.is_active ? '#4CAF50' : '#F44336' }]}>{policy.is_active ? 'Active' : 'Inactive'}</Text>
                    </View>
                  </View>
                  <View style={styles.policyDetails}>
                    <View style={styles.detailRow}><Text style={styles.detailLabel}>Type:</Text><Text style={styles.detailValue}>{policy.policy_type} · {policy.coverage_type}</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLabel}>Limit:</Text><Text style={styles.detailValue}>KES {policy.coverage_limit.toLocaleString()}</Text></View>
                    <View style={styles.detailRow}><Text style={styles.detailLabel}>Premium:</Text><Text style={styles.detailValue}>KES {policy.premium_amount.toLocaleString()}/mo</Text></View>
                    {policy.deductible > 0 && <View style={styles.detailRow}><Text style={styles.detailLabel}>Deductible:</Text><Text style={styles.detailValue}>KES {policy.deductible.toLocaleString()}</Text></View>}
                    {policy.co_pay_percent > 0 && <View style={styles.detailRow}><Text style={styles.detailLabel}>Co-pay:</Text><Text style={styles.detailValue}>{policy.co_pay_percent}%</Text></View>}
                  </View>
                  <View style={styles.policyFooter}>
                    <View style={styles.footerItem}><Calendar size={12} color="#888" /><Text style={styles.footerText}>Valid: {new Date(policy.effective_date).toLocaleDateString()} - {new Date(policy.expiry_date).toLocaleDateString()}</Text></View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
        {activeTab === 'claims' && (
          <>
            {claims.length === 0 ? (
              <View style={styles.emptyState}><FileCheck size={40} color="#ccc" /><Text style={styles.emptyText}>No claims submitted yet</Text></View>
            ) : (
              claims.map((claim: any) => {
                const status = getStatusConfig(claim.status);
                const StatusIcon = status.icon;
                return (
                  <TouchableOpacity key={claim.id} style={styles.claimCard} onPress={() => router.push({ pathname: '/(os)/health/insurance/claim-detail', params: { id: claim.id } } as any)}>
                    <View style={styles.claimHeader}>
                      <View style={styles.claimInfo}>
                        <Text style={styles.claimType}>{claim.claim_type.replace('_', ' ')}</Text>
                        <Text style={styles.claimFacility}>{claim.facility}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <StatusIcon size={12} color={status.color} />
                        <Text style={[styles.statusText, { color: status.color }]}>{claim.status.replace('_', ' ')}</Text>
                      </View>
                    </View>
                    <View style={styles.claimAmounts}>
                      <View style={styles.amountItem}><Text style={styles.amountLabel}>Claimed</Text><Text style={styles.amountValue}>KES {claim.claim_amount.toLocaleString()}</Text></View>
                      <View style={styles.amountDivider} />
                      <View style={styles.amountItem}><Text style={styles.amountLabel}>Approved</Text><Text style={[styles.amountValue, { color: claim.approved_amount > 0 ? '#4CAF50' : '#999' }]}>KES {claim.approved_amount.toLocaleString()}</Text></View>
                      <View style={styles.amountDivider} />
                      <View style={styles.amountItem}><Text style={styles.amountLabel}>Pending</Text><Text style={styles.amountValue}>KES {(claim.claim_amount - claim.approved_amount).toLocaleString()}</Text></View>
                    </View>
                    <View style={styles.claimFooter}><Calendar size={12} color="#888" /><Text style={styles.footerText}>Submitted {new Date(claim.submitted_at).toLocaleDateString()}</Text></View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}
        {activeTab === 'preauth' && (
          <>
            {preAuths.length === 0 ? (
              <View style={styles.emptyState}>
                <FileCheck size={40} color="#ccc" />
                <Text style={styles.emptyText}>No pre-authorizations pending</Text>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setPreAuthModalVisible(true)}>
                  <Text style={styles.actionBtnText}>Request Pre-Authorization</Text>
                </TouchableOpacity>
              </View>
            ) : (
              preAuths.map((auth: any) => {
                const status = getStatusConfig(auth.status);
                return (
                  <View key={auth.id} style={styles.preAuthCard}>
                    <View style={styles.preAuthHeader}>
                      <Text style={styles.preAuthProcedure}>{auth.procedure}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{auth.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.preAuthFacility}>{auth.facility}</Text>
                    <Text style={styles.preAuthCost}>Est. Cost: KES {auth.estimated_cost.toLocaleString()}</Text>
                    <Text style={styles.preAuthDate}>Requested: {new Date(auth.requested_at).toLocaleDateString()}</Text>
                  </View>
                );
              })
            )}
          </>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Policy Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Insurance Policy</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}><X size={24} color="#666" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Provider Name *</Text>
              <TextInput style={styles.modalInput} value={newPolicy.provider_name} onChangeText={t => setNewPolicy(p => ({ ...p, provider_name: t }))} placeholder="e.g. NHIF Kenya" placeholderTextColor="#999" />
              <Text style={styles.modalLabel}>Policy Number *</Text>
              <TextInput style={styles.modalInput} value={newPolicy.policy_number} onChangeText={t => setNewPolicy(p => ({ ...p, policy_number: t }))} placeholder="e.g. NHIF-12345678" placeholderTextColor="#999" />
              <Text style={styles.modalLabel}>Policy Type</Text>
              <View style={styles.typeRow}>
                {['individual', 'family', 'corporate'].map((t: any) => (
                  <TouchableOpacity key={t} style={[styles.typeChip, newPolicy.policy_type === t && styles.typeChipActive]} onPress={() => setNewPolicy(p => ({ ...p, policy_type: t }))}>
                    <Text style={[styles.typeChipText, newPolicy.policy_type === t && styles.typeChipTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.modalLabel}>Coverage Type</Text>
              <View style={styles.typeRow}>
                {['comprehensive', 'inpatient', 'outpatient'].map((t: any) => (
                  <TouchableOpacity key={t} style={[styles.typeChip, newPolicy.coverage_type === t && styles.typeChipActive]} onPress={() => setNewPolicy(p => ({ ...p, coverage_type: t }))}>
                    <Text style={[styles.typeChipText, newPolicy.coverage_type === t && styles.typeChipTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.modalLabel}>Premium (KES/month)</Text>
              <TextInput style={styles.modalInput} keyboardType="numeric" value={newPolicy.premium_amount} onChangeText={t => setNewPolicy(p => ({ ...p, premium_amount: t }))} placeholder="1700" placeholderTextColor="#999" />
              <Text style={styles.modalLabel}>Coverage Limit (KES)</Text>
              <TextInput style={styles.modalInput} keyboardType="numeric" value={newPolicy.coverage_limit} onChangeText={t => setNewPolicy(p => ({ ...p, coverage_limit: t }))} placeholder="1000000" placeholderTextColor="#999" />
              <Text style={styles.modalLabel}>Deductible (KES)</Text>
              <TextInput style={styles.modalInput} keyboardType="numeric" value={newPolicy.deductible} onChangeText={t => setNewPolicy(p => ({ ...p, deductible: t }))} placeholder="0" placeholderTextColor="#999" />
              <Text style={styles.modalLabel}>Co-pay (%)</Text>
              <TextInput style={styles.modalInput} keyboardType="numeric" value={newPolicy.co_pay_percent} onChangeText={t => setNewPolicy(p => ({ ...p, co_pay_percent: t }))} placeholder="0" placeholderTextColor="#999" />
              <Text style={styles.modalLabel}>Effective Date</Text>
              <TextInput style={styles.modalInput} value={newPolicy.effective_date} onChangeText={t => setNewPolicy(p => ({ ...p, effective_date: t }))} placeholder="YYYY-MM-DD" placeholderTextColor="#999" />
              <Text style={styles.modalLabel}>Expiry Date</Text>
              <TextInput style={styles.modalInput} value={newPolicy.expiry_date} onChangeText={t => setNewPolicy(p => ({ ...p, expiry_date: t }))} placeholder="YYYY-MM-DD" placeholderTextColor="#999" />
              <TouchableOpacity style={[styles.modalBtn, addingPolicy && styles.modalBtnDisabled]} onPress={handleAddPolicy} disabled={addingPolicy}>
                <Text style={styles.modalBtnText}>{addingPolicy ? 'Adding...' : 'Add Policy'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Pre-Auth Modal */}
      <Modal visible={preAuthModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Pre-Authorization</Text>
              <TouchableOpacity onPress={() => setPreAuthModalVisible(false)}><X size={24} color="#666" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Procedure *</Text>
              <TextInput style={styles.modalInput} value={newPreAuth.procedure} onChangeText={t => setNewPreAuth(p => ({ ...p, procedure: t }))} placeholder="e.g. MRI Scan, Surgery" placeholderTextColor="#999" />
              <Text style={styles.modalLabel}>Facility *</Text>
              <TextInput style={styles.modalInput} value={newPreAuth.facility} onChangeText={t => setNewPreAuth(p => ({ ...p, facility: t }))} placeholder="e.g. Nairobi West Hospital" placeholderTextColor="#999" />
              <Text style={styles.modalLabel}>Estimated Cost (KES)</Text>
              <TextInput style={styles.modalInput} keyboardType="numeric" value={newPreAuth.estimated_cost} onChangeText={t => setNewPreAuth(p => ({ ...p, estimated_cost: t }))} placeholder="50000" placeholderTextColor="#999" />
              <TouchableOpacity style={[styles.modalBtn, requestingPreAuth && styles.modalBtnDisabled]} onPress={handleRequestPreAuth} disabled={requestingPreAuth}>
                <Text style={styles.modalBtnText}>{requestingPreAuth ? 'Submitting...' : 'Submit Request'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  summaryCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  summaryTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8, color: '#1a1a1a' },
  coverageBar: { height: 8, backgroundColor: '#E8E8E8', borderRadius: 4, marginBottom: 12 },
  coverageFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  coverageStats: { flexDirection: 'row', justifyContent: 'space-between' },
  coverageItem: { alignItems: 'center', flex: 1 },
  coverageValue: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  coverageLabel: { fontSize: 10, color: '#888', marginTop: 2 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#E8E8E8', alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  policyCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 14 },
  policyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  policyIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  policyInfo: { flex: 1 },
  policyName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  policyNumber: { fontSize: 12, color: '#888', marginTop: 1 },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  activeText: { fontSize: 11, fontWeight: '600' },
  policyDetails: { gap: 6, marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailLabel: { fontSize: 12, color: '#888', width: 80 },
  detailValue: { fontSize: 12, color: '#333', flex: 1 },
  policyFooter: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: '#888' },
  claimCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 14 },
  claimHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  claimInfo: { flex: 1 },
  claimType: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', textTransform: 'capitalize' },
  claimFacility: { fontSize: 12, color: '#888', marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  claimAmounts: { flexDirection: 'row', backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12, marginBottom: 10 },
  amountItem: { flex: 1, alignItems: 'center' },
  amountDivider: { width: 1, backgroundColor: '#e0e0e0' },
  amountLabel: { fontSize: 10, color: '#888', marginBottom: 2 },
  amountValue: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  claimFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 12, marginBottom: 16 },
  actionBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  preAuthCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 14 },
  preAuthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  preAuthProcedure: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  preAuthFacility: { fontSize: 13, color: '#666', marginBottom: 4 },
  preAuthCost: { fontSize: 13, color: '#333', fontWeight: '500' },
  preAuthDate: { fontSize: 11, color: '#888', marginTop: 4 },
  bottomPadding: { height: 32 },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  modalLabel: { fontSize: 13, color: '#666', marginTop: 12, marginBottom: 6 },
  modalInput: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, fontSize: 15, color: '#1a1a1a' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f5f5f5' },
  typeChipActive: { backgroundColor: Colors.primary },
  typeChipText: { fontSize: 12, color: '#666' },
  typeChipTextActive: { color: '#fff', fontWeight: '600' },
  modalBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20, marginBottom: 20 },
  modalBtnDisabled: { backgroundColor: '#ccc' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
