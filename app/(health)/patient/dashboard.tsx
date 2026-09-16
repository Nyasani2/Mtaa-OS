import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
export default function PatientDashboard() {
const router = useRouter();
const { user } = useAuthStore();
const [refreshing, setRefreshing] = useState(false);
const quickActions = [
{ id: 'book', title: 'Book Appointment', icon: 'calendar', color: '#3B82F6', route: '/health/patient/book', desc: 'Schedule a visit' },
{ id: 'telemed', title: 'Virtual Visit', icon: 'videocam', color: '#10B981', route: '/health/patient/telemedicine', desc: 'Video consultation' },
{ id: 'pharmacy', title: 'Pharmacy', icon: 'medkit', color: '#8B5CFD', route: '/health/patient/pharmacy', desc: 'Refill prescription' },
{ id: 'lab', title: 'Lab Tests', icon: 'flask', color: '#F59E0B', route: '/health/patient/lab', desc: 'Book or view tests' },
{ id: 'records', title: 'My Records', icon: 'document-text', color: '#EC4899', route: '/health/patient/records', desc: 'Medical history' },
{ id: 'emergency', title: 'Emergency', icon: 'warning', color: '#EF4444', route: '/health/emergency', desc: 'Get help now' },
];
const healthMetrics = [
{ label: 'Upcoming', value: '2', icon: 'calendar', color: '#3B82F6' },
{ label: 'Prescriptions', value: '3', icon: 'medkit', color: '#10B981' },
{ label: 'Lab Results', value: '1', icon: 'flask', color: '#F59E0B' },
];
return (
<ScrollView
style={styles.container}
refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />}
>
<View style={styles.header}>
<View>
<Text style={styles.greeting}>Hello,</Text>
<Text style={styles.userName}>{user?.email?.split('@')[0] || 'Patient'}</Text>
</View>
<TouchableOpacity style={styles.notificationBtn}>
<Ionicons name="notifications" size={24} color="#fff" />
<View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
</TouchableOpacity>
</View>
<View style={styles.metricsContainer}>
{healthMetrics.map((metric, idx) => (
<View key={idx} style={styles.metricCard}>
<Ionicons name={metric.icon as any} size={24} color={metric.color} />
<Text style={styles.metricValue}>{metric.value}</Text>
<Text style={styles.metricLabel}>{metric.label}</Text>
</View>
))}
</View>
<View style={styles.section}>
<Text style={styles.sectionTitle}>Quick Actions</Text>
<View style={styles.actionsGrid}>
{quickActions.map((action) => (
<TouchableOpacity
key={action.id}
style={[styles.actionCard, { borderLeftColor: action.color }]}
onPress={() => router.push(action.route as any)}
>
<View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
<Ionicons name={action.icon as any} size={28} color={action.color} />
</View>
<Text style={styles.actionTitle}>{action.title}</Text>
<Text style={styles.actionDesc}>{action.desc}</Text>
</TouchableOpacity>
))}
</View>
</View>
<View style={styles.section}>
<Text style={styles.sectionTitle}>Upcoming Appointment</Text>
<View style={styles.appointmentCard}>
<View style={styles.appointmentHeader}>
<View style={styles.appointmentInfo}>
<Text style={styles.doctorName}>Dr. Sarah Kimani</Text>
<Text style={styles.appointmentType}>General Consultation</Text>
<Text style={styles.appointmentTime}>Tomorrow, 2:30 PM</Text>
</View>
<Ionicons name="chevron-forward" size={24} color="#94A3B8" />
</View>
<View style={styles.appointmentActions}>
<TouchableOpacity style={styles.btnSecondary}>
<Text style={styles.btnSecondaryText}>Reschedule</Text>
</TouchableOpacity>
<TouchableOpacity style={styles.btnPrimary}>
<Text style={styles.btnPrimaryText}>Join Call</Text>
</TouchableOpacity>
</View>
</View>
</View>
</ScrollView>
);
}
const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: '#0F172A' },
header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
greeting: { fontSize: 16, color: '#94A3B8' },
userName: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
notificationBtn: { position: 'relative', padding: 8 },
badge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
metricsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 24 },
metricCard: { flex: 1, backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginHorizontal: 4, alignItems: 'center' },
metricValue: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginVertical: 8 },
metricLabel: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
section: { paddingHorizontal: 20, marginBottom: 24 },
sectionTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 16 },
actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
actionCard: { width: '48%', backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4 },
actionIcon: { width: 50, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
actionTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 },
actionDesc: { fontSize: 13, color: '#94A3B8' },
appointmentCard: { backgroundColor: '#1E293B', padding: 20, borderRadius: 16 },
appointmentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
appointmentInfo: { flex: 1 },
doctorName: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
appointmentType: { fontSize: 14, color: '#94A3B8', marginBottom: 8 },
appointmentTime: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
appointmentActions: { flexDirection: 'row', gap: 12 },
btnSecondary: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#334155', alignItems: 'center' },
btnSecondaryText: { color: '#FFFFFF', fontWeight: '600' },
btnPrimary: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3B82F6', alignItems: 'center' },
btnPrimaryText: { color: '#FFFFFF', fontWeight: '600' },
});
