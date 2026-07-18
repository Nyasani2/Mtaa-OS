import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { useHospitalAccounting } from '@/lib/health/hooks/useHospitalAccounting';
import { DollarSign, Package, Users, Calendar, BarChart3, Wallet, CreditCard, Truck, Settings, ChevronRight } from 'lucide-react-native';

const ADMIN_MODULES = [
  { label: 'POS Terminal', icon: CreditCard, route: '/(os)/health/hospital-admin/pos', color: '#0A4DA6', desc: 'Process payments & invoices' },
  { label: 'Accounting', icon: BarChart3, route: '/(os)/health/hospital-admin/accounting', color: '#10B981', desc: 'Revenue & financial reports' },
  { label: 'Wallet', icon: Wallet, route: '/(os)/health/hospital-admin/wallet', color: '#8B5CF6', desc: 'Hospital wallet & withdrawals' },
  { label: 'Inventory', icon: Package, route: '/(os)/health/hospital-admin/inventory', color: '#F59E0B', desc: 'Stock & dispense medications' },
  { label: 'Staff', icon: Users, route: '/(os)/health/hospital-admin/staff', color: '#3B82F6', desc: 'Manage hospital staff' },
  { label: 'Appointments', icon: Calendar, route: '/(os)/health/hospital-admin/appointments', color: '#EC4899', desc: 'Schedule & manage bookings' },
  { label: 'Ambulance', icon: Truck, route: '/(os)/health/ambulance/dispatch', color: '#EF4444', desc: 'Dispatch & track ambulances' },
  { label: 'Settings', icon: Settings, route: '/(os)/health/hospital-admin/settings', color: '#6B7280', desc: 'Hospital configuration' },
];

export default function HospitalAdminHome() {
  const router = useRouter();
  const { selectedFacilityId } = useHealthRole();
  const { stats } = useHospitalAccounting(selectedFacilityId, 'today');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hospital Admin</Text>
        <Text style={styles.headerSub}>Manage your facility</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${(stats?.totalRevenue || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Today's Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.uniquePatients || 0}</Text>
          <Text style={styles.statLabel}>Patients Today</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Administration</Text>
      <View style={styles.grid}>
        {ADMIN_MODULES.map(mod => {
          const Icon = mod.icon;
          return (
            <TouchableOpacity key={mod.label} style={styles.moduleCard} onPress={() => router.push(mod.route as any)}>
              <View style={[styles.moduleIcon, { backgroundColor: mod.color + '15' }]}>
                <Icon size={24} color={mod.color} />
              </View>
              <View style={styles.moduleInfo}>
                <Text style={styles.moduleLabel}>{mod.label}</Text>
                <Text style={styles.moduleDesc}>{mod.desc}</Text>
              </View>
              <ChevronRight size={18} color="#D1D5DB" />
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#0A4DA6', padding: 20, paddingTop: 50, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#0A4DA6' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginHorizontal: 16, marginTop: 16, marginBottom: 10 },
  grid: { paddingHorizontal: 12 },
  moduleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10 },
  moduleIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  moduleInfo: { flex: 1, marginLeft: 12 },
  moduleLabel: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  moduleDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
