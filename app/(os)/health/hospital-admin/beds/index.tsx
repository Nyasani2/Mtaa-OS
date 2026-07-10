
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useHospitalAdmin } from '@/lib/health/hooks/useHospitalAdmin';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { BedDouble, Plus, Search, X, AlertCircle } from 'lucide-react-native';

const COLORS = {
  primary: '#0A4DA6', primaryLight: '#E8F0FE', success: '#10B981', warning: '#F59E0B',
  danger: '#EF4444', text: '#1F2937', textLight: '#6B7280', border: '#E5E7EB',
  background: '#F3F4F6', white: '#FFFFFF'
};

type BedStatus = 'available' | 'occupied' | 'maintenance';

export default function BedsManagementScreen() {
  const router = useRouter();
  const { selectedFacilityId } = useHealthRole();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | BedStatus>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBed, setNewBed] = useState({ bed_number: '', ward: '', room_type: 'general', floor: '1' });
  const { beds, loading, error, refresh, addBed, updateBedStatus, dischargePatient } = useHospitalAdmin(selectedFacilityId);

  const onRefresh = useCallback(async () => { setRefreshing(true); await refresh(); setRefreshing(false); }, [refresh]);

  const filteredBeds = beds?.filter((bed: any) => {
    const matchesSearch = !searchQuery ||
      bed.bed_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bed.ward?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bed.patient_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || bed.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddBed = useCallback(async () => {
    if (!newBed.bed_number.trim() || !newBed.ward.trim()) {
      Alert.alert('Error', 'Bed number and ward are required'); return;
    }
    try {
      await addBed({ bed_number: newBed.bed_number, ward: newBed.ward, room_type: newBed.room_type, floor: parseInt(newBed.floor), facility_id: selectedFacilityId, status: 'available' });
      setShowAddModal(false);
      setNewBed({ bed_number: '', ward: '', room_type: 'general', floor: '1' });
      Alert.alert('Success', 'Bed added successfully');
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to add bed'); }
  }, [newBed, selectedFacilityId, addBed]);

  const handleDischarge = useCallback((bed: any) => {
    Alert.alert('Discharge Patient', `Discharge ${bed.patient_name} from bed ${bed.bed_number}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discharge', style: 'destructive', onPress: async () => {
        try { await dischargePatient(bed.id, bed.patient_id); Alert.alert('Success', 'Patient discharged');
        } catch (err: any) { Alert.alert('Error', err.message || 'Failed to discharge'); }
      }}
    ]);
  }, [dischargePatient]);

  const getStatusColor = (status: BedStatus) => {
    switch (status) { case 'available': return COLORS.success; case 'occupied': return COLORS.danger; case 'maintenance': return COLORS.warning; default: return COLORS.textLight; }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading beds...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bed Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={20} color={COLORS.white} />
          <Text style={styles.addButtonText}>Add Bed</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={COLORS.textLight} />
        <TextInput style={styles.searchInput} placeholder="Search beds, wards, // STUB_REMOVED: "patients"..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={COLORS.textLight} />
        {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color={COLORS.textLight} /></TouchableOpacity>}
      </View>

      <View style={styles.statusRow}>
        {(['all', 'available', 'occupied', 'maintenance'] as const).map((status) => (
          <TouchableOpacity key={status} style={[styles.statusChip, filterStatus === status && styles.statusChipActive]} onPress={() => setFilterStatus(status)}>
            <View style={[styles.statusDot, { backgroundColor: status === 'all' ? COLORS.primary : getStatusColor(status as BedStatus) }]} />
            <Text style={[styles.statusChipText, filterStatus === status && styles.statusChipTextActive]}>
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filteredBeds?.length === 0 ? (
          <View style={styles.emptyState}><BedDouble size={48} color={COLORS.textLight} /><Text style={styles.emptyText}>{searchQuery ? 'No beds match your search' : 'No beds found'}</Text></View>
        ) : (
          filteredBeds?.map((bed: any) => (
            <View key={bed.id} style={styles.bedCard}>
              <View style={styles.bedHeader}>
                <View style={styles.bedInfo}>
                  <BedDouble size={20} color={getStatusColor(bed.status)} />
                  <Text style={styles.bedNumber}>Bed {bed.bed_number}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bed.status) + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(bed.status) }]}>{bed.status}</Text>
                  </View>
                </View>
                {bed.status === 'occupied' && bed.patient_id ? (
                  <TouchableOpacity onPress={() => handleDischarge(bed)}>
                    <Text style={styles.dischargeLink}>Discharge</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => updateBedStatus(bed.id, bed.status === 'maintenance' ? 'available' : 'maintenance')}>
                    <Text style={{ color: bed.status === 'maintenance' ? COLORS.success : COLORS.warning, fontWeight: '600', fontSize: 13 }}>
                      {bed.status === 'maintenance' ? 'Make Available' : 'Maintenance'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.bedDetails}>
                <Text style={styles.bedDetailText}>Ward: {bed.ward}</Text>
                <Text style={styles.bedDetailText}>Room: {bed.room_type}</Text>
                <Text style={styles.bedDetailText}>Floor: {bed.floor}</Text>
                {bed.patient_name && (
                  <View style={styles.patientRow}>
                    <Text style={styles.patientName}>Patient: {bed.patient_name}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Bed</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><X size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Bed Number *</Text>
              <TextInput style={styles.input} placeholder="e.g. A-101" value={newBed.bed_number} onChangeText={(t) => setNewBed({ ...newBed, bed_number: t })} />
              <Text style={styles.inputLabel}>Ward *</Text>
              <TextInput style={styles.input} placeholder="e.g. General Ward" value={newBed.ward} onChangeText={(t) => setNewBed({ ...newBed, ward: t })} />
              <Text style={styles.inputLabel}>Room Type</Text>
              <View style={styles.radioGroup}>
                {['general', 'private', 'icu', 'maternity'].map((type) => (
                  <TouchableOpacity key={type} style={[styles.radioButton, newBed.room_type === type && styles.radioButtonActive]} onPress={() => setNewBed({ ...newBed, room_type: type })}>
                    <Text style={[styles.radioText, newBed.room_type === type && styles.radioTextActive]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Floor</Text>
              <View style={styles.floorRow}>
                {['1', '2', '3', '4', '5'].map((f) => (
                  <TouchableOpacity key={f} style={[styles.floorButton, newBed.floor === f && styles.floorButtonActive]} onPress={() => setNewBed({ ...newBed, floor: f })}>
                    <Text style={[styles.floorText, newBed.floor === f && styles.floorTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleAddBed}>
                <Text style={styles.modalSubmitText}>Add Bed</Text>
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
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: COLORS.white, fontWeight: '600', marginLeft: 6 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, margin: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.text },
  statusRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, flexWrap: 'wrap', gap: 6 },
  statusChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  statusChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  statusChipText: { fontSize: 12, color: COLORS.textLight },
  statusChipTextActive: { color: COLORS.primary, fontWeight: '600' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  bedCard: { backgroundColor: COLORS.white, marginHorizontal: 12, marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  bedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bedInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bedNumber: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  dischargeLink: { color: COLORS.danger, fontWeight: '600', fontSize: 13 },
  bedDetails: { marginLeft: 28 },
  bedDetailText: { fontSize: 13, color: COLORS.textLight, marginBottom: 2 },
  patientRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  patientName: { marginLeft: 4, fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: COLORS.textLight, fontSize: 14 },
  bottomPadding: { height: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalBody: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text },
  radioGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  radioButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  radioButtonActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  radioText: { fontSize: 13, color: COLORS.textLight },
  radioTextActive: { color: COLORS.primary, fontWeight: '600' },
  floorRow: { flexDirection: 'row', gap: 8 },
  floorButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  floorButtonActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  floorText: { fontSize: 14, color: COLORS.textLight },
  floorTextActive: { color: COLORS.primary, fontWeight: '700' },
  modalSubmit: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalSubmitText: { color: COLORS.white, fontWeight: '700', fontSize: 16 }
});
