// @ts-nocheck
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, 
  ActivityIndicator, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { 
  ChevronLeft, Users, Search, Filter, ShieldCheck, ShieldAlert, 
  UserX, CheckCircle2, XCircle, MoreVertical, Stethoscope, 
  Ambulance, Pill, CreditCard, Building2, Leaf, ClipboardList 
} from 'lucide-react-native';

const ROLE_ICONS: Record<string, any> = {
  doctor: Stethoscope,
  nurse: Stethoscope,
  pharmacist: Pill,
  ambulance_driver: Ambulance,
  cashier: CreditCard,
  admin: Building2,
  herbalist: Leaf,
  lab_tech: ClipboardList,
};

const ROLE_COLORS: Record<string, string> = {
  doctor: '#059669',
  nurse: '#0891B2',
  pharmacist: '#7C3AED',
  ambulance_driver: '#DC2626',
  cashier: '#D97706',
  admin: '#4F46E5',
  herbalist: '#15803D',
  lab_tech: '#BE185D',
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: '#D1FAE5', color: '#059669', label: 'Active' },
  pending: { bg: '#FEF3C7', color: '#D97706', label: 'Pending' },
  suspended: { bg: '#FEE2E2', color: '#DC2626', label: 'Suspended' },
  inactive: { bg: '#F3F4F6', color: '#6B7280', label: 'Inactive' },
};

export default function StaffManagementScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  // In real app, get facility_id from admin profile
  const { 
    staff, loading, error, filters, updateFilters, 
    updateStaffStatus, verifyStaff, deleteStaff, refresh, 
    roles, departments, stats 
  } = useStaffManagement();

  const handleVerify = (id: string, name?: string) => {
    Alert.alert(
      'Verify Staff',
      `Approve and verify ${name || 'this staff member'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Verify', 
          style: 'default',
          onPress: async () => {
            await verifyStaff(id);
          }
        },
      ]
    );
  };

  const handleSuspend = (id: string, name?: string) => {
    Alert.alert(
      'Suspend Staff',
      `Suspend ${name || 'this staff member'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Suspend', 
          style: 'destructive',
          onPress: async () => {
            await updateStaffStatus(id, 'suspended');
          }
        },
      ]
    );
  };

  const handleDelete = (id: string, name?: string) => {
    Alert.alert(
      'Remove Staff',
      `Permanently remove ${name || 'this staff member'}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            await deleteStaff(id);
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Management</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterBtn}>
          <Filter size={18} color={showFilters ? '#2563EB' : '#6B7280'} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBox label="Total" value={stats.total} color="#2563EB" />
        <StatBox label="Active" value={stats.active} color="#059669" />
        <StatBox label="Pending" value={stats.pending} color="#D97706" />
        <StatBox label="Verified" value={stats.verified} color="#7C3AED" />
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Search size={16} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search staff..."
          value={filters.search || ''}
          onChangeText={v => updateFilters({ search: v })}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
            <FilterChip label="All Roles" active={!filters.role} onPress={() => updateFilters({ role: undefined })} />
            {roles.map((r: any) => (
              <FilterChip key={r} label={r} active={filters.role === r} onPress={() => updateFilters({ role: r })} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
            <FilterChip label="All Status" active={!filters.status} onPress={() => updateFilters({ status: undefined })} />
            {['active', 'pending', 'suspended', 'inactive'].map((s: any) => (
              <FilterChip key={s} label={s} active={filters.status === s} onPress={() => updateFilters({ status: s })} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Staff List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#2563EB" />
          <Text style={styles.loadingText}>Loading staff...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <XCircle size={24} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {staff.map((member: any) => {
            const RoleIcon = ROLE_ICONS[member.role] || Users;
            const roleColor = ROLE_COLORS[member.role] || '#6B7280';
            const statusStyle = STATUS_STYLES[member.status] || STATUS_STYLES.inactive;
            const isSelected = selectedStaff === member.id;

            return (
              <TouchableOpacity
                key={member.id}
                style={[styles.staffCard, isSelected && styles.staffCardActive]}
                onPress={() => setSelectedStaff(isSelected ? null : member.id)}
                activeOpacity={0.8}
              >
                <View style={styles.staffHeader}>
                  <View style={[styles.avatarCircle, { backgroundColor: roleColor + '20' }]}>
                    <RoleIcon size={18} color={roleColor} />
                  </View>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{member.full_name || 'Unnamed'}</Text>
                    <Text style={styles.staffRole}>{member.role.replace('_', ' ').toUpperCase()}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
                  </View>
                </View>

                <View style={styles.staffMeta}>
                  {member.department && (
                    <Text style={styles.metaText}>Dept: {member.department}</Text>
                  )}
                  {member.license_number && (
                    <Text style={styles.metaText}>License: {member.license_number}</Text>
                  )}
                  {member.years_experience !== undefined && (
                    <Text style={styles.metaText}>{member.years_experience} yrs exp</Text>
                  )}
                  {member.total_patients !== undefined && (
                    <Text style={styles.metaText}>{member.total_patients} patients</Text>
                  )}
                </View>

                {member.is_verified && (
                  <View style={styles.verifiedRow}>
                    <ShieldCheck size={14} color="#059669" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}

                {/* Action Menu */}
                {isSelected && (
                  <View style={styles.actionRow}>
                    {!member.is_verified && member.status === 'pending' && (
                      <ActionButton 
                        icon={CheckCircle2} 
                        label="Verify" 
                        color="#059669" 
                        bg="#D1FAE5"
                        onPress={() => handleVerify(member.id, member.full_name)}
                      />
                    )}
                    {member.status !== 'suspended' && (
                      <ActionButton 
                        icon={ShieldAlert} 
                        label="Suspend" 
                        color="#D97706" 
                        bg="#FEF3C7"
                        onPress={() => handleSuspend(member.id, member.full_name)}
                      />
                    )}
                    {member.status === 'suspended' && (
                      <ActionButton 
                        icon={CheckCircle2} 
                        label="Reactivate" 
                        color="#2563EB" 
                        bg="#DBEAFE"
                        onPress={() => updateStaffStatus(member.id, 'active')}
                      />
                    )}
                    <ActionButton 
                      icon={UserX} 
                      label="Remove" 
                      color="#DC2626" 
                      bg="#FEE2E2"
                      onPress={() => handleDelete(member.id, member.full_name)}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {staff.length === 0 && (
            <View style={styles.emptyBox}>
              <Users size={32} color="#CBD5E1" />
              <Text style={styles.emptyText}>No staff found</Text>
              <Text style={styles.emptySub}>Try adjusting your filters</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statBox, { borderTopColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity 
      style={[styles.filterChip, active && styles.filterChipActive]} 
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </Text>
    </TouchableOpacity>
  );
}

function ActionButton({ icon: Icon, label, color, bg, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: bg }]} onPress={onPress}>
      <Icon size={14} color={color} />
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
  filterBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10, alignItems: 'center', borderTopWidth: 3 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1F2937' },
  filterPanel: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChips: { gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  filterChipActive: { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
  filterChipText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  filterChipTextActive: { color: '#2563EB', fontWeight: '700' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, fontSize: 13, color: '#6B7280' },
  errorBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { marginTop: 8, fontSize: 14, color: '#DC2626', textAlign: 'center' },
  retryBtn: { marginTop: 12, backgroundColor: '#DBEAFE', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#2563EB', fontWeight: '600' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  staffCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: '#E5E7EB' },
  staffCardActive: { borderColor: '#2563EB' },
  staffHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  staffInfo: { flex: 1, marginLeft: 12 },
  staffName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  staffRole: { fontSize: 11, color: '#9CA3AF', marginTop: 2, textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  staffMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  metaText: { fontSize: 11, color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  verifiedText: { fontSize: 12, color: '#059669', fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#94A3B8', marginTop: 8 },
  emptySub: { fontSize: 13, color: '#CBD5E1', marginTop: 4 },
});
