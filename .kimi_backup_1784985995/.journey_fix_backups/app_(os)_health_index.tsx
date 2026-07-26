import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { Heart, Stethoscope, Pill, Truck, Calendar, FileText, Shield, Leaf, ChevronRight, Bell } from 'lucide-react-native';

const PATIENT_MODULES = [
  { label: 'My Records', icon: FileText, route: '/(os)/health/patient/records', color: '#0A4DA6' },
  { label: 'Appointments', icon: Calendar, route: '/(os)/health/patient/appointments', color: '#10B981' },
  { label: 'Lab Results', icon: Stethoscope, route: '/(os)/health/patient/lab-results', color: '#3B82F6' },
  { label: 'Prescriptions', icon: Pill, route: '/(os)/health/patient/prescriptions', color: '#F59E0B' },
  { label: 'Consent', icon: Shield, route: '/(os)/health/patient/consent', color: '#8B5CF6' },
  { label: 'Traditional Medicine', icon: Leaf, route: '/(os)/health/patient/traditional', color: '#059669' },
];

const STAFF_MODULES = [
  { label: 'Patient Search', icon: Heart, route: '/(os)/health/staff/patients', color: '#0A4DA6' },
  { label: 'Appointments', icon: Calendar, route: '/(os)/health/staff/appointments', color: '#10B981' },
  { label: 'Lab Orders', icon: Stethoscope, route: '/(os)/health/staff/lab-orders', color: '#3B82F6' },
  { label: 'Prescriptions', icon: Pill, route: '/(os)/health/staff/prescriptions', color: '#F59E0B' },
  { label: 'Ambulance', icon: Truck, route: '/(os)/health/ambulance/dispatch', color: '#EF4444' },
];

const ADMIN_MODULES = [
  { label: 'Dashboard', icon: Heart, route: '/(os)/health/hospital-admin', color: '#0A4DA6' },
  { label: 'POS', icon: Stethoscope, route: '/(os)/health/hospital-admin/pos', color: '#10B981' },
  { label: 'Accounting', icon: FileText, route: '/(os)/health/hospital-admin/accounting', color: '#3B82F6' },
  { label: 'Inventory', icon: Pill, route: '/(os)/health/hospital-admin/inventory', color: '#F59E0B' },
];

const HEALER_MODULES = [
  { label: 'My Profile', icon: Heart, route: '/(os)/health/traditional-healer', color: '#059669' },
  { label: 'My Remedies', icon: Leaf, route: '/(os)/health/traditional-healer/remedies', color: '#10B981' },
  { label: 'Consultations', icon: Calendar, route: '/(os)/health/traditional-healer/consultations', color: '#3B82F6' },
  { label: 'Patients', icon: Heart, route: '/(os)/health/traditional-healer/patients', color: '#F59E0B' },
];

export default function HealthHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { role, isLoading } = useHealthRole();

  if (isLoading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#0A4DA6" />
      <Text style={styles.loadingText}>Loading health profile...</Text>
    </View>
  );

  const getModules = () => {
    if (role === 'patient') return PATIENT_MODULES;
    if (role === 'traditional_healer' || role === 'herbalist') return HEALER_MODULES;
    if (['doctor','nurse','pharmacist','lab_tech','receptionist'].includes(role || '')) return STAFF_MODULES;
    if (['admin','cashier','accountant'].includes(role || '')) return ADMIN_MODULES;
    return PATIENT_MODULES;
  };

  const modules = getModules();
  const title = role === 'traditional_healer' || role === 'herbalist' ? 'Traditional Medicine' : 'Health OS';
  const subtitle = role === 'traditional_healer' ? 'Herbalist & Healer Portal' : role === 'patient' ? 'Your Health, Your Control' : 'Hospital Management';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSub}>{subtitle}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/(os)/health/notifications' as any)}>
            <Bell size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{(role || 'guest').replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {modules.map(mod => {
          const Icon = mod.icon;
          return (
            <TouchableOpacity key={mod.label} style={styles.moduleCard} onPress={() => router.push(mod.route as any)}>
              <View style={[styles.moduleIcon, { backgroundColor: mod.color + '15' }]}>
                <Icon size={28} color={mod.color} />
              </View>
              <Text style={styles.moduleLabel}>{mod.label}</Text>
              <ChevronRight size={16} color="#D1D5DB" />
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity style={styles.emergencyBtn} onPress={() => router.push('/(os)/health/ambulance/dispatch' as any)}>
        <Truck size={24} color="#fff" />
        <Text style={styles.emergencyText}>Emergency Ambulance</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  header: { backgroundColor: '#0A4DA6', padding: 20, paddingTop: 50, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  roleBadge: { alignSelf: 'flex-start', marginTop: 12, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  roleText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  moduleCard: { width: '47%', backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' },
  moduleIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  moduleLabel: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginTop: 10, textAlign: 'center' },
  emergencyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444', margin: 16, paddingVertical: 16, borderRadius: 12, gap: 10 },
  emergencyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
