import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Heart,
  Calendar,
  FileText,
  Search,
  Pill,
  FlaskConical,
  Shield,
  Wallet,
  Baby,
  AlertTriangle,
  Users,
  Building2,
  Settings,
  BarChart3,
  Landmark,
  Stethoscope,
  Clock,
  BedDouble,
  Truck,
  CreditCard,
  UserCheck,
  Calculator,
  ClipboardList,
  Phone,
  LogIn,
  LogOut,
  ChevronRight,
  Briefcase,
  MapPin,
} from 'lucide-react-native';
import { useHealthRole } from '@/lib/health/hooks';
import { healthRoleService, ROLE_DISPLAY_NAMES, ROLE_COLORS } from '@/lib/health/services';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import type { HealthStaffRecord } from '@/lib/health/services';

// ===== PATIENT QUICK ACTIONS =====
const PATIENT_ACTIONS = [
  { icon: Heart, label: 'My Vitals', route: '/health/vitals', color: '#ef4444' },
  { icon: Calendar, label: 'Appointments', route: '/health/appointments', color: '#22c55e' },
  { icon: FileText, label: 'Medical Records', route: '/health/records', color: '#3b82f6' },
  { icon: Pill, label: 'Prescriptions', route: '/health/prescriptions', color: '#a855f7' },
  { icon: FlaskConical, label: 'Lab Results', route: '/health/lab-results', color: '#06b6d4' },
  { icon: Search, label: 'Find Care', route: '/health/find-care', color: '#f97316' },
  { icon: Shield, label: 'Insurance', route: '/health/insurance', color: '#6366f1' },
  { icon: Wallet, label: 'Health Wallet', route: '/health/wallet', color: '#10b981' },
  { icon: Baby, label: 'Child Health', route: '/health/children', color: '#ec4899' },
  { icon: AlertTriangle, label: 'Emergency SOS', route: '/health/emergency-card', color: '#dc2626' },
];

// ===== SYSTEM ADMIN ACTIONS =====
const ADMIN_ACTIONS = [
  { icon: Settings, label: 'System', route: '/health/system/settings', color: '#1e3a5f', desc: 'Configure Health OS' },
  { icon: Building2, label: 'Facilities', route: '/health/find-care', color: '#0066cc', desc: 'Manage hospitals & clinics' },
  { icon: Users, label: 'User Roles', route: '/health/system/roles', color: '#00a86b', desc: 'Staff & permissions' },
  { icon: ClipboardList, label: 'Audit', route: '/health/system/audit', color: '#9333ea', desc: 'Activity logs' },
  { icon: BarChart3, label: 'Analytics', route: '/health/system/analytics', color: '#0891b2', desc: 'Reports & insights' },
  { icon: Landmark, label: 'Government', route: '/health/government', color: '#ea580c', desc: 'Compliance & regs' },
];

// ===== DOCTOR ACTIONS =====
const DOCTOR_ACTIONS = [
  { icon: Users, label: 'Patient Queue', route: '/health/doctor/queue', color: '#0066cc' },
  { icon: Calendar, label: 'Schedule', route: '/health/doctor/schedule', color: '#22c55e' },
  { icon: Pill, label: 'Prescribe', route: '/health/doctor/prescribe', color: '#a855f7' },
  { icon: FlaskConical, label: 'Lab Orders', route: '/health/doctor/lab-orders', color: '#06b6d4' },
  { icon: Phone, label: 'Telemedicine', route: '/health/telemedicine', color: '#f97316' },
  { icon: Wallet, label: 'Earnings', route: '/health/doctor/earnings', color: '#10b981' },
];

// ===== NURSE ACTIONS =====
const NURSE_ACTIONS = [
  { icon: Users, label: 'Patient Queue', route: '/health/nurse/queue', color: '#0066cc' },
  { icon: Heart, label: 'Vitals Entry', route: '/health/vitals', color: '#ef4444' },
  { icon: BedDouble, label: 'Bed Mgmt', route: '/health/nurse/beds', color: '#22c55e' },
  { icon: Pill, label: 'Medication', route: '/health/nurse/medication', color: '#a855f7' },
  { icon: ClipboardList, label: 'Handover', route: '/health/nurse/handover', color: '#06b6d4' },
];

// ===== PHARMACIST ACTIONS =====
const PHARMACIST_ACTIONS = [
  { icon: Pill, label: 'Rx Queue', route: '/health/pharmacy/queue', color: '#a855f7' },
  { icon: Building2, label: 'Inventory', route: '/health/pharmacy/inventory', color: '#22c55e' },
  { icon: ClipboardList, label: 'Dispense', route: '/health/pharmacy/dispense', color: '#0066cc' },
  { icon: AlertTriangle, label: 'Interactions', route: '/health/pharmacy/interactions', color: '#dc2626' },
  { icon: Truck, label: 'Suppliers', route: '/health/pharmacy/suppliers', color: '#f97316' },
];

// ===== LAB TECH ACTIONS =====
const LAB_TECH_ACTIONS = [
  { icon: FlaskConical, label: 'Test Queue', route: '/health/lab/queue', color: '#06b6d4' },
  { icon: FileText, label: 'Results', route: '/health/lab/results', color: '#22c55e' },
  { icon: AlertTriangle, label: 'Critical', route: '/health/lab/critical', color: '#dc2626' },
  { icon: Settings, label: 'Equipment', route: '/health/lab/equipment', color: '#6366f1' },
];

// ===== HOSPITAL ADMIN ACTIONS =====
const HOSPITAL_ADMIN_ACTIONS = [
  { icon: BedDouble, label: 'Bed Occupancy', route: '/health/hospital-admin/beds', color: '#0066cc' },
  { icon: Users, label: 'Staff Mgmt', route: '/health/system/roles', color: '#00a86b' },
  { icon: Wallet, label: 'Revenue', route: '/health/hospital-admin/revenue', color: '#10b981' },
  { icon: Shield, label: 'Insurance', route: '/health/insurance', color: '#6366f1' },
  { icon: Settings, label: 'Settings', route: '/health/system/settings', color: '#1e3a5f' },
];

// ===== CASHIER ACTIONS =====
const CASHIER_ACTIONS = [
  { icon: CreditCard, label: 'Payments', route: '/health/cashier/payments', color: '#10b981' },
  { icon: Shield, label: 'Insurance', route: '/health/cashier/insurance', color: '#6366f1' },
  { icon: FileText, label: 'Invoices', route: '/health/cashier/invoices', color: '#0066cc' },
  { icon: BarChart3, label: 'Daily Revenue', route: '/health/cashier/revenue', color: '#22c55e' },
];

// ===== HR MANAGER ACTIONS =====
const HR_ACTIONS = [
  { icon: Wallet, label: 'Payroll', route: '/health/hr/payroll', color: '#10b981' },
  { icon: UserCheck, label: 'Attendance', route: '/health/hr/attendance', color: '#0066cc' },
  { icon: Clock, label: 'Shifts', route: '/health/hr/shifts', color: '#22c55e' },
  { icon: Calendar, label: 'Leave', route: '/health/hr/leave', color: '#f97316' },
  { icon: Users, label: 'Onboarding', route: '/health/system/roles', color: '#00a86b' },
];

// ===== ACCOUNTANT ACTIONS =====
const ACCOUNTANT_ACTIONS = [
  { icon: BarChart3, label: 'Revenue', route: '/health/accountant/revenue', color: '#10b981' },
  { icon: Calculator, label: 'Budget', route: '/health/accountant/budget', color: '#0066cc' },
  { icon: Truck, label: 'Procurement', route: '/health/accountant/procurement', color: '#f97316' },
  { icon: FileText, label: 'Tax', route: '/health/accountant/tax', color: '#22c55e' },
  { icon: Shield, label: 'Compliance', route: '/health/accountant/compliance', color: '#6366f1' },
];

// ===== AMBULANCE DRIVER ACTIONS =====
const AMBULANCE_ACTIONS = [
  { icon: Truck, label: 'Dispatches', route: '/health/ambulance/dispatches', color: '#dc2626' },
  { icon: Search, label: 'Location', route: '/health/ambulance/location', color: '#0066cc' },
  { icon: ClipboardList, label: 'Transport Log', route: '/health/ambulance/log', color: '#22c55e' },
];

// ===== RECEPTIONIST ACTIONS =====
const RECEPTIONIST_ACTIONS = [
  { icon: UserCheck, label: 'Register', route: '/health/receptionist/register', color: '#00a86b' },
  { icon: Calendar, label: 'Book Appt', route: '/health/appointments', color: '#22c55e' },
  { icon: LogIn, label: 'Check In', route: '/health/receptionist/checkin', color: '#0066cc' },
  { icon: Users, label: 'Queue', route: '/health/receptionist/queue', color: '#f97316' },
];

function getActionsForRole(role: string | null) {
  switch (role) {
    case 'system_admin': return ADMIN_ACTIONS;
    case 'doctor': return DOCTOR_ACTIONS;
    case 'nurse': return NURSE_ACTIONS;
    case 'pharmacist': return PHARMACIST_ACTIONS;
    case 'lab_technician': return LAB_TECH_ACTIONS;
    case 'hospital_admin': return HOSPITAL_ADMIN_ACTIONS;
    case 'cashier': return CASHIER_ACTIONS;
    case 'hr_manager': return HR_ACTIONS;
    case 'accountant': return ACCOUNTANT_ACTIONS;
    case 'ambulance_driver': return AMBULANCE_ACTIONS;
    case 'receptionist': return RECEPTIONIST_ACTIONS;
    default: return PATIENT_ACTIONS;
  }
}

// Role icon mapping for selection screen
const ROLE_ICON_MAP: Record<string, any> = {
  system_admin: Shield, doctor: Stethoscope, nurse: Heart,
  pharmacist: Pill, lab_technician: FlaskConical, radiologist: AlertTriangle,
  hospital_admin: Building2, cashier: CreditCard, hr_manager: Users,
  accountant: Calculator, ambulance_driver: Truck, receptionist: UserCheck,
};

function ActionCard({ icon: Icon, label, route, color, desc }: any) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[styles.actionCard, { borderColor: color + '20' }]}
      onPress={() => router.push(route as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={styles.actionLabel} numberOfLines={1}>{label}</Text>
      {desc && <Text style={styles.actionDesc} numberOfLines={1}>{desc}</Text>}
    </TouchableOpacity>
  );
}

/** Role Selection Card */
function RoleCard({ record, onSelect, isSelected }: { record: HealthStaffRecord; onSelect: () => void; isSelected: boolean }) {
  const roleColor = ROLE_COLORS[record.role] || '#6b7280';
  const roleName = ROLE_DISPLAY_NAMES[record.role] || record.role;
  const IconComp = ROLE_ICON_MAP[record.role] || Briefcase;

  return (
    <TouchableOpacity
      style={[styles.roleCard, isSelected && styles.roleCardSelected, { borderColor: isSelected ? roleColor : '#e5e7eb' }]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={styles.roleCardTop}>
        <View style={[styles.roleCardIcon, { backgroundColor: roleColor + '15' }]}>
          <IconComp size={28} color={roleColor} />
        </View>
        <View style={styles.roleCardBadge}>
          <View style={[styles.roleDot, { backgroundColor: roleColor }]} />
          <Text style={[styles.roleCardBadgeText, { color: roleColor }]}>{roleName}</Text>
        </View>
      </View>

      <Text style={styles.roleCardTitle}>{roleName}</Text>

      {record.facility_name && (
        <View style={styles.roleCardMetaRow}>
          <Building2 size={13} color="#9ca3af" />
          <Text style={styles.roleCardMeta} numberOfLines={1}>{record.facility_name}</Text>
        </View>
      )}

      {record.department && (
        <View style={styles.roleCardMetaRow}>
          <Briefcase size={13} color="#9ca3af" />
          <Text style={styles.roleCardMeta} numberOfLines={1}>{record.department}</Text>
        </View>
      )}

      {record.facility_county && (
        <View style={styles.roleCardMetaRow}>
          <MapPin size={13} color="#9ca3af" />
          <Text style={styles.roleCardMeta} numberOfLines={1}>{record.facility_county}</Text>
        </View>
      )}

      <View style={styles.roleCardFooter}>
        <Text style={[styles.roleCardStatus, { color: record.is_on_duty ? '#16a34a' : '#9ca3af' }]}>
          {record.is_on_duty ? '● On Duty' : '○ Off Duty'}
        </Text>
        <ChevronRight size={16} color="#d1d5db" />
      </View>
    </TouchableOpacity>
  );
}

export default function HealthIndex() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    allRoles,
    selectedRole,
    role,
    staffRecord,
    isLoading,
    isSystemAdmin,
    isPatient,
    error,
    selectRole,
    clearRoleSelection,
  } = useHealthRole();
  const [refreshing, setRefreshing] = React.useState(false);
  const [clocking, setClocking] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleClockInOut = async () => {
    if (!staffRecord) return;
    setClocking(true);
    try {
      if (staffRecord.is_on_duty) {
        await healthRoleService.clockOut(staffRecord.id);
      } else {
        await healthRoleService.clockIn(staffRecord.id);
      }
      onRefresh();
    } catch (e) {
      console.error('Clock error:', e);
    } finally {
      setClocking(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading your health dashboard...</Text>
      </View>
    );
  }

  // ===== ROLE SELECTION SCREEN =====
  // Show if user has multiple roles and hasn't selected one yet
  if (allRoles.length > 1 && !selectedRole) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.roleSelectionContent}>
        <View style={styles.roleSelectionHeader}>
          <Stethoscope size={40} color="#0066cc" />
          <Text style={styles.roleSelectionTitle}>Select Your Role</Text>
          <Text style={styles.roleSelectionSubtitle}>
            You have {allRoles.length} active roles. Choose which one to use for this session.
          </Text>
        </View>

        <View style={styles.roleGrid}>
          {allRoles.map((r) => (
            <RoleCard
              key={r.id}
              record={r}
              onSelect={() => selectRole(r)}
              isSelected={false}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.patientBtn} onPress={() => selectRole({} as any)}>
          <Heart size={18} color="#6b7280" />
          <Text style={styles.patientBtnText}>Continue as Patient</Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorBanner}>
            <AlertTriangle size={16} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    );
  }

  // ===== DASHBOARD (single role or already selected) =====
  const actions = getActionsForRole(role);
  const roleColor = role ? ROLE_COLORS[role] : '#22c55e';
  const roleName = role ? ROLE_DISPLAY_NAMES[role] : 'Patient';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Health OS</Text>
            <TouchableOpacity
              style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}
              onPress={allRoles.length > 1 ? clearRoleSelection : undefined}
              activeOpacity={allRoles.length > 1 ? 0.7 : 1}
            >
              <View style={[styles.roleDot, { backgroundColor: roleColor }]} />
              <Text style={[styles.roleText, { color: roleColor }]}>{roleName}</Text>
              {allRoles.length > 1 && (
                <Text style={[styles.switchRoleText, { color: roleColor }]}> (switch)</Text>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.push('/health/system/settings' as any)}>
            <Settings size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Clock In Widget (for staff only) */}
        {role && !isPatient && (
          <TouchableOpacity
            style={[styles.clockWidget, { backgroundColor: staffRecord?.is_on_duty ? '#22c55e' : '#1e3a5f' }]}
            onPress={handleClockInOut}
            disabled={clocking}
          >
            <View style={styles.clockContent}>
              {staffRecord?.is_on_duty ? (
                <>
                  <LogOut size={20} color="#fff" />
                  <Text style={styles.clockText}>Clock Out</Text>
                  <Text style={styles.clockSubtext}>On duty now</Text>
                </>
              ) : (
                <>
                  <LogIn size={20} color="#fff" />
                  <Text style={styles.clockText}>Clock In</Text>
                  <Text style={styles.clockSubtext}>Tap to start your shift</Text>
                </>
              )}
            </View>
            {clocking && <ActivityIndicator size="small" color="#fff" style={styles.clockSpinner} />}
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {isSystemAdmin ? 'System Controls' : isPatient ? 'Quick Actions' : 'My Tools'}
        </Text>
        <View style={styles.actionsGrid}>
          {actions.map((action, i) => (
            <ActionCard key={i} {...action} />
          ))}
        </View>
      </View>

      {/* Admin-only: Quick Stats */}
      {isSystemAdmin && staffRecord?.facility && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Facility Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Building2 size={20} color="#0066cc" />
              <Text style={styles.statValue}>{staffRecord.facility.name}</Text>
              <Text style={styles.statLabel}>Facility</Text>
            </View>
            <View style={styles.statCard}>
              <Shield size={20} color="#22c55e" />
              <Text style={styles.statValue}>{(staffRecord.facility as any).verification_status === 'verified' ? 'Verified' : 'Pending'}</Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
          </View>
        </View>
      )}

      {/* Recent Activity (Patient only) */}
      {isPatient && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity style={styles.activityCard} onPress={() => router.push('/health/appointments' as any)}>
            <View style={[styles.activityIcon, { backgroundColor: '#0066cc15' }]}>
              <Calendar size={18} color="#0066cc" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Dr. Kimani - General Checkup</Text>
              <Text style={styles.activityMeta}>Tue, 2:00 PM · Nairobi Hospital</Text>
            </View>
            <View style={[styles.activityBadge, { backgroundColor: '#f9731615' }]}>
              <Text style={[styles.activityBadgeText, { color: '#f97316' }]}>Upcoming</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.activityCard} onPress={() => router.push('/health/lab-results' as any)}>
            <View style={[styles.activityIcon, { backgroundColor: '#06b6d415' }]}>
              <FlaskConical size={18} color="#06b6d4" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Blood Test Results</Text>
              <Text style={styles.activityMeta}>Yesterday · City Lab</Text>
            </View>
            <View style={[styles.activityBadge, { backgroundColor: '#22c55e15' }]}>
              <Text style={[styles.activityBadgeText, { color: '#22c55e' }]}>Ready</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Error display */}
      {error && (
        <View style={styles.errorBanner}>
          <AlertTriangle size={16} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },

  // Role Selection Screen
  roleSelectionContent: { padding: 20, paddingTop: 40, paddingBottom: 40 },
  roleSelectionHeader: { alignItems: 'center', marginBottom: 28 },
  roleSelectionTitle: { fontSize: 24, fontWeight: '800', color: '#1f2937', marginTop: 16 },
  roleSelectionSubtitle: { fontSize: 14, color: '#9ca3af', marginTop: 6, textAlign: 'center', lineHeight: 20 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  roleCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleCardSelected: { borderWidth: 2 },
  roleCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  roleCardIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  roleCardBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  roleCardBadgeText: { fontSize: 10, fontWeight: '700', marginLeft: 4 },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleCardTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  roleCardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  roleCardMeta: { fontSize: 12, color: '#6b7280' },
  roleCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  roleCardStatus: { fontSize: 11, fontWeight: '600' },
  patientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
    gap: 8,
  },
  patientBtnText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },

  // Dashboard Header
  header: { backgroundColor: '#1e3a5f', paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 6 },
  roleDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  roleText: { fontSize: 12, fontWeight: '600' },
  switchRoleText: { fontSize: 11, fontWeight: '500', opacity: 0.8 },
  clockWidget: { borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clockContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  clockText: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 8 },
  clockSubtext: { color: '#fff', fontSize: 12, opacity: 0.8, marginLeft: 8 },
  clockSpinner: { marginLeft: 'auto' },

  // Dashboard Content
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '30.5%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },
  actionDesc: { fontSize: 9, color: '#9ca3af', textAlign: 'center', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  statValue: { fontSize: 13, fontWeight: '700', color: '#1f2937', marginTop: 6, textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  activityIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  activityContent: { flex: 1, marginLeft: 10 },
  activityTitle: { fontSize: 13, fontWeight: '600', color: '#1f2937' },
  activityMeta: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  activityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activityBadgeText: { fontSize: 10, fontWeight: '600' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', margin: 16, padding: 12, borderRadius: 8, gap: 8, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { fontSize: 12, color: '#dc2626', flex: 1 },
});
