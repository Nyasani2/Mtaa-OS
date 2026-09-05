
import React, { useState, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useHospitalAdmin } from '@/lib/health/hooks/useHospitalAdmin';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { LogOut, Search, X, Calendar, FileText, User, BedDouble, Check } from 'lucide-react-native';

const COLORS = {
  primary: '#0A4DA6', primaryLight: '#E8F0FE', success: '#10B981', warning: '#F59E0B',
  danger: '#EF4444', text: '#1F2937', textLight: '#6B7280', border: '#E5E7EB',
  background: '#F3F4F6', white: '#FFFFFF'
};

export default function DischargesScreen() {
  const router = useRouter();
  const { selectedFacilityId } = useHealthRole();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [dischargeForm, setDischargeForm] = useState({ discharge_type: 'regular', diagnosis: '', medications: '', follow_up_date: '', notes: '' });
  const { discharges, activeAdmissions, loading, error, refresh, dischargePatient } = useHospitalAdmin(selectedFacilityId);

  const onRefresh = useCallback(async () => { setRefreshing(true); await refresh(); setRefreshing(false); }, [refresh]);

  const filteredDischarges = discharges?.filter((d: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return d.patient_name?.toLowerCase().includes(q) || d.diagnosis?.toLowerCase().includes(q) || d.ward?.toLowerCase().includes(q);
  });

  const handleInitiateDischarge = useCallback((admission: any) => { setSelectedAdmission(admission); setShowDischargeModal(true); }, []);

  const handleDischarge = useCallback(async () => {
    if (!dischargeForm.diagnosis.trim()) { Alert.alert('Error', 'Final diagnosis is required'); return; }
    try {
      await dischargePatient(selectedAdmission.id, selectedAdmission.patient_id, {
        discharge_type: dischargeForm.discharge_type,
        diagnosis: dischargeForm.diagnosis,
        medications: dischargeForm.medications.split(',').map((m: string) => m.trim()).filter(Boolean),
        follow_up_date: dischargeForm.follow_up_date || null,
        notes: dischargeForm.notes
      });
      setShowDischargeModal(false);
      setDischargeForm({ discharge_type: 'regular', diagnosis: '', medications: '', follow_up_date: '', notes: '' });
      Alert.alert('Success', 'Patient discharged successfully');
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to discharge patient'); }
  }, [dischargeForm, selectedAdmission, dischargePatient]);

  const getDischargeTypeColor = (type: string) => {
    switch (type) { case 'regular': return COLORS.success; case 'transferred': return COLORS.primary; case 'against_advice': return COLORS.warning; case 'deceased': return COLORS.danger; default: return COLORS.textLight; }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading discharges...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discharges</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => {
          if (activeAdmissions?.length === 0) { Alert.alert('No Admissions', 'There are no active admissions to discharge.'); return; }
          Alert.alert('Select Patient', 'Choose a patient to discharge:', activeAdmissions?.map((a: any) => ({
            text: `${a.patient_name} (Bed ${a.bed_number})`, onPress: () => handleInitiateDischarge(a)
          })) || []);
        }}>
          <LogOut size={18} color={COLORS.white} />
          <Text style={styles.newButtonText}>New Discharge</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={COLORS.textLight} />
        <TextInput style={styles.searchInput} placeholder="Search discharges..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={COLORS.textLight} />
        {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color={COLORS.textLight} /></TouchableOpacity>}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filteredDischarges?.length === 0 ? (
          <View style={styles.emptyState}><LogOut size={48} color={COLORS.textLight} /><Text style={styles.emptyText}>{searchQuery ? 'No discharges match your search' : 'No discharge records yet'}</Text></View>
        ) : (
          filteredDischarges?.map((discharge: any) => (
            <TouchableOpacity key={discharge.id} style={styles.dischargeCard} onPress={() => router.push(`/(os)/health/hospital-admin/discharges?id=${discharge.id}` as any)}>
              <View style={styles.dischargeHeader}>
                <View style={styles.patientInfo}>
                  <View style={[styles.avatar, { backgroundColor: COLORS.primaryLight }]}>
                    <Text style={styles.avatarText}>{discharge.patient_name?.charAt(0) || '?'}</Text>
                  </View>
                  <View>
                    <Text style={styles.patientName}>{discharge.patient_name}</Text>
                    <Text style={styles.patientDetail}>Bed {discharge.bed_number} - {discharge.ward}</Text>
                  </View>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: getDischargeTypeColor(discharge.discharge_type) + '20' }]}>
                  <Text style={[styles.typeText, { color: getDischargeTypeColor(discharge.discharge_type) }]}>{discharge.discharge_type}</Text>
                </View>
              </View>
              <View style={styles.dischargeDetails}>
                <View style={styles.detailRow}><Calendar size={14} color={COLORS.textLight} /><Text style={styles.detailText}>{new Date(discharge.discharge_date).toLocaleDateString()}</Text></View>
                <View style={styles.detailRow}><FileText size={14} color={COLORS.textLight} /><Text style={styles.detailText}>{discharge.diagnosis}</Text></View>
                {discharge.medications?.length > 0 && (
                  <View style={styles.detailRow}><Text style={styles.medsLabel}>Meds:</Text><Text style={styles.detailText}>{discharge.medications.join(', ')}</Text></View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={showDischargeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Discharge {selectedAdmission?.patient_name}</Text>
              <TouchableOpacity onPress={() => setShowDischargeModal(false)}><X size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Discharge Type</Text>
              <View style={styles.typeRow}>
                {(['regular', 'against_advice', 'transferred', 'deceased'] as const).map((type) => (
                  <TouchableOpacity key={type} style={[styles.typeButton, dischargeForm.discharge_type === type && styles.typeButtonActive]} onPress={() => setDischargeForm({ ...dischargeForm, discharge_type: type })}>
                    <Text style={[styles.typeButtonText, dischargeForm.discharge_type === type && styles.typeButtonTextActive]}>{type.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Final Diagnosis *</Text>
              <TextInput style={styles.input} placeholder="Final diagnosis" value={dischargeForm.diagnosis} onChangeText={(t) => setDischargeForm({ ...dischargeForm, diagnosis: t })} />
              <Text style={styles.inputLabel}>Medications (comma separated)</Text>
              <TextInput style={styles.input} placeholder="Paracetamol, Amoxicillin..." value={dischargeForm.medications} onChangeText={(t) => setDischargeForm({ ...dischargeForm, medications: t })} />
              <Text style={styles.inputLabel}>Follow-up Date</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={dischargeForm.follow_up_date} onChangeText={(t) => setDischargeForm({ ...dischargeForm, follow_up_date: t })} />
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Additional notes..." value={dischargeForm.notes} onChangeText={(t) => setDischargeForm({ ...dischargeForm, notes: t })} multiline numberOfLines={3} />
              <TouchableOpacity style={styles.modalSubmit} onPress={handleDischarge}>
                <Text style={styles.modalSubmitText}>Complete Discharge</Text>
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
  newButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.success, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  newButtonText: { color: COLORS.white, fontWeight: '600', marginLeft: 6 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, margin: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.text },
  dischargeCard: { backgroundColor: COLORS.white, marginHorizontal: 12, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  dischargeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  patientInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  patientName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  patientDetail: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  dischargeDetails: { marginLeft: 52 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailText: { marginLeft: 6, fontSize: 13, color: COLORS.textLight },
  medsLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginRight: 4 },
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
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  typeButtonActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  typeButtonText: { fontSize: 12, color: COLORS.textLight, textTransform: 'capitalize' },
  typeButtonTextActive: { color: COLORS.primary, fontWeight: '600' },
  modalSubmit: { backgroundColor: COLORS.success, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalSubmitText: { color: COLORS.white, fontWeight: '700', fontSize: 16 }
});
