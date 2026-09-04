// @ts-nocheck
import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Alert, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Alert, useCashierInsurance } from '@/lib/health/hooks/useCashier';
import { Feather } from '@expo/vector-icons';

export default function CashierInsuranceScreen() {
  const router = useRouter();
  const { claims, loading, approveClaim, rejectClaim, refresh } = useCashierInsurance();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = claims.filter((c: any) => {
    if (filter === 'pending') return c.status === 'pending';
    if (filter === 'approved') return c.status === 'approved';
    if (filter === 'rejected') return c.status === 'rejected';
    return true;
  });

  const handleApprove = async () => {
    if (!selectedClaim) return;
    await approveClaim(selectedClaim.id);
    setActionModalVisible(false);
    setSelectedClaim(null);
    refresh();
  };

  const handleReject = async () => {
    if (!selectedClaim) return;
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }
    await rejectClaim(selectedClaim.id, rejectReason);
    setActionModalVisible(false);
    setSelectedClaim(null);
    setRejectReason('');
    refresh();
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return { bg: '#d1fae5', text: '#059669' };
      case 'rejected': return { bg: '#fee2e2', text: '#dc2626' };
      case 'pending': return { bg: '#fef3c7', text: '#d97706' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const renderClaim = ({ item }: { item: any }) => {
    const colors = statusColor(item.status);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => { setSelectedClaim(item); setActionModalVisible(true); }}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{item.claim_type.toUpperCase()} Claim</Text>
            <Text style={styles.cardPatient}>{item.patient?.full_name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Feather name="dollar-sign" size={14} color="#6b7280" />
            <Text style={styles.cardValue}>${item.amount?.toLocaleString()}</Text>
          </View>
          <View style={styles.cardRow}>
            <Feather name="shield" size={14} color="#6b7280" />
            <Text style={styles.cardValue}>{item.policy?.provider}</Text>
          </View>
          <View style={styles.cardRow}>
            <Feather name="file-text" size={14} color="#6b7280" />
            <Text style={styles.cardValue} numberOfLines={1}>{item.description}</Text>
          </View>
          <View style={styles.cardRow}>
            <Feather name="calendar" size={14} color="#6b7280" />
            <Text style={styles.cardValue}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
        {item.status === 'pending' && (
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.approveBtn} onPress={() => { setSelectedClaim(item); setActionModalVisible(true); }}>
              <Feather name="check" size={14} color="#fff" />
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => { setSelectedClaim(item); setActionModalVisible(true); }}>
              <Feather name="x" size={14} color="#dc2626" />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Insurance Claims</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterRow}>
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <Text style={styles.loading}>Loading claims...</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderClaim}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>No {filter} claims found.</Text>}
        />
      )}

      {/* Action Modal */}
      <Modal visible={actionModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Claim Action</Text>
            <Text style={styles.modalSub}>
              {selectedClaim?.claim_type.toUpperCase()} — ${selectedClaim?.amount?.toLocaleString()}
            </Text>
            <Text style={styles.modalPatient}>{selectedClaim?.patient?.full_name}</Text>

            {selectedClaim?.status === 'pending' && (
              <>
                <Text style={styles.label}>Rejection Reason (required for reject)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  placeholder="Enter reason if rejecting..."
                  multiline
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.rejectActionBtn} onPress={handleReject}>
                    <Text style={styles.rejectActionBtnText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.approveActionBtn} onPress={handleApprove}>
                    <Text style={styles.approveActionBtnText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {selectedClaim?.status !== 'pending' && (
              <TouchableOpacity style={styles.closeBtn} onPress={() => setActionModalVisible(false)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb'
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6' },
  filterChipActive: { backgroundColor: '#2563eb' },
  filterChipText: { fontSize: 13, color: '#6b7280' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  loading: { textAlign: 'center', marginTop: 40, color: '#6b7280' },
  empty: { textAlign: 'center', marginTop: 40, color: '#9ca3af' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardPatient: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  cardBody: { gap: 6 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardValue: { fontSize: 13, color: '#4b5563', flex: 1 },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  approveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#059669', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  approveBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fee2e2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  rejectBtnText: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalSub: { fontSize: 16, color: '#2563eb', fontWeight: '600', marginTop: 4 },
  modalPatient: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#f9fafb' },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  rejectActionBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  rejectActionBtnText: { color: '#dc2626', fontWeight: '600' },
  approveActionBtn: { backgroundColor: '#059669', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  approveActionBtnText: { color: '#fff', fontWeight: '600' },
  closeBtn: { backgroundColor: '#f3f4f6', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  closeBtnText: { fontWeight: '600', color: '#374151' },
});
