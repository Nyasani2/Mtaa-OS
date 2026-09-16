// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function HealthLanding() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    if (!isAuthenticated) router.replace('/(auth)/login');
  }, [isAuthenticated]);

  const emergencyRoles = [
    { title: '🚨 Call Ambulance', icon: 'car', desc: 'Emergency dispatch with location tracking', color: '#dc2626', route: '/(os)/health/emergency', urgent: true },
  ];

  const clinicalRoles = [
    { title: 'Doctor', icon: 'medical', desc: 'Diagnose, prescribe, review history', color: '#3b82f6', route: '/(os)/health/doctor' },
    { title: 'Nurse', icon: 'heart', desc: 'Record vitals, administer medication', color: '#ec4899', route: '/(os)/health/nurse' },
    { title: 'Lab Technician', icon: 'flask', desc: 'Process lab tests, upload results', color: '#8b5cf6', route: '/(os)/health/lab/queue' },
    { title: 'Pharmacist', icon: 'medkit', desc: 'Dispense medication, manage inventory', color: '#10b981', route: '/(os)/health/pharmacy/queue' },
  ];

  const adminRoles = [
    { title: 'Receptionist', icon: 'calendar', desc: 'Patient check-in, appointments', color: '#6366f1', route: '/(os)/health/reception' },
    { title: 'Accountant', icon: 'cash', desc: 'Billing, payments, insurance claims', color: '#22c55e', route: '/(os)/health/billing' },
    { title: 'Hospital Admin', icon: 'settings', desc: 'Staff management, operations', color: '#64748b', route: '/(os)/health/facility-admin' },
    { title: 'Housekeeping', icon: 'brush', desc: 'Room cleaning, sanitation status', color: '#14b8a6', route: '/(os)/health/housekeeping' },
  ];

  const systemRoles = [
    { title: 'Patient Portal', icon: 'person', desc: 'Access medical records, book appointments', color: '#0ea5e9', route: '/(os)/health/patient/dashboard' },
    { title: 'Register Facility', icon: 'business', desc: 'Register a new hospital/clinic', color: '#f59e0b', route: '/(os)/health/facility-register' },
    { title: 'Facility Management', icon: 'build', desc: 'Manage staff, transfer ownership', color: '#64748b', route: '/(os)/health/facility-admin' },
  ];

  const renderSection = (title, roles) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>
        {roles.map((role, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={[styles.gridCard, role.urgent && styles.urgentCard, { borderLeftColor: role.color }]} 
            onPress={() => router.push(role.route)}
          >
            <View style={[styles.iconBox, { backgroundColor: role.color + '20' }]}>
              <Ionicons name={role.icon} size={28} color={role.color} />
            </View>
            <Text style={styles.gridTitle}>{role.title}</Text>
            <Text style={styles.gridDesc}>{role.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#14b8a6', '#0d9488', '#0f766e']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Ionicons name="medical" size={48} color="#ffffff" />
            <Text style={styles.title}>MTAA Health</Text>
            <Text style={styles.subtitle}>Comprehensive Healthcare Management</Text>
          </View>
          {renderSection(' Emergency', emergencyRoles)}
          {renderSection('Clinical Staff', clinicalRoles)}
          {renderSection('Administrative & Support', adminRoles)}
          {renderSection('System & Patient Access', systemRoles)}
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark" size={20} color="#14b8a6" />
            <Text style={styles.footerText}>Secured by MTAA OS Authentication</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, gradient: { flex: 1 }, content: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', marginTop: 10 },
  subtitle: { fontSize: 14, color: '#e5e7eb', marginTop: 5 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 16, padding: 16, width: '48%', marginBottom: 12, borderLeftWidth: 4 },
  urgentCard: { backgroundColor: '#fef2f2', borderWidth: 2, borderColor: '#dc2626' },
  iconBox: { width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  gridTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  gridDesc: { fontSize: 11, color: '#6b7280', lineHeight: 14 },
  footer: { alignItems: 'center', marginTop: 20, marginBottom: 20 },
  footerText: { color: '#14b8a6', fontSize: 11, marginTop: 4 },
});
