import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEducation } from '@/lib/hooks/useEducation';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const ROLES = [
  { id: 'head_teacher', name: 'Head Teacher', icon: 'school-outline', color: '#1e3a5f', desc: 'Full school administration access' },
  { id: 'deputy_head', name: 'Deputy Head', icon: 'people-outline', color: '#2d5a87', desc: 'Assists head teacher, can approve most items' },
  { id: 'ict_admin', name: 'ICT Administrator', icon: 'hardware-chip-outline', color: '#3b82f6', desc: 'Manages digital infrastructure & security' },
  { id: 'finance_officer', name: 'Finance Officer', icon: 'cash-outline', color: '#10b981', desc: 'Manages fees, payroll, budgets' },
  { id: 'department_head', name: 'Department Head', icon: 'grid-outline', color: '#f59e0b', desc: 'Manages department teachers & curriculum' },
  { id: 'teacher', name: 'Teacher', icon: 'book-outline', color: '#8b5cf6', desc: 'Standard teaching access' },
  { id: 'class_teacher', name: 'Class Teacher', icon: 'people-circle-outline', color: '#ec4899', desc: 'Manages specific class & students' },
  { id: 'security_guard', name: 'Security Guard', icon: 'shield-outline', color: '#64748b', desc: 'Gate access, visitor management' },
  { id: 'support_staff', name: 'Support Staff', icon: 'construct-outline', color: '#94a3b8', desc: 'Limited operational access' },
];

export default function AssignRole() {
  const router = useRouter();
  const { teacherId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const { getTeacherByUserId, updateTeacher } = useEducation();
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedRole) {
      Alert.alert('Select Role', 'Please select a role to assign');
      return;
    }
    setLoading(true);
    try {
      await updateTeacher(teacherId, { role: selectedRole, assigned_by: user?.id, assigned_at: new Date().toISOString() });
      Alert.alert('Role Assigned', `Teacher has been assigned as ${ROLES.find(r => r.id === selectedRole)?.name}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Role</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Select the role for this staff member. This determines their permissions across the school system.</Text>

        {ROLES.map(role => (
          <TouchableOpacity
            key={role.id}
            style={[styles.roleCard, selectedRole === role.id && styles.roleCardActive]}
            onPress={() => setSelectedRole(role.id)}
          >
            <View style={[styles.roleIcon, { backgroundColor: role.color + '15' }]}>
              <Ionicons name={role.icon} size={24} color={role.color} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleName}>{role.name}</Text>
              <Text style={styles.roleDesc}>{role.desc}</Text>
            </View>
            <View style={[styles.checkCircle, selectedRole === role.id && styles.checkCircleActive]}>
              {selectedRole === role.id && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.assignBtn, loading && styles.assignBtnDisabled]} onPress={handleAssign} disabled={loading}>
          <Text style={styles.assignBtnText}>{loading ? 'Assigning...' : 'Assign Role'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  content: { flex: 1, padding: 16 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 20 },
  roleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: '#e2e8f0' },
  roleCardActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  roleIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  roleInfo: { flex: 1 },
  roleName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  roleDesc: { fontSize: 13, color: '#64748b', marginTop: 4 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  checkCircleActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  assignBtn: { backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  assignBtnDisabled: { backgroundColor: '#93c5fd' },
  assignBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
