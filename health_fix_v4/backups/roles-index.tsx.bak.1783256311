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
  Shield,
  Globe,
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
  const { staffRecord, facilityId, isSystemAdmin, role } = useHealthRole();
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
  const [error, setError] = useState<string | null>(null);

  // FIXED: system_admin sees ALL staff across ALL facilities
  const canViewStaff = isSystemAdmin || !!facilityId;
  const viewScope = isSystemAdmin ? 'global' : 'facility';

  const fetchStaff = useCallback(async () => {
    if (!canViewStaff) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const filters = {
        status: statusFilter,
        role: roleFilter,
        search: searchQuery,
      };

      let data;
      if (isSystemAdmin) {
        // System admin: fetch ALL staff across ALL facilities
        data = await healthRoleService.getAllStaffForSystemAdmin(filters);
      } else if (facilityId) {
        // Facility-specific: fetch staff for this facility only
        data = await healthRoleService.getStaffByFacility(facilityId, filters);
      }

      setStaff(data || []);
    } catch (err: any) {
      console.error('[StaffManagement] Error fetching staff:', err);
      setError(err.message || 'Failed to load staff');
      setStaff([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canViewStaff, isSystemAdmin, facilityId, statusFilter, roleFilter, searchQuery]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStaff();
  }, [fetchStaff]);

  const handleInvite = async () => {
    if (!inviteEmail || !inviteRole) return;
    try {
      await healthRoleService.inviteStaff({
        email: inviteEmail,
        role: inviteRole,
        department: inviteDept,
        facilityId: facilityId || undefined,
      });
      setShowInvite(false);
      setInviteEmail('');
      setInviteDept('');
      fetchStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    }
  };

  const handleApprove = async (staffId: string) => {
    try {
      await healthRoleService.approveStaff(staffId);
      fetchStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to approve staff');
    }
  };

  const handleSuspend = async (staffId: string) => {
    try {
      await healthRoleService.suspendStaff(staffId);
      fetchStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to suspend staff');
    }
  };

  const filteredStaff = staff.filter((s) => {
    if (statusFilter !== 'All' && s.status !== statusFilter) return false;
    if (roleFilter !== 'All Roles' && s.role !== roleFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (s.user_full_name || s.user_email || '').toLowerCase();
      const dept = (s.department || '').toLowerCase();
      const spec = (s.specialization || '').toLowerCase();
      const facName = (s.facility_name || '').toLowerCase();
      return name.includes(q) || dept.includes(q) || spec.includes(q) || facName.includes(q);
    }
    return true;
  });

  const activeCount = staff.filter((s) => s.status === 'active').length;
  const pendingCount = staff.filter((s) => s.status === 'pending').length;
  const totalCount = staff.length;

  if (!canViewStaff) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#1e3a5f" />
          </TouchableOpacity>
          <Text style={styles.title}>Staff Management</Text>
        </View>
        <View style={styles.emptyState}>
          <AlertCircle size={48} color="#94a3b8" />
          <Text style={styles.emptyTitle}>No Facility Assigned</Text>
          <Text style={styles.emptyText}>
            You need to be assigned to a facility or have system admin privileges to manage staff.
          </Text>
          <TouchableOpacity
            style={styles.onboardBtn}
            onPress={() => router.push('/health/facility-onboard')}
          >
            <Building2 size={18} color="#fff" />
            <Text style={styles.onboardBtnText}>Register a Facility</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1e3a5f" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Staff Management</Text>
          {isSystemAdmin && (
            <View style={styles.adminBadge}>
              <Shield size={12} color="#fff" />
              <Text style={styles.adminBadgeText}>System Admin</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => setShowInvite(true)} style={styles.addBtn}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Scope indicator for system admin */}
      {isSystemAdmin && (
        <View style={styles.scopeBanner}>
          <Globe size={16} color="#0066cc" />
          <Text style={styles.scopeText}>Viewing ALL staff across ALL facilities</Text>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: '#ecfdf5' }]}>
          <Text style={[styles.statNumber, { color: '#059669' }]}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#fffbeb' }]}>
          <Text style={[styles.statNumber, { color: '#d97706' }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#eff6ff' }]}>
          <Text style={[styles.statNumber, { color: '#2563eb' }]}>{totalCount}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Search size={18} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, department, specialization..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, statusFilter === f && styles.filterChipActive]}
            onPress={() => setStatusFilter(f)}
          >
            <Text style={[styles.filterText, statusFilter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, roleFilter === 'All Roles' && styles.filterChipActive]}
          onPress={() => setRoleFilter('All Roles')}
        >
          <Text style={[styles.filterText, roleFilter === 'All Roles' && styles.filterTextActive]}>
            All Roles
          </Text>
        </TouchableOpacity>
        {ROLE_FILTERS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.filterChip, roleFilter === r && styles.filterChipActive]}
            onPress={() => setRoleFilter(r)}
          >
            <Text style={[styles.filterText, roleFilter === r && styles.filterTextActive]}>
              {ROLE_DISPLAY_NAMES[r] || r}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <AlertCircle size={16} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <X size={16} color="#dc2626" />
          </TouchableOpacity>
        </View>
      )}

      {/* Staff List */}
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#0066cc" style={{ marginTop: 40 }} />
        ) : filteredStaff.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Staff Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'No staff match your search criteria.'
                : 'No staff members found. Invite staff to get started.'}
            </Text>
          </View>
        ) : (
          filteredStaff.map((s) => (
            <View key={s.id} style={styles.staffCard}>
              <View style={styles.staffHeader}>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>
                    {s.user_full_name || s.user_email || 'Unknown'}
                  </Text>
                  <Text style={styles.staffEmail}>{s.user_email}</Text>
                  {isSystemAdmin && s.facility_name && (
                    <View style={styles.facilityTag}>
                      <Building2 size={12} color="#0066cc" />
                      <Text style={styles.facilityTagText}>{s.facility_name}</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[s.role] + '20' }]}>
                  <Text style={[styles.roleText, { color: ROLE_COLORS[s.role] }]}>
                    {ROLE_DISPLAY_NAMES[s.role] || s.role}
                  </Text>
                </View>
              </View>

              <View style={styles.staffDetails}>
                {s.department && (
                  <Text style={styles.detailText}>Dept: {s.department}</Text>
                )}
                {s.specialization && (
                  <Text style={styles.detailText}>Spec: {s.specialization}</Text>
                )}
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: s.status === 'active' ? '#22c55e' : s.status === 'pending' ? '#f59e0b' : '#ef4444' }]} />
                  <Text style={styles.statusText}>{s.status}</Text>
                  {s.is_on_duty && (
                    <View style={styles.onDutyBadge}>
                      <Text style={styles.onDutyText}>On Duty</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.staffActions}>
                {s.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#ecfdf5' }]}
                    onPress={() => handleApprove(s.id)}
                  >
                    <UserCheck size={16} color="#059669" />
                    <Text style={[styles.actionText, { color: '#059669' }]}>Approve</Text>
                  </TouchableOpacity>
                )}
                {s.status === 'active' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]}
                    onPress={() => handleSuspend(s.id)}
                  >
                    <UserX size={16} color="#dc2626" />
                    <Text style={[styles.actionText, { color: '#dc2626' }]}>Suspend</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#eff6ff' }]}
                  onPress={() => router.push(`/health/staff/${s.id}`)}
                >
                  <Text style={[styles.actionText, { color: '#2563eb' }]}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Invite Modal */}
      <Modal visible={showInvite} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Staff</Text>
              <TouchableOpacity onPress={() => setShowInvite(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="staff@hospital.com"
              placeholderTextColor="#94a3b8"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Role</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleSelector}>
              {ROLE_FILTERS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, inviteRole === r && styles.roleChipActive]}
                  onPress={() => setInviteRole(r)}
                >
                  <Text style={[styles.roleChipText, inviteRole === r && styles.roleChipTextActive]}>
                    {ROLE_DISPLAY_NAMES[r] || r}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Department</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Cardiology, Emergency, Pharmacy"
              placeholderTextColor="#94a3b8"
              value={inviteDept}
              onChangeText={setInviteDept}
            />

            <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite}>
              <Mail size={18} color="#fff" />
              <Text style={styles.inviteBtnText}>Send Invitation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerCenter: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', color: '#1e3a5f' },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066cc',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
  },
  adminBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  addBtn: {
    backgroundColor: '#0066cc',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  scopeText: { fontSize: 12, color: '#0066cc', fontWeight: '500' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchInput: { flex: 1, height: 44, fontSize: 14, color: '#1e293b' },
  filterRow: { paddingHorizontal: 16, marginBottom: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#0066cc', borderColor: '#0066cc' },
  filterText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: { flex: 1, fontSize: 13, color: '#dc2626' },
  listContainer: { padding: 16, paddingBottom: 40 },
  staffCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  staffEmail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  facilityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  facilityTagText: { fontSize: 11, color: '#0066cc', fontWeight: '500' },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: { fontSize: 11, fontWeight: '600' },
  staffDetails: { marginBottom: 12 },
  detailText: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  onDutyBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  onDutyText: { fontSize: 10, color: '#059669', fontWeight: '600' },
  staffActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionText: { fontSize: 12, fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#64748b', marginTop: 16 },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
  onboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  onboardBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  roleSelector: { marginVertical: 8 },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  roleChipActive: { backgroundColor: '#0066cc' },
  roleChipText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  roleChipTextActive: { color: '#fff' },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066cc',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  inviteBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
