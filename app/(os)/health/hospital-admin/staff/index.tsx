
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useHospitalAdmin } from '@/lib/health/hooks/useHospitalAdmin';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { Users, Plus, Search, X, Mail, Phone, Stethoscope, ChevronRight } from 'lucide-react-native';

const COLORS = {
  primary: '#0A4DA6', primaryLight: '#E8F0FE', success: '#10B981', warning: '#F59E0B',
  danger: '#EF4444', text: '#1F2937', textLight: '#6B7280', border: '#E5E7EB',
  background: '#F3F4F6', white: '#FFFFFF'
};

export default function StaffManagementScreen() {
  const router = useRouter();
  const { selectedFacilityId } = useHealthRole();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', phone: '', role: 'nurse', department: '', license_number: '' });
  const { staff, loading, error, refresh, inviteStaff } = useHospitalAdmin(selectedFacilityId);

  const onRefresh = useCallback(async () => { setRefreshing(true); await refresh(); setRefreshing(false); }, [refresh]);

  const filteredStaff = staff?.filter((member: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return member.name?.toLowerCase().includes(q) || member.email?.toLowerCase().includes(q) || member.role?.toLowerCase().includes(q) || member.department?.toLowerCase().includes(q);
  });

  const handleInvite = useCallback(async () => {
    if (!newStaff.name.trim() || !newStaff.email.trim()) { Alert.alert('Error', 'Name and email are required'); return; }
    try {
      await inviteStaff({ ...newStaff, facility_id: selectedFacilityId });
      setShowAddModal(false);
      setNewStaff({ name: '', email: '', phone: '', role: 'nurse', department: '', license_number: '' });
      Alert.alert('Success', 'Staff invitation sent');
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to invite staff'); }
  }, [newStaff, selectedFacilityId, inviteStaff]);

  const getStatusColor = (status: string) => {
    switch (status) { case 'active': return COLORS.success; case 'on_leave': return COLORS.warning; case 'inactive': return COLORS.danger; default: return COLORS.textLight; }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading staff...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Staff Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={20} color={COLORS.white} />
          <Text style={styles.addButtonText}>Add Staff</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={COLORS.textLight} />
        <TextInput style={styles.searchInput} placeholder="Search staff by name, role, department..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={COLORS.textLight} />
        {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color={COLORS.textLight} /></TouchableOpacity>}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filteredStaff?.length === 0 ? (
          <View style={styles.emptyState}><Users size={48} color={COLORS.textLight} /><Text style={styles.emptyText}>{searchQuery ? 'No staff match your search' : 'No staff members yet'}</Text></View>
        ) : (
          filteredStaff?.map((member: any) => (
            <TouchableOpacity key={member.id} style={styles.staffCard} onPress={() => router.push(`/(os)/health/hospital-admin/staff/${member.id}`)}>
              <View style={styles.staffHeader}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{member.name?.charAt(0) || '?'}</Text></View>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{member.name}</Text>
                  <Text style={styles.staffRole}>{member.role} - {member.department}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(member.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(member.status) }]}>{member.status}</Text>
                </View>
              </View>
              <View style={styles.staffDetails}>
                <View style={styles.detailRow}><Mail size={14} color={COLORS.textLight} /><Text style={styles.detailText}>{member.email}</Text></View>
                {member.phone && <View style={styles.detailRow}><Phone size={14} color={COLORS.textLight} /><Text style={styles.detailText}>{member.phone}</Text></View>}
                {member.license_number && <View style={styles.detailRow}><Stethoscope size={14} color={COLORS.textLight} /><Text style={styles.detailText}>License: {member.license_number}</Text></View>}
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Staff Member</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><X size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput style={styles.input} placeholder="Dr. Jane Smith" value={newStaff.name} onChangeText={(t) => setNewStaff({ ...newStaff, name: t })} />
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput style={styles.input} placeholder="doctor@hospital.com" value={newStaff.email} onChangeText={(t) => setNewStaff({ ...newStaff, email: t })} keyboardType="email-address" autoCapitalize="none" />
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput style={styles.input} placeholder="+255..." value={newStaff.phone} onChangeText={(t) => setNewStaff({ ...newStaff, phone: t })} keyboardType="phone-pad" />
              <Text style={styles.inputLabel}>Role *</Text>
              <View style={styles.roleGrid}>
                {['doctor', 'nurse', 'pharmacist', 'lab_technician', 'radiologist', 'admin'].map((r) => (
                  <TouchableOpacity key={r} style={[styles.roleButton, newStaff.role === r && styles.roleButtonActive]} onPress={() => setNewStaff({ ...newStaff, role: r })}>
                    <Text style={[styles.roleText, newStaff.role === r && styles.roleTextActive]}>{r.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Department</Text>
              <TextInput style={styles.input} placeholder="e.g. Cardiology" value={newStaff.department} onChangeText={(t) => setNewStaff({ ...newStaff, department: t })} />
              <Text style={styles.inputLabel}>License Number</Text>
              <TextInput style={styles.input} placeholder="Medical license number" value={newStaff.license_number} onChangeText={(t) => setNewStaff({ ...newStaff, license_number: t })} />
              <TouchableOpacity style={styles.modalSubmit} onPress={handleInvite}>
                <Text style={styles.modalSubmitText}>Send Invitation</Text>
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
  staffCard: { backgroundColor: COLORS.white, marginHorizontal: 12, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  staffHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  staffRole: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  staffDetails: { marginLeft: 56 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailText: { marginLeft: 6, fontSize: 12, color: COLORS.textLight },
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
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  roleButtonActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  roleText: { fontSize: 12, color: COLORS.textLight, textTransform: 'capitalize' },
  roleTextActive: { color: COLORS.primary, fontWeight: '600' },
  modalSubmit: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalSubmitText: { color: COLORS.white, fontWeight: '700', fontSize: 16 }
});
