import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Shield, CreditCard, FileCheck, AlertCircle, ChevronRight,
  TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle,
  DollarSign, Calendar, Building2, User
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Colors } from '@/constants/Colors';

interface InsurancePolicy {
  id: string;
  provider_name: string;
  policy_number: string;
  policy_type: string;
  coverage_type: string;
  premium_amount: number;
  coverage_limit: number;
  deductible: number;
  co_pay_percent: number;
  effective_date: string;
  expiry_date: string;
  is_active: boolean;
}

interface Claim {
  id: string;
  claim_type: string;
  claim_amount: number;
  approved_amount: number;
  status: string;
  submitted_at: string;
  facility: string;
}

export default function InsuranceDashboardScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'coverage' | 'claims' | 'preauth'>('coverage');

  const policies: InsurancePolicy[] = [
    {
      id: '1', provider_name: 'NHIF Kenya', policy_number: 'NHIF-12345678',
      policy_type: 'individual', coverage_type: 'comprehensive',
      premium_amount: 1700, coverage_limit: 1000000,
      deductible: 0, co_pay_percent: 0,
      effective_date: '2025-01-01', expiry_date: '2025-12-31',
      is_active: true
    },
    {
      id: '2', provider_name: 'Jubilee Insurance', policy_number: 'JUB-87654321',
      policy_type: 'family', coverage_type: 'inpatient',
      premium_amount: 8500, coverage_limit: 5000000,
      deductible: 50000, co_pay_percent: 10,
      effective_date: '2025-03-01', expiry_date: '2026-02-28',
      is_active: true
    }
  ];

  const claims: Claim[] = [
    {
      id: '1', claim_type: 'consultation', claim_amount: 3500,
      approved_amount: 3500, status: 'settled',
      submitted_at: '2025-05-15T10:00:00Z', facility: 'Nairobi West Hospital'
    },
    {
      id: '2', claim_type: 'lab', claim_amount: 12000,
      approved_amount: 10000, status: 'approved',
      submitted_at: '2025-06-01T08:00:00Z', facility: 'Lancet Laboratories'
    },
    {
      id: '3', claim_type: 'medication', claim_amount: 8500,
      approved_amount: 0, status: 'under_review',
      submitted_at: '2025-06-08T14:00:00Z', facility: 'Haltons Pharmacy'
    }
  ];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'settled': return { color: '#4CAF50', bg: '#E8F5E9', icon: CheckCircle2 };
      case 'approved': return { color: '#2196F3', bg: '#E3F2FD', icon: CheckCircle2 };
      case 'under_review': return { color: '#FF9800', bg: '#FFF3E0', icon: Clock };
      case 'rejected': return { color: '#F44336', bg: '#FFEBEE', icon: XCircle };
      case 'submitted': return { color: '#9E9E9E', bg: '#F5F5F5', icon: Clock };
      default: return { color: '#999', bg: '#f5f5f5', icon: AlertCircle };
    }
  };

  const totalCoverage = policies.reduce((sum, p) => sum + p.coverage_limit, 0);
  const totalUsed = claims.filter(c => c.status === 'settled').reduce((sum, c) => sum + c.approved_amount, 0);
  const remaining = totalCoverage - totalUsed;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Insurance</Text>
          <Text style={styles.subtitle}>{policies.length} active policies</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => Alert.alert('Add Policy', 'Scan or enter policy details')}
        >
          <Shield size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Coverage Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Shield size={20} color={Colors.primary} />
          <Text style={styles.summaryTitle}>Coverage Overview</Text>
        </View>
        <View style={styles.coverageBar}>
          <View style={[styles.coverageFill, { width: `${(totalUsed / totalCoverage) * 100}%` }]} />
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

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['coverage', 'claims', 'preauth'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'preauth' ? 'Pre-Auth' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'coverage' && (
          <>
            {policies.map(policy => (
              <TouchableOpacity
                key={policy.id}
                style={styles.policyCard}
                onPress={() => router.push({
                  pathname: '/(os)/health/insurance/policy-detail',
                  params: { id: policy.id }
                } as any)}
              >
                <View style={styles.policyHeader}>
                  <View style={styles.policyIcon}>
                    <Shield size={22} color={Colors.primary} />
                  </View>
                  <View style={styles.policyInfo}>
                    <Text style={styles.policyName}>{policy.provider_name}</Text>
                    <Text style={styles.policyNumber}>{policy.policy_number}</Text>
                  </View>
                  <View style={[styles.activeBadge, { backgroundColor: policy.is_active ? '#E8F5E9' : '#FFEBEE' }]}>
                    <Text style={[styles.activeText, { color: policy.is_active ? '#4CAF50' : '#F44336' }]}>
                      {policy.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.policyDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue}>{policy.policy_type} · {policy.coverage_type}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Limit:</Text>
                    <Text style={styles.detailValue}>KES {policy.coverage_limit.toLocaleString()}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Premium:</Text>
                    <Text style={styles.detailValue}>KES {policy.premium_amount.toLocaleString()}/mo</Text>
                  </View>
                  {policy.deductible > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Deductible:</Text>
                      <Text style={styles.detailValue}>KES {policy.deductible.toLocaleString()}</Text>
                    </View>
                  )}
                  {policy.co_pay_percent > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Co-pay:</Text>
                      <Text style={styles.detailValue}>{policy.co_pay_percent}%</Text>
                    </View>
                  )}
                </View>

                <View style={styles.policyFooter}>
                  <View style={styles.footerItem}>
                    <Calendar size={12} color="#888" />
                    <Text style={styles.footerText}>
                      Valid: {new Date(policy.effective_date).toLocaleDateString()} - {new Date(policy.expiry_date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'claims' && (
          <>
            {claims.length === 0 ? (
              <View style={styles.emptyState}>
                <FileCheck size={40} color="#ccc" />
                <Text style={styles.emptyText}>No claims submitted yet</Text>
              </View>
            ) : (
              claims.map(claim => {
                const status = getStatusConfig(claim.status);
                const StatusIcon = status.icon;

                return (
                  <TouchableOpacity
                    key={claim.id}
                    style={styles.claimCard}
                    onPress={() => router.push({
                      pathname: '/(os)/health/insurance/claim-detail',
                      params: { id: claim.id }
                    } as any)}
                  >
                    <View style={styles.claimHeader}>
                      <View style={styles.claimInfo}>
                        <Text style={styles.claimType}>{claim.claim_type.replace('_', ' ')}</Text>
                        <Text style={styles.claimFacility}>{claim.facility}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <StatusIcon size={12} color={status.color} />
                        <Text style={[styles.statusText, { color: status.color }]}>
                          {claim.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.claimAmounts}>
                      <View style={styles.amountItem}>
                        <Text style={styles.amountLabel}>Claimed</Text>
                        <Text style={styles.amountValue}>KES {claim.claim_amount.toLocaleString()}</Text>
                      </View>
                      <View style={styles.amountDivider} />
                      <View style={styles.amountItem}>
                        <Text style={styles.amountLabel}>Approved</Text>
                        <Text style={[styles.amountValue, { color: claim.approved_amount > 0 ? '#4CAF50' : '#999' }]}>
                          KES {claim.approved_amount.toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.amountDivider} />
                      <View style={styles.amountItem}>
                        <Text style={styles.amountLabel}>Pending</Text>
                        <Text style={styles.amountValue}>
                          KES {(claim.claim_amount - claim.approved_amount).toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.claimFooter}>
                      <Calendar size={12} color="#888" />
                      <Text style={styles.footerText}>
                        Submitted {new Date(claim.submitted_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        {activeTab === 'preauth' && (
          <View style={styles.emptyState}>
            <FileCheck size={40} color="#ccc" />
            <Text style={styles.emptyText}>No pre-authorizations pending</Text>
            <TouchableOpacity
              style={styles.requestButton}
              onPress={() => Alert.alert('Request Pre-Auth', 'Select procedure and facility')}
            >
              <Text style={styles.requestButtonText}>Request Pre-Authorization</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  addButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center'
  },
  summaryCard: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16,
    padding: 16, marginBottom: 12
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  summaryTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8, color: '#1a1a1a' },
  coverageBar: {
    height: 8, backgroundColor: '#E8E8E8', borderRadius: 4, marginBottom: 12
  },
  coverageFill: {
    height: '100%', backgroundColor: Colors.primary, borderRadius: 4
  },
  coverageStats: { flexDirection: 'row', justifyContent: 'space-between' },
  coverageItem: { alignItems: 'center', flex: 1 },
  coverageValue: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  coverageLabel: { fontSize: 10, color: '#888', marginTop: 2 },
  tabBar: {
    flexDirection: 'row', paddingHorizontal: 16,
    marginBottom: 12, gap: 8
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#E8E8E8', alignItems: 'center'
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  policyCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 14
  },
  policyHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10
  },
  policyIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
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
  claimCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 14
  },
  claimHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 10
  },
  claimInfo: { flex: 1 },
  claimType: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', textTransform: 'capitalize' },
  claimFacility: { fontSize: 12, color: '#888', marginTop: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6
  },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  claimAmounts: {
    flexDirection: 'row', backgroundColor: '#f8f9fa',
    borderRadius: 10, padding: 12, marginBottom: 10
  },
  amountItem: { flex: 1, alignItems: 'center' },
  amountDivider: { width: 1, backgroundColor: '#e0e0e0' },
  amountLabel: { fontSize: 10, color: '#888', marginBottom: 2 },
  amountValue: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  claimFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 12, marginBottom: 16 },
  requestButton: {
    backgroundColor: Colors.primary, paddingHorizontal: 20,
    paddingVertical: 10, borderRadius: 8
  },
  requestButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  bottomPadding: { height: 32 }
});
