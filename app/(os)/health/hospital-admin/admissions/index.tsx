
import React, { useState, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useHospitalAdmin } from '@/lib/health/hooks/useHospitalAdmin';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { UserPlus, Search, X, Calendar, BedDouble, Stethoscope, FileText, AlertCircle } from 'lucide-react-native';

const COLORS = {
  primary: '#0A4DA6', primaryLight: '#E8F0FE', success: '#10B981', warning: '#F59E0B',
  danger: '#EF4444', text: '#1F2937', textLight: '#6B7280', border: '#E5E7EB',
  background: '#F3F4F6', white: '#FFFFFF'
};

export default function AdmissionsScreen() {
  const router = useRouter();
  const { selectedFacilityId } = useHealthRole();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [admitForm, setAdmitForm] = useState({ patient_name: '', patient_phone: '', patient_id: '', ward: '', bed_id: '', diagnosis: '', doctor_id: '', admission_type: 'emergency', notes: '' });
  const { admissions, availableBeds, loading, error, refresh, admitPatient } = useHospitalAdmin(selectedFacilityId);

  const onRefresh = useCallback(async () => { setRefreshing(true); await refresh(); setRefreshing(false); }, [refresh]);

  const filteredAdmissions = admissions?.filter((a: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return a.patient_name?.toLowerCase().includes(q) || a.diagnosis?.toLowerCase().includes(q) || a.ward?.toLowerCase().includes(q);
  });

  const handleAdmit = useCallback(async () => {
    if (!admitForm.patient_name.trim() || !admitForm.ward.trim() || !admitForm.bed_id) {
      Alert.alert('Error', 'Patient name, ward, and bed are required'); return;
    }
    try {
      await admitPatient({ ...admitForm, facility_id: selectedFacilityId });
      setShowAdmitModal(false);
      setAdmitForm({ patient_name: '', patient_phone: '', patient_id: '', ward: '', bed_id: '', diagnosis: '', doctor_id: '', admission_type: 'emergency', notes: '' });
      Alert.alert('Success', 'Patient admitted successfully');
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to admit patient'); }
  }, [admitForm, selectedFacilityId, admitPatient]);

  const getStatusColor = (status: string) => {
    switch (status) { case 'active': return COLORS.success; case 'pending': return COLORS.warning; case 'discharged': return COLORS.textLight; case 'transferred': return COLORS.primary; default: return COLORS.textLight; }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading admissions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admissions</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => setShowAdmitModal(true)}>
          <UserPlus size={18} color={COLORS.white} />
          <Text style={styles.newButtonText}>Admit Patient</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={COLORS.textLight} />
        <TextInput style={styles.searchInput} placeholder="Search admissions..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={COLORS.textLight} />
        {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color={COLORS.textLight} /></TouchableOpacity>}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filteredAdmissions?.length === 0 ? (
          <View style={styles.emptyState}><UserPlus size={48} color={COLORS.textLight} /><Text style={styles.emptyText}>{searchQuery ? 'No admissions match your search' : 'No admissions yet'}</Text></View>
        ) : (
          filteredAdmissions?.map((admission: any) => (
            <TouchableOpacity key={admission.id} style={styles.admissionCard} onPress={() => router.push(`/(os)/health/hospital-admin/admissions?id=${admission.id}` as any)}>
              <View style={styles.admissionHeader}>
                <View style={styles.patientInfo}>
                  <View style={[styles.avatar, { backgroundColor: COLORS.primaryLight }]}>
                    <Text style={styles.avatarText}>{admission.patient_name?.charAt(0) || '?'}</Text>
                  </View>
                  <View>
                    <Text style={styles.patientName}>{admission.patient_name}</Text>
                    <Text style={styles.patientDetail}>Bed {admission.bed_number} - {admission.ward}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(admission.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(admission.status) }]}>{admission.status}</Text>
                </View>
              </View>
              <View style={styles.admissionDetails}>
                <View style={styles.detailRow}><Calendar size={14} color={COLORS.textLight} /><Text style={styles.detailText}>{new Date(admission.admission_date).toLocaleDateString()}</Text></View>
                <View style={styles.detailRow}><Stethoscope size={14} color={COLORS.textLight} /><Text style={styles.detailText}>{admission.diagnosis || 'No diagnosis'}</Text></View>
                {admission.doctor_name && <View style={styles.detailRow}><FileText size={14} color={COLORS.textLight} /><Text style={styles.detailText}>Dr. {admission.doctor_name}</Text></View>}
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={showAdmitModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Admit New Patient</Text>
              <TouchableOpacity onPress={() => setShowAdmitModal(false)}><X size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Patient Name *</Text>
              <TextInput style={styles.input} placeholder="Patient full name" value={admitForm.patient_name} onChangeText={(t) => setAdmitForm({ ...admitForm, patient_name: t })} />
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput style={styles.input} placeholder="+255..." value={admitForm.patient_phone} onChangeText={(t) => setAdmitForm({ ...admitForm, patient_phone: t })} keyboardType="phone-pad" />
              <Text style={styles.inputLabel}>Ward *</Text>
              <TextInput style={styles.input} placeholder="e.g. General Ward" value={admitForm.ward} onChangeText={(t) => setAdmitForm({ ...admitForm, ward: t })} />
              <Text style={styles.inputLabel}>Bed *</Text>
              <View style={styles.bedRow}>
                {availableBeds?.length === 0 ? (
                  <Text style={styles.noBedsText}>No available beds. Add beds first.</Text>
                ) : (
                  availableBeds?.map((bed: any) => (
                    <TouchableOpacity key={bed.id} style={[styles.bedButton, admitForm.bed_id === bed.id && styles.bedButtonActive]} onPress={() => setAdmitForm({ ...admitForm, bed_id: bed.id })}>
                      <BedDouble size={16} color={admitForm.bed_id === bed.id ? COLORS.primary : COLORS.textLight} />
                      <Text style={[styles.bedText, admitForm.bed_id === bed.id && styles.bedTextActive]}>{bed.bed_number}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
              <Text style={styles.inputLabel}>Diagnosis</Text>
              <TextInput style={styles.input} placeholder="Initial diagnosis" value={admitForm.diagnosis} onChangeText={(t) => setAdmitForm({ ...admitForm, diagnosis: t })} />
              <Text style={styles.inputLabel}>Admission Type</Text>
              <View style={styles.typeRow}>
                {(['emergency', 'planned', 'referral'] as const).map((type) => (
                  <TouchableOpacity key={type} style={[styles.typeButton, admitForm.admission_type === type && styles.typeButtonActive]} onPress={() => setAdmitForm({ ...admitForm, admission_type: type })}>
                    <Text style={[styles.typeButtonText, admitForm.admission_type === type && styles.typeButtonTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Additional notes..." value={admitForm.notes} onChangeText={(t) => setAdmitForm({ ...admitForm, notes: t })} multiline numberOfLines={3} />
              <TouchableOpacity style={styles.modalSubmit} onPress={handleAdmit}>
                <Text style={styles.modalSubmitText}>Admit Patient</Text>
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
  newButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  newButtonText: { color: COLORS.white, fontWeight: '600', marginLeft: 6 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, margin: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.text },
  admissionCard: { backgroundColor: COLORS.white, marginHorizontal: 12, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  admissionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  patientInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  patientName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  patientDetail: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  admissionDetails: { marginLeft: 52 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailText: { marginLeft: 6, fontSize: 13, color: COLORS.textLight },
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
  bedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bedButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, gap: 4 },
  bedButtonActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  bedText: { fontSize: 13, color: COLORS.textLight },
  bedTextActive: { color: COLORS.primary, fontWeight: '600' },
  noBedsText: { color: COLORS.danger, fontSize: 13 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  typeButtonActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  typeButtonText: { fontSize: 12, color: COLORS.textLight, textTransform: 'capitalize' },
  typeButtonTextActive: { color: COLORS.primary, fontWeight: '600' },
  modalSubmit: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalSubmitText: { color: COLORS.white, fontWeight: '700', fontSize: 16 }
});
