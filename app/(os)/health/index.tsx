import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Heart, Calendar, FileText, Pill, FlaskConical,
  ShieldAlert, Baby, ChevronRight, Clock, MapPin,
  Stethoscope, Phone, TrendingUp, User
} from 'lucide-react-native';
import { useHealthStore } from '@/lib/health/state/health.store';
import { usePatient } from '@/lib/health/hooks/usePatient';
import { useAppointments } from '@/lib/health/hooks/useAppointments';
import { useAuthStore } from '@/lib/auth/state/auth.store';
import { Colors } from '@/constants/Colors';

export default function HealthHomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { patient, loading: patientLoading, refreshPatient } = usePatient(profile?.id);
  const { appointments, loading: apptLoading, refreshAppointments } = useAppointments(patient?.id);
  const [refreshing, setRefreshing] = useState(false);

  const upcomingAppointments = appointments?.filter(
    (a: any) => ['scheduled', 'checked_in'].includes(a.status)
  )?.slice(0, 3) || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshPatient(), refreshAppointments()]);
    setRefreshing(false);
  };

  const quickActions = [
    { icon: Calendar, label: 'Book Appt', route: '/(os)/health/appointments', color: Colors.primary },
    { icon: FileText, label: 'Records', route: '/(os)/health/records', color: '#4CAF50' },
    { icon: Pill, label: 'Prescriptions', route: '/(os)/health/prescriptions', color: '#FF9800' },
    { icon: FlaskConical, label: 'Lab Results', route: '/(os)/health/lab-results', color: '#9C27B0' },
  ];

  const emergencyActions = [
    { icon: ShieldAlert, label: 'Emergency SOS', route: '/(os)/health/emergency', color: '#F44336', bg: '#FFEBEE' },
    { icon: Baby, label: 'Child Profiles', route: '/(os)/health/children', color: '#2196F3', bg: '#E3F2FD' },
    { icon: MapPin, label: 'Find Care', route: '/(os)/health/find-care', color: '#4CAF50', bg: '#E8F5E9' },
    { icon: Stethoscope, label: 'Telemedicine', route: '/(os)/health/telemedicine', color: '#FF9800', bg: '#FFF3E0' },
  ];

  if (patientLoading && !patient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your health profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Health Dashboard</Text>
            <Text style={styles.subGreeting}>
              {profile?.full_name || profile?.phone || 'Welcome'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(os)/health/profile')}
          >
            <User size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Health Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Heart size={20} color="#F44336" fill="#F44336" />
            <Text style={styles.statusTitle}>Health Status</Text>
          </View>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>{patient?.blood_group || '--'}</Text>
              <Text style={styles.statusLabel}>Blood Group</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>{patient?.allergies?.length || 0}</Text>
              <Text style={styles.statusLabel}>Allergies</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>{patient?.chronic_conditions?.length || 0}</Text>
              <Text style={styles.statusLabel}>Conditions</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>{upcomingAppointments.length}</Text>
              <Text style={styles.statusLabel}>Upcoming</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionButton}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
                <action.icon size={22} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Emergency & Special Actions */}
        <Text style={styles.sectionTitle}>Emergency & Family</Text>
        <View style={styles.emergencyGrid}>
          {emergencyActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.emergencyButton, { backgroundColor: action.bg }]}
              onPress={() => {
                if (action.label === 'Emergency SOS') {
                  Alert.alert(
                    'Emergency SOS',
                    'This will alert emergency services and share your location. Continue?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'SOS', style: 'destructive', onPress: () => router.push('/(os)/health/emergency') }
                    ]
                  );
                } else {
                  router.push(action.route as any);
                }
              }}
            >
              <action.icon size={24} color={action.color} />
              <Text style={[styles.emergencyLabel, { color: action.color }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Appointments */}
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        {apptLoading ? (
          <ActivityIndicator style={styles.apptLoader} color={Colors.primary} />
        ) : upcomingAppointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Calendar size={32} color="#999" />
            <Text style={styles.emptyText}>No upcoming appointments</Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push('/(os)/health/appointments')}
            >
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcomingAppointments.map((appt: any) => (
            <TouchableOpacity
              key={appt.id}
              style={styles.appointmentCard}
              onPress={() => router.push({
                pathname: '/(os)/health/appointments/detail',
                params: { id: appt.id }
              } as any)}
            >
              <View style={styles.apptLeft}>
                <View style={[styles.apptIndicator, {
                  backgroundColor: appt.status === 'checked_in' ? '#4CAF50' : Colors.primary
                }]} />
                <View>
                  <Text style={styles.apptType}>{appt.appointment_type?.replace('_', ' ')}</Text>
                  <Text style={styles.apptDoctor}>Dr. {appt.doctor?.profile?.full_name || 'Unknown'}</Text>
                  <View style={styles.apptTimeRow}>
                    <Clock size={12} color="#666" />
                    <Text style={styles.apptTime}>
                      {new Date(appt.scheduled_at).toLocaleDateString()} at{' '}
                      {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              </View>
              <ChevronRight size={18} color="#999" />
            </TouchableOpacity>
          ))
        )}

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <TrendingUp size={16} color="#4CAF50" />
            <Text style={styles.activityText}>Health profile synced</Text>
            <Text style={styles.activityTime}>Just now</Text>
          </View>
          <View style={styles.activityDivider} />
          <View style={styles.activityItem}>
            <ShieldAlert size={16} color="#F44336" />
            <Text style={styles.activityText}>Emergency access enabled</Text>
            <Text style={styles.activityTime}>2h ago</Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16
  },
  greeting: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  subGreeting: { fontSize: 14, color: '#666', marginTop: 2 },
  profileButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  },
  statusCard: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16,
    padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2
  },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8, color: '#1a1a1a' },
  statusGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statusItem: { alignItems: 'center', flex: 1 },
  statusValue: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  statusLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  sectionTitle: {
    fontSize: 16, fontWeight: '600', color: '#1a1a1a',
    marginHorizontal: 16, marginTop: 24, marginBottom: 12
  },
  quickActionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 8
  },
  quickActionButton: {
    width: '23%', alignItems: 'center', paddingVertical: 12
  },
  quickActionIcon: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center'
  },
  quickActionLabel: { fontSize: 11, color: '#333', marginTop: 8, textAlign: 'center' },
  emergencyGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 10
  },
  emergencyButton: {
    width: '47%', flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 12, gap: 10
  },
  emergencyLabel: { fontSize: 13, fontWeight: '600' },
  emptyCard: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16,
    padding: 24, alignItems: 'center'
  },
  emptyText: { fontSize: 14, color: '#999', marginTop: 8, marginBottom: 16 },
  bookButton: {
    backgroundColor: Colors.primary, paddingHorizontal: 20,
    paddingVertical: 10, borderRadius: 8
  },
  bookButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  appointmentCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 12, padding: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between'
  },
  apptLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  apptIndicator: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  apptType: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', textTransform: 'capitalize' },
  apptDoctor: { fontSize: 12, color: '#666', marginTop: 2 },
  apptTimeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  apptTime: { fontSize: 11, color: '#888' },
  apptLoader: { marginVertical: 20 },
  activityCard: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 16
  },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activityText: { flex: 1, fontSize: 13, color: '#333' },
  activityTime: { fontSize: 11, color: '#999' },
  activityDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 10 },
  bottomPadding: { height: 32 }
});
