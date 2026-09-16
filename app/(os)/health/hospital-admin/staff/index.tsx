// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator, RefreshControl, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

export default function StaffManagementScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ full_name: '', email: '', role: 'doctor', department: '', phone: '' });

  const ROLES = ['doctor', 'nurse', 'lab_technician', 'pharmacist', 'receptionist', 'accountant', 'admin', 'housekeeping'];
  const STATUSES = ['All', 'active', 'pending', 'inactive', 'on_leave'];

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('health_staff').select('*');
      
      if (searchQuery) {
        query = query.ilike('full_name', `%${searchQuery}%`);
      }
      if (roleFilter !== 'All') {
        query = query.eq('role', roleFilter);
      }
      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('full_name', { ascending: true });
      if (error) throw error;
      setStaff(data || []);
    } catch (err) {
      console.error('Staff fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, roleFilter, statusFilter]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleInvite = async () => {
    if (!inviteForm.full_name || !inviteForm.email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }
    try {
      const { error } = await supabase.from('health_staff').insert({
        ...inviteForm,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      Alert.alert('Success', 'Staff member added!');
      setShowInvite(false);
      setInviteForm({ full_name: '', email: '', role: 'doctor', department: '', phone: '' });
      fetchStaff();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleStatusChange = async (staffId, newStatus) => {
    try {
      const { error } = await supabase.from('health_staff')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', staffId);
      if (error) throw error;
      fetchStaff();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = (staffId, name) => {
    Alert.alert('Delete Staff', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('health_staff').delete().eq('id', staffId);
            if (error) throw error;
            fetchStaff();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        }
      }
    ]);
  };

  const renderStaffCard = ({ item }) => (
    <View style={styles.staffCard}>
      <View style={styles.staffHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.full_name?.charAt(0) || '?'}</Text>
        </View>
        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>{item.full_name}</Text>
          <Text style={styles.staffEmail}>{item.email}</Text>
          <Text style={styles.staffMeta}>{item.role?.replace('_', ' ').toUpperCase()} • {item.department || 'Unassigned'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#10b981' : item.status === 'pending' ? '#f59e0b' : '#6b7280' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.staffActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange(item.id, item.status === 'active' ? 'inactive' : 'active')}>
          <Ionicons name={item.status === 'active' ? 'pause' : 'play'} size={18} color="#3b82f6" />
          <Text style={styles.actionText}>{item.status === 'active' ? 'Deactivate' : 'Activate'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/health/facility-admin/staff/${item.id}`)}>
          <Ionicons name="eye" size={18} color="#3b82f6" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id, item.full_name)}>
          <Ionicons name="trash" size={18} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading staff...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Roster</Text>
        <TouchableOpacity onPress={() => setShowInvite(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search staff..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['All', ...ROLES].map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.filterChip, roleFilter === role && styles.filterChipActive]}
              onPress={() => setRoleFilter(role)}
            >
              <Text style={[styles.filterText, roleFilter === role && styles.filterTextActive]}>
                {role === 'All' ? 'All Roles' : role.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{staff.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{staff.filter(s => s.status === 'active').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{staff.filter(s => s.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <FlatList
        data={staff}
        keyExtractor={(item) => item.id}
        renderItem={renderStaffCard}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStaff(); }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#64748b" />
            <Text style={styles.emptyText}>No staff found</Text>
            <Text style={styles.emptySubtext}>Add your first staff member to get started</Text>
          </View>
        }
      />

      <Modal visible={showInvite} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Staff Member</Text>
              <TouchableOpacity onPress={() => setShowInvite(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput style={styles.input} value={inviteForm.full_name} onChangeText={(t) => setInviteForm({...inviteForm, full_name: t})} placeholder="Dr. John Doe" placeholderTextColor="#9CA3AF" />

              <Text style={styles.label}>Email *</Text>
              <TextInput style={styles.input} value={inviteForm.email} onChangeText={(t) => setInviteForm({...inviteForm, email: t})} placeholder="john@hospital.com" keyboardType="email-address" placeholderTextColor="#9CA3AF" />

              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} value={inviteForm.phone} onChangeText={(t) => setInviteForm({...inviteForm, phone: t})} placeholder="+254 7XX XXX XXX" keyboardType="phone-pad" placeholderTextColor="#9CA3AF" />

              <Text style={styles.label}>Department</Text>
              <TextInput style={styles.input} value={inviteForm.department} onChangeText={(t) => setInviteForm({...inviteForm, department: t})} placeholder="e.g. Cardiology" placeholderTextColor="#9CA3AF" />

              <Text style={styles.label}>Role *</Text>
              <View style={styles.roleGrid}>
                {ROLES.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleCard, inviteForm.role === role && styles.roleCardActive]}
                    onPress={() => setInviteForm({...inviteForm, role})}
                  >
                    <Text style={[styles.roleText, inviteForm.role === role && styles.roleTextActive]}>
                      {role.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleInvite}>
                <Text style={styles.submitBtnText}>Add Staff Member</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#94a3b8', marginTop: 16, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e293b', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
  backBtn: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#3b82f6', padding: 8, borderRadius: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', margin: 16, padding: 12, borderRadius: 10, gap: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  filterRow: { paddingHorizontal: 16, marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b', marginRight: 8 },
  filterChipActive: { backgroundColor: '#3b82f6' },
  filterText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  statBox: { flex: 1, backgroundColor: '#1e293b', padding: 12, borderRadius: 10, alignItems: 'center' },
  statNumber: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  staffCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  staffHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  staffInfo: { flex: 1 },
  staffName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  staffEmail: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  staffMeta: { color: '#64748b', fontSize: 11, marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  staffActions: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#334155', borderRadius: 6 },
  actionText: { color: '#3b82f6', fontSize: 12, fontWeight: '500' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#94a3b8', fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySubtext: { color: '#64748b', fontSize: 13, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  label: { color: '#94a3b8', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 12, borderRadius: 10, fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  roleCard: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  roleCardActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  roleText: { color: '#94a3b8', fontSize: 12, fontWeight: '500' },
  roleTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#3b82f6', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 20, marginBottom: 20 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
