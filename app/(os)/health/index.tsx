import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUnifiedHealth, HealthRole } from '@/hooks/useUnifiedHealth';
import { osShell } from '@/lib/kernel/os-shell';
import { 
  Stethoscope, 
  MapPin, 
  Ambulance, 
  Pill, 
  ClipboardList, 
  Users, 
  CreditCard,
  ShieldAlert,
  Building2,
  Leaf,
  UserCircle,
  ChevronRight,
  AlertCircle
} from 'lucide-react-native';

const ROLE_CONFIG: Record<NonNullable<HealthRole>, {
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  quickActions: { label: string; route: string; icon: any }[];
}> = {
  patient: {
    label: 'Patient',
    icon: UserCircle,
    color: '#2563EB',
    bgColor: '#DBEAFE',
    quickActions: [
      { label: 'Find Care', route: '/health/find-care', icon: MapPin },
      { label: 'My Appointments', route: '/health/appointments', icon: ClipboardList },
      { label: 'Health Map', route: '/health/map', icon: MapPin },
    ],
  },
  doctor: {
    label: 'Doctor',
    icon: Stethoscope,
    color: '#059669',
    bgColor: '#D1FAE5',
    quickActions: [
      { label: 'Workspace', route: '/health/doctor', icon: Stethoscope },
      { label: 'My Queue', route: '/health/doctor/queue', icon: Users },
      { label: 'Prescribe', route: '/health/doctor/prescribe', icon: Pill },
    ],
  },
  nurse: {
    label: 'Nurse',
    icon: Stethoscope,
    color: '#059669',
    bgColor: '#D1FAE5',
    quickActions: [
      { label: 'Workspace', route: '/health/doctor', icon: Stethoscope },
      { label: 'My Queue', route: '/health/doctor/queue', icon: Users },
      { label: 'Vitals', route: '/health/doctor/notes', icon: ClipboardList },
    ],
  },
  pharmacist: {
    label: 'Pharmacist',
    icon: Pill,
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    quickActions: [
      { label: 'Pharmacy', route: '/health/herbal-pharmacy', icon: Pill },
      { label: 'Dispense', route: '/health/herbal-pharmacy', icon: Pill },
      { label: 'Inventory', route: '/health/herbal-pharmacy', icon: ClipboardList },
    ],
  },
  ambulance_driver: {
    label: 'Ambulance Driver',
    icon: Ambulance,
    color: '#DC2626',
    bgColor: '#FEE2E2',
    quickActions: [
      { label: 'Dispatch', route: '/health/ambulance', icon: Ambulance },
      { label: 'Map', route: '/health/map', icon: MapPin },
      { label: 'Handover', route: '/health/ambulance/handover', icon: ClipboardList },
    ],
  },
  lab_tech: {
    label: 'Lab Technician',
    icon: ClipboardList,
    color: '#0891B2',
    bgColor: '#CFFAFE',
    quickActions: [
      { label: 'Lab Orders', route: '/health/doctor/orders', icon: ClipboardList },
      { label: 'Results', route: '/health/doctor/orders', icon: ClipboardList },
    ],
  },
  cashier: {
    label: 'Cashier',
    icon: CreditCard,
    color: '#D97706',
    bgColor: '#FEF3C7',
    quickActions: [
      { label: 'Invoices', route: '/health/cashier', icon: CreditCard },
      { label: 'Payments', route: '/health/cashier/payments', icon: CreditCard },
      { label: 'Insurance', route: '/health/cashier/insurance', icon: ShieldAlert },
    ],
  },
  admin: {
    label: 'Hospital Admin',
    icon: Building2,
    color: '#4F46E5',
    bgColor: '#E0E7FF',
    quickActions: [
      { label: 'Dashboard', route: '/health/hospital-admin', icon: Building2 },
      { label: 'Staff', route: '/health/hospital-admin/staff', icon: Users },
      { label: 'Beds', route: '/health/hospital-admin/beds', icon: Building2 },
      { label: 'Accounting', route: '/health/hospital-admin/accounting', icon: CreditCard },
    ],
  },
  government: {
    label: 'Government',
    icon: ShieldAlert,
    color: '#1F2937',
    bgColor: '#F3F4F6',
    quickActions: [
      { label: 'Verify Facilities', route: '/health/government/verify-facilities', icon: ShieldAlert },
      { label: 'Surveillance', route: '/health/government/surveillance', icon: ShieldAlert },
      { label: 'Population', route: '/health/government/population', icon: Users },
    ],
  },
  herbalist: {
    label: 'Herbalist',
    icon: Leaf,
    color: '#15803D',
    bgColor: '#DCFCE7',
    quickActions: [
      { label: 'Clinic', route: '/health/herbal-pharmacy', icon: Leaf },
      { label: 'Remedies', route: '/health/herbal-pharmacy', icon: Pill },
      { label: 'Patients', route: '/health/herbal-pharmacy', icon: Users },
    ],
  },
};

export default function HealthDashboard() {
  const router = useRouter();
  const { healthProfile, stats, loading, userRole, isVerified, getDashboardRoute } = useUnifiedHealth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading your health dashboard...</Text>
      </View>
    );
  }

  if (!userRole) {
    return (
      <View style={styles.center}>
        <AlertCircle size={48} color="#DC2626" />
        <Text style={styles.noRoleTitle}>Welcome to Health</Text>
        <Text style={styles.noRoleText}>You need to complete onboarding to access health services.</Text>
        <TouchableOpacity 
          style={styles.onboardButton}
          onPress={() => router.push('/health/onboard')}
        >
          <Text style={styles.onboardButtonText}>Get Started</Text>
          <ChevronRight size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  const config = ROLE_CONFIG[userRole];
  const RoleIcon = config.icon;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Card */}
      <View style={[styles.headerCard, { backgroundColor: config.bgColor }]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconCircle, { backgroundColor: config.color }]}>
            <RoleIcon size={28} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.roleLabel, { color: config.color }]}>{config.label}</Text>
            <Text style={styles.roleStatus}>
              {isVerified ? '✓ Verified' : '⚠ Pending Verification'}
            </Text>
          </View>
        </View>

        {stats && (
          <View style={styles.statsRow}>
            {stats.todayAppointments !== undefined && (
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: config.color }]}>{stats.todayAppointments}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
            )}
            {stats.pendingLabOrders !== undefined && (
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: config.color }]}>{stats.pendingLabOrders}</Text>
                <Text style={styles.statLabel}>Lab Orders</Text>
              </View>
            )}
            {stats.totalPatients !== undefined && (
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: config.color }]}>{stats.totalPatients}</Text>
                <Text style={styles.statLabel}>Patients</Text>
              </View>
            )}
            {stats.emergencyAlerts !== undefined && (
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: config.color }]}>{stats.emergencyAlerts}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
            )}
            {stats.bedOccupancy !== undefined && (
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: config.color }]}>{stats.bedOccupancy}%</Text>
                <Text style={styles.statLabel}>Beds</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {config.quickActions.map((action, idx) => {
          const ActionIcon = action.icon;
          return (
            <TouchableOpacity
              key={idx}
              style={styles.actionCard}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: config.bgColor }]}>
                <ActionIcon size={22} color={config.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <ChevronRight size={14} color="#9CA3AF" />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Universal Actions */}
      <Text style={styles.sectionTitle}>Health Services</Text>
      <View style={styles.serviceList}>
        <ServiceRow 
          icon={MapPin} 
          label="Health Map" 
          desc="Find ambulances, pharmacies & clinics"
          color="#2563EB"
          bgColor="#DBEAFE"
          onPress={() => router.push('/health/map')}
        />
        <ServiceRow 
          icon={Building2} 
          label="Find Care" 
          desc="Book appointments & find providers"
          color="#059669"
          bgColor="#D1FAE5"
          onPress={() => router.push('/health/find-care')}
        />
        <ServiceRow 
          icon={Ambulance} 
          label="Emergency" 
          desc="Request emergency services"
          color="#DC2626"
          bgColor="#FEE2E2"
          onPress={() => router.push('/health/emergency')}
        />
      </View>

      {/* Go to Full Dashboard */}
      <TouchableOpacity 
        style={[styles.fullDashboardBtn, { backgroundColor: config.color }]}
        onPress={() => router.push(getDashboardRoute() as any)}
      >
        <Text style={styles.fullDashboardText}>Open Full Dashboard</Text>
        <ChevronRight size={18} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

function ServiceRow({ icon: Icon, label, desc, color, bgColor, onPress }: any) {
  return (
    <TouchableOpacity style={styles.serviceRow} onPress={onPress}>
      <View style={[styles.serviceIcon, { backgroundColor: bgColor }]}>
        <Icon size={22} color={color} />
      </View>
      <View style={styles.serviceText}>
        <Text style={styles.serviceLabel}>{label}</Text>
        <Text style={styles.serviceDesc}>{desc}</Text>
      </View>
      <ChevronRight size={18} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  noRoleTitle: { marginTop: 16, fontSize: 20, fontWeight: '700', color: '#1F2937' },
  noRoleText: { marginTop: 8, fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  onboardButton: { 
    marginTop: 24, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#2563EB', 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 10 
  },
  onboardButtonText: { color: '#fff', fontSize: 15, fontWeight: '600', marginRight: 8 },
  headerCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerText: { marginLeft: 14 },
  roleLabel: { fontSize: 18, fontWeight: '700' },
  roleStatus: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statsRow: { flexDirection: 'row', marginTop: 18, gap: 12 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: 10, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12, marginTop: 8 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { 
    width: '47%', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 14, 
    flexDirection: 'row', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  actionLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#374151' },
  serviceList: { gap: 10 },
  serviceRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceIcon: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  serviceText: { flex: 1, marginLeft: 12 },
  serviceLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  serviceDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  fullDashboardBtn: { 
    marginTop: 24, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 14, 
    borderRadius: 12 
  },
  fullDashboardText: { color: '#fff', fontSize: 15, fontWeight: '700', marginRight: 8 },
});
