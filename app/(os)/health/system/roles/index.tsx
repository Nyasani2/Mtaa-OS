import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Users,
  Plus,
  Search,
  UserCheck,
  UserX,
  Mail,
  Building2,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { useHealthRole } from '@/lib/health/hooks';
import { healthRoleService, ROLE_DISPLAY_NAMES, ROLE_COLORS } from '@/lib/health/services';
import type { HealthRole } from '@/lib/health/services';

const STATUS_FILTERS = ['All', 'Active', 'Pending', 'Suspended'];
const ROLE_FILTERS: HealthRole[] = [
  'doctor', 'nurse', 'pharmacist', 'lab_technician', 'radiologist',
  'hospital_admin', 'cashier', 'hr_manager', 'accountant',
  'ambulance_driver', 'receptionist', 'system_admin',
];

export default function StaffManagementScreen() {
  const router = useRouter();
  const { staffRecord, facilityId } = useHealthRole();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState<string>('All Roles');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<HealthRole>('doctor');
  const [inviteDept, setInviteDept] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    if (!facilityId) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const filters: any = {};
      if (statusFilter !== 'All') filters.status = statusFilter.toLowerCase();
      if (roleFilter !== 'All Roles') filters.role = roleFilter;

      const data = await healthRoleService.getStaffByFacility(facilityId, filters);
      setStaff(data || []);
    } catch (err: any) {
      console.error('Fetch staff error:', err);
      setError(err.message || 'Failed to load staff');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [facilityId, statusFilter, roleFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStaff();
  }, [fetchStaff]);

  const handleInvite = async () => {
    if (!facilityId || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      await healthRoleService.inviteStaff({
        facility_id: facilityId,
        email: inviteEmail.trim(),
        role: inviteRole,
        department: inviteDept.trim() || null,
        invited_by: staffRecord?.user_id || '',
      });
      setShowInvite(false);
      setInviteEmail('');
      setInviteDept('');
      fetchStaff();
    } catch (err: any) {
      setError(err.message || 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const handleApprove = async (staffId: string) => {
    try {
      await healthRoleService.approveStaff(staffId);
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSuspend = async (staffId: string) => {
    try {
      await healthRoleService.suspendStaff(staffId);
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredStaff = staff.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = s.profile?.full_name || '';
    const email = s.profile?.email || '';
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  const activeCount = staff.filter((s) => s.status === 'active').length;
  const pendingCount = staff.filter((s) => s.onboarding_status === 'pending').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Management</Text>
        <TouchableOpacity onPress={() => setShowInvite(true)}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{staff.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Search size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Status Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, statusFilter === f && styles.filterChipActive]}
              onPress={() => setStatusFilter(f)}
            >
              <Text style={[styles.filterText, statusFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Role Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, roleFilter === 'All Roles' && styles.filterChipActive]}
            onPress={() => setRoleFilter('All Roles')}
          >
            <Text style={[styles.filterText, roleFilter === 'All Roles' && styles.filterTextActive]}>All Roles</Text>
          </TouchableOpacity>
          {ROLE_FILTERS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.filterChip, roleFilter === r && styles.filterChipActive]}
              onPress={() => setRoleFilter(r)}
            >
              <View style={[styles.roleDot, { backgroundColor: ROLE_COLORS[r] }]} />
              <Text style={[styles.filterText, roleFilter === r && styles.filterTextActive]}>
                {ROLE_DISPLAY_NAMES[r]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Error */}
        {error && (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0066cc" />
          </View>
        )}

        {/* No Facility */}
        {!loading && !facilityId && (
          <View style={styles.emptyState}>
            <Building2 size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Facility Assigned</Text>
            <Text style={styles.emptyDesc}>You need to be assigned to a facility to manage staff.</Text>
          </View>
        )}

        {/* Staff List */}
        {!loading && facilityId && filteredStaff.length === 0 && (
          <View style={styles.emptyState}>
            <Users size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No staff members found</Text>
            <Text style={styles.emptyDesc}>Tap + to invite your first team member.</Text>
          </View>
        )}

        {!loading && filteredStaff.map((member) => (
          <View key={member.id} style={styles.staffCard}>
            <View style={styles.staffHeader}>
              <View style={[styles.staffAvatar, { backgroundColor: ROLE_COLORS[member.role] + '20' }]}>
                <Text style={[styles.staffAvatarText, { color: ROLE_COLORS[member.role] }]}>
                  {(member.profile?.full_name || member.profile?.email || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{member.profile?.full_name || member.profile?.email || 'Unknown'}</Text>
                <View style={styles.staffMetaRow}>
                  <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[member.role] + '15' }]}>
                    <View style={[styles.roleDot, { backgroundColor: ROLE_COLORS[member.role] }]} />
                    <Text style={[styles.roleText, { color: ROLE_COLORS[member.role] }]}>
                      {ROLE_DISPLAY_NAMES[member.role]}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: member.status === 'active' ? '#22c55e15' : member.status === 'suspended' ? '#dc262615' : '#f9731615' }]}>
                    <Text style={[styles.statusText, { color: member.status === 'active' ? '#22c55e' : member.status === 'suspended' ? '#dc2626' : '#f97316' }]}>
                      {member.status}
                    </Text>
                  </View>
                </View>
                {member.department && (
                  <Text style={styles.deptText}>{member.department}</Text>
                )}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.staffActions}>
              {member.onboarding_status === 'pending' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e' }]} onPress={() => handleApprove(member.id)}>
                  <UserCheck size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>Approve</Text>
                </TouchableOpacity>
              )}
              {member.status === 'active' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dc2626' }]} onPress={() => handleSuspend(member.id)}>
                  <UserX size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>Suspend</Text>
                </TouchableOpacity>
              )}
              {member.status === 'suspended' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0066cc' }]} onPress={() => handleApprove(member.id)}>
                  <CheckCircle2 size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>Reactivate</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Invite Modal */}
      <Modal visible={showInvite} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Staff</Text>
              <TouchableOpacity onPress={() => setShowInvite(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Email Address *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="staff@hospital.com"
              placeholderTextColor="#9ca3af"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.modalLabel}>Role *</Text>
            <View style={styles.roleGrid}>
              {ROLE_FILTERS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, inviteRole === r && styles.roleChipActive]}
                  onPress={() => setInviteRole(r)}
                >
                  <View style={[styles.roleDot, { backgroundColor: ROLE_COLORS[r] }]} />
                  <Text style={[styles.roleChipText, inviteRole === r && styles.roleChipTextActive]}>
                    {ROLE_DISPLAY_NAMES[r]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Department</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Cardiology"
              placeholderTextColor="#9ca3af"
              value={inviteDept}
              onChangeText={setInviteDept}
            />

            <TouchableOpacity
              style={[styles.inviteBtn, (!inviteEmail.trim() || inviting) && styles.inviteBtnDisabled]}
              onPress={handleInvite}
              disabled={!inviteEmail.trim() || inviting}
            >
              {inviting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Mail size={16} color="#fff" />
                  <Text style={styles.inviteBtnText}>Send Invitation</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#1e3a5f', paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  statNumber: { fontSize: 22, fontWeight: '700', color: '#1f2937' },
  statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1f2937' },
  filterRow: { marginBottom: 10 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', marginRight: 8 },
  filterChipActive: { backgroundColor: '#1e3a5f', borderColor: '#1e3a5f' },
  filterText: { fontSize: 12, fontWeight: '500', color: '#4b5563' },
  filterTextActive: { color: '#fff' },
  roleDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, gap: 8, marginBottom: 12, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { fontSize: 12, color: '#dc2626', flex: 1 },
  center: { padding: 40, alignItems: 'center' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#6b7280', marginTop: 12 },
  emptyDesc: { fontSize: 12, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
  staffCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  staffHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  staffAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  staffAvatarText: { fontSize: 16, fontWeight: '700' },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  staffMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  roleText: { fontSize: 10, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '600' },
  deptText: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  staffActions: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  modalInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1f2937' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  roleChipActive: { backgroundColor: '#1e3a5f', borderColor: '#1e3a5f' },
  roleChipText: { fontSize: 11, fontWeight: '500', color: '#4b5563', marginLeft: 6 },
  roleChipTextActive: { color: '#fff' },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1e3a5f', borderRadius: 10, paddingVertical: 14, marginTop: 20 },
  inviteBtnDisabled: { backgroundColor: '#d1d5db' },
  inviteBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
