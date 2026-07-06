
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { usePharmacy } from '@/lib/health/hooks/usePharmacy';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Pill, Search, X, FileText, User, CheckCircle, AlertTriangle, Package, Printer } from 'lucide-react-native';

const COLORS = {
  primary: '#0A4DA6', primaryLight: '#E8F0FE', success: '#10B981', warning: '#F59E0B',
  danger: '#EF4444', text: '#1F2937', textLight: '#6B7280', border: '#E5E7EB',
  background: '#F3F4F6', white: '#FFFFFF'
};

export default function PharmacyDispenseScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { selectedFacilityId } = useHealthRole();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [dispenseNotes, setDispenseNotes] = useState('');
  const { prescriptions, inventory, loading, error, refresh, dispensePrescription } = usePharmacy(selectedFacilityId);

  const onRefresh = useCallback(async () => { setRefreshing(true); await refresh(); setRefreshing(false); }, [refresh]);

  const filteredPrescriptions = prescriptions?.filter((p: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.patient_name?.toLowerCase().includes(q) || p.doctor_name?.toLowerCase().includes(q);
  });

  const handleDispense = useCallback(async () => {
    if (!selectedPrescription) return;
    try {
      await dispensePrescription(selectedPrescription.id, { dispensed_by: user?.id, notes: dispenseNotes, facility_id: selectedFacilityId });
      setShowDispenseModal(false);
      setSelectedPrescription(null);
      setDispenseNotes('');
      Alert.alert('Success', 'Prescription dispensed');
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to dispense'); }
  }, [selectedPrescription, user?.id, dispenseNotes, selectedFacilityId, dispensePrescription]);

  const handleInitiateDispense = useCallback((prescription: any) => {
    // Check stock availability
    const missingItems = prescription.items?.filter((item: any) => {
      const stockItem = inventory?.find((i: any) => i.name === item.medication_name || i.generic_name === item.medication_name);
      return !stockItem || stockItem.quantity < item.quantity;
    });
    if (missingItems?.length > 0) {
      Alert.alert('Stock Issue', `Insufficient stock for: ${missingItems.map((i: any) => i.medication_name).join(', ')}`);
      return;
    }
    setSelectedPrescription(prescription);
    setShowDispenseModal(true);
  }, [inventory]);

  const getStatusColor = (status: string) => {
    switch (status) { case 'pending': return COLORS.warning; case 'dispensed': return COLORS.success; case 'partial': return COLORS.primary; case 'cancelled': return COLORS.danger; default: return COLORS.textLight; }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading prescriptions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dispense</Text>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={COLORS.textLight} />
        <TextInput style={styles.searchInput} placeholder="Search prescriptions..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={COLORS.textLight} />
        {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color={COLORS.textLight} /></TouchableOpacity>}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filteredPrescriptions?.length === 0 ? (
          <View style={styles.emptyState}><Pill size={48} color={COLORS.textLight} /><Text style={styles.emptyText}>{searchQuery ? 'No prescriptions match' : 'No pending prescriptions'}</Text></View>
        ) : (
          filteredPrescriptions?.map((p: any) => (
            <View key={p.id} style={styles.prescriptionCard}>
              <View style={styles.prescriptionHeader}>
                <View style={styles.patientInfo}>
                  <View style={[styles.avatar, { backgroundColor: COLORS.primaryLight }]}>
                    <Text style={styles.avatarText}>{p.patient_name?.charAt(0) || '?'}</Text>
                  </View>
                  <View>
                    <Text style={styles.patientName}>{p.patient_name}</Text>
                    <Text style={styles.doctorText}>Dr. {p.doctor_name || 'Unknown'}</Text>
                    <Text style={styles.dateText}>{new Date(p.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(p.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(p.status) }]}>{p.status}</Text>
                </View>
              </View>

              <View style={styles.itemsList}>
                {p.items?.map((item: any, idx: number) => {
                  const stockItem = inventory?.find((i: any) => i.name === item.medication_name || i.generic_name === item.medication_name);
                  const hasStock = stockItem && stockItem.quantity >= item.quantity;
                  return (
                    <View key={idx} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.medication_name}</Text>
                        <Text style={styles.itemDetail}>{item.dosage} - {item.frequency} - {item.duration}</Text>
                      </View>
                      <View style={styles.itemQty}>
                        <Text style={styles.qtyText}>x{item.quantity}</Text>
                        {!hasStock && <AlertTriangle size={14} color={COLORS.danger} />}
                      </View>
                    </View>
                  );
                })}
              </View>

              {p.status === 'pending' && (
                <TouchableOpacity style={styles.dispenseBtn} onPress={() => handleInitiateDispense(p)}>
                  <Package size={18} color={COLORS.white} />
                  <Text style={styles.dispenseText}>Dispense</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={showDispenseModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dispense Prescription</Text>
              <TouchableOpacity onPress={() => setShowDispenseModal(false)}><X size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.patientLabel}>Patient: {selectedPrescription?.patient_name}</Text>
              <Text style={styles.sectionLabel}>Items to Dispense</Text>
              {selectedPrescription?.items?.map((item: any, idx: number) => (
                <View key={idx} style={styles.dispenseItem}>
                  <Text style={styles.dispenseItemName}>{item.medication_name}</Text>
                  <Text style={styles.dispenseItemDetail}>{item.dosage} - Qty: {item.quantity}</Text>
                </View>
              ))}
              <Text style={styles.sectionLabel}>Notes</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Dispensing notes..." value={dispenseNotes} onChangeText={setDispenseNotes} multiline numberOfLines={3} />
              <TouchableOpacity style={styles.modalSubmit} onPress={handleDispense}>
                <Text style={styles.modalSubmitText}>Confirm Dispense</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: COLORS.textLight },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, margin: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.text },
  prescriptionCard: { backgroundColor: COLORS.white, marginHorizontal: 12, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  prescriptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  patientInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  patientName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  doctorText: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  dateText: { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  itemsList: { marginLeft: 52, marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  itemDetail: { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  itemQty: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  dispenseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: 10, gap: 6, marginTop: 8 },
  dispenseText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: COLORS.textLight, fontSize: 14 },
  bottomPadding: { height: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalBody: { marginBottom: 16 },
  patientLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: 12, marginBottom: 8 },
  dispenseItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dispenseItemName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  dispenseItemDetail: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalSubmit: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  modalSubmitText: { color: COLORS.white, fontWeight: '700', fontSize: 16 }
});
