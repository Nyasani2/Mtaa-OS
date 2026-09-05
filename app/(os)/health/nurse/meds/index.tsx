
import React, { useState, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Modal, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useNurse } from '@/lib/health/hooks/useNurse';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { Pill, Plus, Search, X, Clock, CheckCircle, AlertTriangle, User, Calendar } from 'lucide-react-native';

const COLORS = {
  primary: '#0A4DA6', primaryLight: '#E8F0FE', success: '#10B981', warning: '#F59E0B',
  danger: '#EF4444', text: '#1F2937', textLight: '#6B7280', border: '#E5E7EB',
  background: '#F3F4F6', white: '#FFFFFF'
};

export default function NurseMedsScreen() {
  const router = useRouter();
  const { selectedFacilityId } = useHealthRole();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMed, setNewMed] = useState({ patient_id: '', medication_name: '', dosage: '', frequency: '', route: 'oral', scheduled_time: '', notes: '', is_prn: false });
  const { medications, patients, loading, error, refresh, administerMed, addMedication } = useNurse(selectedFacilityId);

  const onRefresh = useCallback(async () => { setRefreshing(true); await refresh(); setRefreshing(false); }, [refresh]);

  const filteredMeds = medications?.filter((med: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return med.medication_name?.toLowerCase().includes(q) || med.patient_name?.toLowerCase().includes(q) || med.dosage?.toLowerCase().includes(q);
  });

  const handleAdminister = useCallback(async (medId: string, patientId: string) => {
    Alert.alert('Administer Medication', 'Confirm this medication was given?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
        try { await administerMed(medId, patientId); Alert.alert('Success', 'Medication recorded'); }
        catch (err: any) { Alert.alert('Error', err.message || 'Failed to record'); }
      }}
    ]);
  }, [administerMed]);

  const handleAddMed = useCallback(async () => {
    if (!newMed.patient_id || !newMed.medication_name.trim() || !newMed.dosage.trim()) {
      Alert.alert('Error', 'Patient, medication name, and dosage are required'); return;
    }
    try {
      await addMedication({ ...newMed, facility_id: selectedFacilityId });
      setShowAddModal(false);
      setNewMed({ patient_id: '', medication_name: '', dosage: '', frequency: '', route: 'oral', scheduled_time: '', notes: '', is_prn: false });
      Alert.alert('Success', 'Medication added');
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to add medication'); }
  }, [newMed, selectedFacilityId, addMedication]);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading medications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medications</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={20} color={COLORS.white} />
          <Text style={styles.addButtonText}>Add Med</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={COLORS.textLight} />
        <TextInput style={styles.searchInput} placeholder="Search medications or patients..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={COLORS.textLight} />
        {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color={COLORS.textLight} /></TouchableOpacity>}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filteredMeds?.length === 0 ? (
          <View style={styles.emptyState}><Pill size={48} color={COLORS.textLight} /><Text style={styles.emptyText}>{searchQuery ? 'No medications match' : 'No medications scheduled'}</Text></View>
        ) : (
          filteredMeds?.map((med: any) => (
            <View key={med.id} style={styles.medCard}>
              <View style={styles.medHeader}>
                <View style={styles.patientInfo}>
                  <View style={[styles.avatar, { backgroundColor: COLORS.primaryLight }]}>
                    <Text style={styles.avatarText}>{med.patient_name?.charAt(0) || '?'}</Text>
                  </View>
                  <View>
                    <Text style={styles.patientName}>{med.patient_name}</Text>
                    <Text style={styles.medName}>{med.medication_name} {med.dosage}</Text>
                  </View>
                </View>
                {med.is_prn && <View style={styles.prnBadge}><Text style={styles.prnText}>PRN</Text></View>}
              </View>
              <View style={styles.medDetails}>
                <View style={styles.detailRow}><Clock size={14} color={COLORS.textLight} /><Text style={styles.detailText}>{med.frequency} {med.scheduled_time && `at ${med.scheduled_time}`}</Text></View>
                <View style={styles.detailRow}><Pill size={14} color={COLORS.textLight} /><Text style={styles.detailText}>Route: {med.route}</Text></View>
                {med.notes && <View style={styles.detailRow}><Text style={styles.notesText}>{med.notes}</Text></View>}
              </View>
              <View style={styles.medActions}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.success }]} onPress={() => handleAdminister(med.id, med.patient_id)}>
                  <CheckCircle size={16} color={COLORS.white} />
                  <Text style={styles.actionBtnText}>Given</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.warning }]} onPress={() => { Alert.alert('Skip', 'Reason for skipping?', [{ text: 'Cancel' }, { text: 'Skip', onPress: () => {} }]); }}>
                  <AlertTriangle size={16} color={COLORS.white} />
                  <Text style={styles.actionBtnText}>Skip</Text>
                </TouchableOpacity>
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
              <Text style={styles.modalTitle}>Add Medication</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><X size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Patient *</Text>
              <View style={styles.patientRow}>
                {patients?.map((p: any) => (
                  <TouchableOpacity key={p.id} style={[styles.patientChip, newMed.patient_id === p.id && styles.patientChipActive]} onPress={() => setNewMed({ ...newMed, patient_id: p.id })}>
                    <Text style={[styles.patientChipText, newMed.patient_id === p.id && styles.patientChipTextActive]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Medication Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. Paracetamol" value={newMed.medication_name} onChangeText={(t) => setNewMed({ ...newMed, medication_name: t })} />
              <Text style={styles.inputLabel}>Dosage *</Text>
              <TextInput style={styles.input} placeholder="e.g. 500mg" value={newMed.dosage} onChangeText={(t) => setNewMed({ ...newMed, dosage: t })} />
              <Text style={styles.inputLabel}>Frequency</Text>
              <TextInput style={styles.input} placeholder="e.g. Every 6 hours" value={newMed.frequency} onChangeText={(t) => setNewMed({ ...newMed, frequency: t })} />
              <Text style={styles.inputLabel}>Route</Text>
              <View style={styles.routeRow}>
                {['oral', 'iv', 'im', 'sc', 'topical'].map((r) => (
                  <TouchableOpacity key={r} style={[styles.routeChip, newMed.route === r && styles.routeChipActive]} onPress={() => setNewMed({ ...newMed, route: r })}>
                    <Text style={[styles.routeText, newMed.route === r && styles.routeTextActive]}>{r.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Scheduled Time</Text>
              <TextInput style={styles.input} placeholder="08:00, 14:00, 20:00" value={newMed.scheduled_time} onChangeText={(t) => setNewMed({ ...newMed, scheduled_time: t })} />
              <View style={styles.switchRow}>
                <Text style={styles.inputLabel}>PRN (as needed)</Text>
                <Switch value={newMed.is_prn} onValueChange={(v) => setNewMed({ ...newMed, is_prn: v })} />
              </View>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Special instructions..." value={newMed.notes} onChangeText={(t) => setNewMed({ ...newMed, notes: t })} multiline numberOfLines={3} />
              <TouchableOpacity style={styles.modalSubmit} onPress={handleAddMed}>
                <Text style={styles.modalSubmitText}>Add Medication</Text>
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
  medCard: { backgroundColor: COLORS.white, marginHorizontal: 12, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  patientInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  patientName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  medName: { fontSize: 13, color: COLORS.textLight, marginTop: 1 },
  prnBadge: { backgroundColor: COLORS.warning + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  prnText: { fontSize: 11, color: COLORS.warning, fontWeight: '600' },
  medDetails: { marginLeft: 52, marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  detailText: { marginLeft: 6, fontSize: 12, color: COLORS.textLight },
  notesText: { fontSize: 12, color: COLORS.textLight, fontStyle: 'italic' },
  medActions: { flexDirection: 'row', gap: 8, marginLeft: 52 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 4 },
  actionBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 12 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: COLORS.textLight, fontSize: 14 },
  bottomPadding: { height: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalBody: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text },
  textArea: { height: 80, textAlignVertical: 'top' },
  patientRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  patientChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  patientChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  patientChipText: { fontSize: 12, color: COLORS.textLight },
  patientChipTextActive: { color: COLORS.primary, fontWeight: '600' },
  routeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  routeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  routeChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  routeText: { fontSize: 11, color: COLORS.textLight },
  routeTextActive: { color: COLORS.primary, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  modalSubmit: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  modalSubmitText: { color: COLORS.white, fontWeight: '700', fontSize: 16 }
});
