
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { useHospitalAdmin } from '@/lib/health/hooks/useHospitalAdmin';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import {
  BedDouble, Users, UserPlus, LogOut, TrendingUp, Activity, ChevronRight,
  AlertCircle, Stethoscope, DollarSign, MoreHorizontal
} from 'lucide-react-native';

const COLORS = {
  primary: '#0A4DA6', primaryLight: '#E8F0FE', success: '#10B981', warning: '#F59E0B',
  danger: '#EF4444', text: '#1F2937', textLight: '#6B7280', border: '#E5E7EB',
  background: '#F3F4F6', white: '#FFFFFF'
};

export default function HospitalAdminScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { role, selectedFacilityId } = useHealthRole();
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const { stats, recentAdmissions, recentDischarges, staffOnDuty, loading, error, refresh } = useHospitalAdmin(selectedFacilityId);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleQuickAction = useCallback((action: string) => {
    setShowQuickMenu(false);
    switch (action) {
      case 'admit': router.push('/(os)/health/hospital-admin/admissions'); break;
      case 'discharge': router.push('/(os)/health/hospital-admin/discharges'); break;
      case 'add-staff': router.push('/(os)/health/hospital-admin/staff'); break;
      case 'add-bed': router.push('/(os)/health/hospital-admin/beds'); break;
      case 'revenue': router.push('/(os)/health/hospital-admin/revenue'); break;
    }
  }, [router]);

  const handleCardPress = useCallback((route: string) => {
    router.push(route as any);
  }, [router]);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading hospital dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <AlertCircle size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Hospital Admin</Text>
          <Text style={styles.headerSubtitle}>{role?.facilityName || 'General Hospital'}</Text>
        </View>
        <TouchableOpacity style={styles.quickMenuButton} onPress={() => setShowQuickMenu(!showQuickMenu)}>
          <MoreHorizontal size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {showQuickMenu && (
        <View style={styles.quickMenu}>
          <TouchableOpacity style={styles.quickMenuItem} onPress={() => handleQuickAction('admit')}>
            <UserPlus size={18} color={COLORS.primary} />
            <Text style={styles.quickMenuText}>Admit Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickMenuItem} onPress={() => handleQuickAction('discharge')}>
            <LogOut size={18} color={COLORS.success} />
            <Text style={styles.quickMenuText}>Discharge Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickMenuItem} onPress={() => handleQuickAction('add-staff')}>
            <Users size={18} color={COLORS.warning} />
            <Text style={styles.quickMenuText}>Add Staff</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickMenuItem} onPress={() => handleQuickAction('add-bed')}>
            <BedDouble size={18} color={COLORS.danger} />
            <Text style={styles.quickMenuText}>Add Bed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickMenuItem} onPress={() => handleQuickAction('revenue')}>
            <DollarSign size={18} color={COLORS.success} />
            <Text style={styles.quickMenuText}>Revenue Report</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statCard} onPress={() => handleCardPress('/(os)/health/hospital-admin/beds')}>
            <BedDouble size={24} color={COLORS.primary} />
            <Text style={styles.statNumber}>{stats?.totalBeds || 0}</Text>
            <Text style={styles.statLabel}>Total Beds</Text>
            <Text style={styles.statSub}>{stats?.occupiedBeds || 0} occupied</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} onPress={() => handleCardPress('/(os)/health/hospital-admin/staff')}>
            <Users size={24} color={COLORS.success} />
            <Text style={styles.statNumber}>{stats?.totalStaff || 0}</Text>
            <Text style={styles.statLabel}>Staff</Text>
            <Text style={styles.statSub}>{stats?.staffOnDuty || 0} on duty</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} onPress={() => handleCardPress('/(os)/health/hospital-admin/admissions')}>
            <Activity size={24} color={COLORS.warning} />
            <Text style={styles.statNumber}>{stats?.todayAdmissions || 0}</Text>
            <Text style={styles.statLabel}>Admissions</Text>
            <Text style={styles.statSub}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} onPress={() => handleCardPress('/(os)/health/hospital-admin/revenue')}>
            <TrendingUp size={24} color={COLORS.danger} />
            <Text style={styles.statNumber}>${(stats?.todayRevenue || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={styles.statSub}>Today</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(os)/health/hospital-admin/admissions')}>
            <View style={[styles.actionIcon, { backgroundColor: COLORS.primaryLight }]}>
              <UserPlus size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Admit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(os)/health/hospital-admin/discharges')}>
            <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
              <LogOut size={22} color={COLORS.success} />
            </View>
            <Text style={styles.actionText}>Discharge</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(os)/health/hospital-admin/staff')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Users size={22} color={COLORS.warning} />
            </View>
            <Text style={styles.actionText}>Staff</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(os)/health/hospital-admin/beds')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
              <BedDouble size={22} color={COLORS.danger} />
            </View>
            <Text style={styles.actionText}>Beds</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Admissions</Text>
        {recentAdmissions?.length === 0 ? (
          <View style={styles.emptyState}><Text style={styles.emptyText}>No recent admissions</Text></View>
        ) : recentAdmissions?.map((admission: any) => (
          <TouchableOpacity key={admission.id} style={styles.listItem} onPress={() => router.push(`/(os)/health/hospital-admin/admissions?id=${admission.id}`)}>
            <View style={styles.listItemLeft}>
              <View style={[styles.avatar, { backgroundColor: COLORS.primaryLight }]}>
                <Text style={styles.avatarText}>{admission.patient_name?.charAt(0) || '?'}</Text>
              </View>
              <View>
                <Text style={styles.listItemTitle}>{admission.patient_name}</Text>
                <Text style={styles.listItemSubtitle}>{admission.ward} - Bed {admission.bed_number}</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Recent Discharges</Text>
        {recentDischarges?.length === 0 ? (
          <View style={styles.emptyState}><Text style={styles.emptyText}>No recent discharges</Text></View>
        ) : recentDischarges?.map((discharge: any) => (
          <TouchableOpacity key={discharge.id} style={styles.listItem} onPress={() => router.push(`/(os)/health/hospital-admin/discharges?id=${discharge.id}`)}>
            <View style={styles.listItemLeft}>
              <View style={[styles.avatar, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.avatarText, { color: COLORS.success }]}>{discharge.patient_name?.charAt(0) || '?'}</Text>
              </View>
              <View>
                <Text style={styles.listItemTitle}>{discharge.patient_name}</Text>
                <Text style={styles.listItemSubtitle}>Discharged {new Date(discharge.discharge_date).toLocaleDateString()}</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Staff on Duty</Text>
        {staffOnDuty?.length === 0 ? (
          <View style={styles.emptyState}><Text style={styles.emptyText}>No staff currently on duty</Text></View>
        ) : staffOnDuty?.map((staff: any) => (
          <View key={staff.id} style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <View style={[styles.avatar, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.avatarText, { color: COLORS.warning }]}>{staff.name?.charAt(0) || '?'}</Text>
              </View>
              <View>
                <Text style={styles.listItemTitle}>{staff.name}</Text>
                <Text style={styles.listItemSubtitle}>{staff.role} - {staff.department}</Text>
              </View>
            </View>
            <View style={styles.dutyBadge}>
              <View style={styles.dutyDot} />
              <Text style={styles.dutyText}>On Duty</Text>
            </View>
          </View>
        ))}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textLight },
  errorText: { marginTop: 12, fontSize: 14, color: COLORS.danger, textAlign: 'center' },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: 8 },
  retryText: { color: COLORS.white, fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  quickMenuButton: { padding: 8, borderRadius: 8, backgroundColor: COLORS.primaryLight },
  quickMenu: { backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 8, borderRadius: 12, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  quickMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  quickMenuText: { marginLeft: 10, fontSize: 14, color: COLORS.text },
  scroll: { flex: 1 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  statCard: { width: '48%', backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  statNumber: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginTop: 8 },
  statLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  statSub: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginHorizontal: 16, marginTop: 20, marginBottom: 8 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 8 },
  actionButton: { alignItems: 'center', width: 70 },
  actionIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionText: { marginTop: 6, fontSize: 12, color: COLORS.text, fontWeight: '500' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  listItemLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  listItemTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  listItemSubtitle: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  dutyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  dutyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success, marginRight: 4 },
  dutyText: { fontSize: 11, color: COLORS.success, fontWeight: '600' },
  emptyState: { backgroundColor: COLORS.white, marginHorizontal: 16, padding: 24, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  emptyText: { color: COLORS.textLight, fontSize: 14 },
  bottomPadding: { height: 40 }
});
