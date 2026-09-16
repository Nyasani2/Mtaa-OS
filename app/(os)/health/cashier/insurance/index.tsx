// @ts-nocheck
import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCashierInsurance } from '@/lib/health/hooks/useCashier';
import { ShieldAlert, Search, X, FileText, CheckCircle, XCircle, Info } from 'lucide-react-native';

export default function CashierInsuranceScreen() {
  const router = useRouter();
  const { claims, loading, approveClaim, rejectClaim, searchClaims } = useCashierInsurance();
  const [searchQuery, setSearchQuery] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async (claim: any) => {
    Alert.alert('Approve Claim', `Approve claim for ${claim.patient_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: async () => {
        await approveClaim(claim.id);
      }}
    ]);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Rejection reason is required');
      return;
    }
    await rejectClaim(selectedClaim.id, rejectReason);
    setShowRejectModal(false);
    setSelectedClaim(null);
    setRejectReason('');
  };

  const filteredClaims = claims?.filter((c: any) => 
    c.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.claim_type?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Insurance Claims</Text>
      </View>
      
      <View style={styles.searchBar}>
        <Search size={18} color="#9CA3AF" />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search claims..." 
          value={searchQuery} 
          onChangeText={setSearchQuery} 
          placeholderTextColor="#9CA3AF" 
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll}>
        {filteredClaims.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No claims found</Text>
          </View>
        ) : (
          filteredClaims.map((claim: any) => (
            <View key={claim.id} style={styles.claimCard}>
              <View style={styles.claimHeader}>
                <View style={styles.claimInfo}>
                  <Text style={styles.patientName}>{claim.patient_name}</Text>
                  <Text style={styles.claimType}>{claim.claim_type}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(claim.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(claim.status) }]}>{claim.status}</Text>
                </View>
              </View>
              
              <View style={styles.claimDetails}>
                <Text style={styles.detailLabel}>Amount: <Text style={styles.detailValue}>KES {claim.amount?.toLocaleString()}</Text></Text>
                <Text style={styles.detailLabel}>Date: <Text style={styles.detailValue}>{new Date(claim.created_at).toLocaleDateString()}</Text></Text>
              </View>

              {claim.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ECFDF5' }]} onPress={() => handleApprove(claim)}>
                    <CheckCircle size={16} color="#10B981" />
                    <Text style={[styles.actionText, { color: '#10B981' }]}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]} onPress={() => { setSelectedClaim(claim); setShowRejectModal(true); }}>
                    <XCircle size={16} color="#EF4444" />
                    <Text style={[styles.actionText, { color: '#EF4444' }]}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={showRejectModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Claim</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <X size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Rejection Reason *</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="Explain why this claim is being rejected..." 
              value={rejectReason} 
              onChangeText={setRejectReason} 
              multiline 
              numberOfLines={4} 
            />
            <TouchableOpacity style={styles.modalSubmit} onPress={handleReject}>
              <Text style={styles.modalSubmitText}>Confirm Rejection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1F2937' },
  scroll: { flex: 1, paddingHorizontal: 12 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: '#9CA3AF', fontSize: 14 },
  claimCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  claimHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  claimInfo: { flex: 1 },
  patientName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  claimType: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  claimDetails: { marginBottom: 10 },
  detailLabel: { fontSize: 12, color: '#6B7280' },
  detailValue: { fontWeight: '600', color: '#1F2937' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, gap: 4 },
  actionText: { fontSize: 12, fontWeight: '600' },
  bottomPadding: { height: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1F2937' },
  textArea: { height: 100, textAlignVertical: 'top' },
  modalSubmit: { backgroundColor: '#EF4444', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  modalSubmitText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});
