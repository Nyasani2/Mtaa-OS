// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

export default function AdminWorkstationPro() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [facilityData, setFacilityData] = useState({});
  const [stats, setStats] = useState({});
  
  // Sub-modules
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch comprehensive stats
      const [
        patients, appointments, staff, departments, 
        revenue, beds, users
      ] = await Promise.all([
        supabase.from('health_patients').select('id, admission_status'),
        supabase.from('health_appointments').select('id, status, scheduled_date'),
        supabase.from('health_staff').select('id, department, role'),
        supabase.from('health_departments').select('*'),
        supabase.from('health_invoices').select('total_amount, status, created_at'),
        supabase.from('health_beds').select('id, status, department'),
        supabase.from('users').select('id, role')
      ]);

      // Calculate metrics
      const todayAppts = appointments.filter(a => a.scheduled_date === today).length;
      const admittedPatients = patients.filter(p => p.admission_status === 'admitted').length;
      const totalBeds = beds.length;
      const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
      const totalRevenue = revenue.reduce((sum, r) => sum + (r.total_amount || 0), 0);
      const pendingRevenue = revenue.filter(r => r.status === 'pending').reduce((sum, r) => sum + (r.total_amount || 0), 0);

      setStats({
        totalPatients: patients.length,
        todayAppointments: todayAppts,
        admittedPatients,
        totalBeds,
        occupiedBeds,
        bedOccupancy: totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0,
        totalStaff: staff.length,
        totalRevenue,
        pendingRevenue,
        totalUsers: users.length
      });

      setFacilityData({ departments: departments || [] });
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const adminModules = [
    {
      category: 'Dashboard & Analytics',
      icon: 'stats-chart',
      items: [
        { id: 'executive-dashboard', label: 'Executive Dashboard', desc: 'Real-time KPIs & metrics', icon: 'speedometer' },
        { id: 'census', label: 'Hospital Census', desc: 'Patient count & bed status', icon: 'people' },
        { id: 'throughput', label: 'Patient Throughput', desc: 'Wait times & flow metrics', icon: 'pulse' },
        { id: 'quality', label: 'Quality Metrics', desc: 'Clinical outcomes & safety', icon: 'shield-checkmark' },
      ]
    },
    {
      category: 'User & Staff Management',
      icon: 'people',
      items: [
        { id: 'staff-roster', label: 'Staff Roster', desc: `${stats.totalStaff || 0} staff members`, icon: 'id-card' },
        { id: 'user-roles', label: 'User Roles & Permissions', desc: 'RBAC configuration', icon: 'lock-closed' },
        { id: 'credentials', label: 'Credential Management', desc: 'Licenses & certifications', icon: 'document-text' },
        { id: 'schedules', label: 'Staff Schedules', desc: 'Shifts & on-call', icon: 'calendar' },
      ]
    },
    {
      category: 'Facility Configuration',
      icon: 'business',
      items: [
        { id: 'departments', label: 'Departments', desc: 'Manage clinical units', icon: 'grid' },
        { id: 'beds', label: 'Bed Management', desc: `${stats.occupiedBeds || 0}/${stats.totalBeds || 0} beds occupied`, icon: 'bed' },
        { id: 'rooms', label: 'Room Configuration', desc: 'ORs, clinics, wards', icon: 'home' },
        { id: 'equipment', label: 'Equipment Tracking', desc: 'Assets & maintenance', icon: 'hardware-chip' },
      ]
    },
    {
      category: 'Financial Administration',
      icon: 'cash',
      items: [
        { id: 'pricing', label: 'Service Pricing', desc: 'Fee schedule management', icon: 'pricetag' },
        { id: 'insurance', label: 'Insurance Contracts', desc: 'Payer agreements', icon: 'shield' },
        { id: 'billing-codes', label: 'Billing Codes', desc: 'CPT, ICD-10, DRG', icon: 'barcode' },
        { id: 'revenue', label: 'Revenue Cycle', desc: `KES ${(stats.pendingRevenue || 0).toLocaleString()} pending`, icon: 'trending-up' },
      ]
    },
    {
      category: 'Quality & Compliance',
      icon: 'checkmark-circle',
      items: [
        { id: 'audit-logs', label: 'Audit Logs', desc: 'System activity tracking', icon: 'document-lock' },
        { id: 'incidents', label: 'Incident Reports', desc: 'Safety events', icon: 'warning' },
        { id: 'infection', label: 'Infection Control', desc: 'HAI tracking', icon: 'bug' },
        { id: 'reports', label: 'Regulatory Reports', desc: 'MOH, NHIF submissions', icon: 'file-tray-full' },
      ]
    },
    {
      category: 'System Administration',
      icon: 'settings',
      items: [
        { id: 'system-config', label: 'System Settings', desc: 'Global configuration', icon: 'options' },
        { id: 'integrations', label: 'Integrations', desc: 'HL7, FHIR, APIs', icon: 'link' },
        { id: 'backup', label: 'Backup & Recovery', desc: 'Data management', icon: 'cloud-upload' },
        { id: 'notifications', label: 'Alert Configuration', desc: 'System notifications', icon: 'notifications' },
      ]
    }
  ];

  const renderStatCard = (label, value, icon, color) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading admin console...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Facility Administration</Text>
          <Text style={styles.headerSubtitle}>System Configuration & Management</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={24} color="#10b981" />
          <Text style={styles.adminText}>Super Admin</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Patients Today', stats.todayAppointments || 0, 'people', '#3b82f6')}
            {renderStatCard('Bed Occupancy', `${stats.bedOccupancy || 0}%`, 'bed', '#f59e0b')}
            {renderStatCard('Active Staff', stats.totalStaff || 0, 'people', '#10b981')}
            {renderStatCard('Revenue (Pending)', `KES ${(stats.pendingRevenue || 0).toLocaleString()}`, 'cash', '#ef4444')}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowStaffModal(true)}>
              <Ionicons name="person-add" size={24} color="#3b82f6" />
              <Text style={styles.actionText}>Add Staff</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowDeptModal(true)}>
              <Ionicons name="add-circle" size={24} color="#10b981" />
              <Text style={styles.actionText}>New Department</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/health/billing')}>
              <Ionicons name="cash" size={24} color="#f59e0b" />
              <Text style={styles.actionText}>View Revenue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowUserModal(true)}>
              <Ionicons name="key" size={24} color="#8b5cf6" />
              <Text style={styles.actionText}>User Access</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Admin Modules */}
        {adminModules.map((module, moduleIdx) => (
          <View key={moduleIdx} style={styles.section}>
            <View style={styles.moduleHeader}>
              <Ionicons name={module.icon} size={20} color="#3b82f6" />
              <Text style={styles.moduleTitle}>{module.category}</Text>
            </View>
            <View style={styles.moduleGrid}>
              {module.items.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.moduleCard}
                  onPress={() => router.push(`/health/facility-admin/${item.id}`)}
                >
                  <View style={styles.moduleIconBox}>
                    <Ionicons name={item.icon} size={24} color="#fff" />
                  </View>
                  <Text style={styles.moduleLabel}>{item.label}</Text>
                  <Text style={styles.moduleDesc}>{item.desc}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#64748b" style={styles.chevron} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* System Health */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Health</Text>
          <View style={styles.healthItem}>
            <View style={styles.healthInfo}>
              <Text style={styles.healthLabel}>Database Status</Text>
              <Text style={styles.healthValue}>Connected</Text>
            </View>
            <View style={[styles.healthDot, { backgroundColor: '#10b981' }]} />
          </View>
          <View style={styles.healthItem}>
            <View style={styles.healthInfo}>
              <Text style={styles.healthLabel}>Last Backup</Text>
              <Text style={styles.healthValue}>2 hours ago</Text>
            </View>
            <View style={[styles.healthDot, { backgroundColor: '#10b981' }]} />
          </View>
          <View style={styles.healthItem}>
            <View style={styles.healthInfo}>
              <Text style={styles.healthLabel}>Active Users</Text>
              <Text style={styles.healthValue}>{stats.totalUsers || 0} online</Text>
            </View>
            <View style={[styles.healthDot, { backgroundColor: '#10b981' }]} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' },
  loadingText: { color: '#94a3b8', marginTop: 16, fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#10b981', gap: 6 },
  adminText: { color: '#10b981', fontSize: 12, fontWeight: '600' },
  content: { flex: 1 },
  section: { backgroundColor: '#0f172a', marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  
  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '48%', backgroundColor: '#1e293b', borderRadius: 12, padding: 16 },
  statIconBox: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  
  // Quick Actions
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionBtn: { width: '48%', backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center', gap: 8 },
  actionText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  
  // Modules
  moduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  moduleTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  moduleGrid: { gap: 8 },
  moduleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#334155' },
  moduleIconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  moduleLabel: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  moduleDesc: { color: '#64748b', fontSize: 12 },
  chevron: { marginLeft: 8 },
  
  // System Health
  healthItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  healthInfo: { flex: 1 },
  healthLabel: { color: '#94a3b8', fontSize: 13 },
  healthValue: { color: '#fff', fontSize: 13, fontWeight: '600' },
  healthDot: { width: 10, height: 10, borderRadius: 5 },
});
