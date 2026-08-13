import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface RoleCard {
  role: string;
  label: string;
  icon: any;
  color: string;
  route: string;
  description: string;
}

export default function EducationPortal() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<RoleCard[]>([]);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    detectRoles(user.id);
  }, [user?.id]);

  const detectRoles = async (userId: string) => {
    setLoading(true);
    const detected: RoleCard[] = [];

    // Check student
    const { data: student } = await supabase
      .from('education_enrollments')
      .select('id')
      .eq('student_profile_id', userId)
      .limit(1);
    if (student && student.length > 0) {
      detected.push({
        role: 'student', label: 'Student', icon: 'school-outline',
        color: '#3b82f6', route: '/(education)/student',
        description: 'Learn, submit assignments, view grades, access resources'
      });
    }

    // Check teacher
    const { data: teacher } = await supabase
      .from('education_teachers')
      .select('id')
      .eq('teacher_profile_id', userId)
      .limit(1);
    if (teacher && teacher.length > 0) {
      detected.push({
        role: 'teacher', label: 'Teacher', icon: 'people-outline',
        color: '#10b981', route: '/(education)/teacher',
        description: 'Teach classes, grade work, create content, go live'
      });
    }

    // Check parent
    const { data: parent } = await supabase
      .from('education_parents')
      .select('id')
      .eq('parent_profile_id', userId)
      .limit(1);
    if (parent && parent.length > 0) {
      detected.push({
        role: 'parent', label: 'Parent', icon: 'heart-outline',
        color: '#ec4899', route: '/(education)/parent',
        description: 'Monitor children, attendance, grades, fees, transport'
      });
    }

    // Check staff / admin roles
    const { data: staff } = await supabase
      .from('education_staff')
      .select('id, role')
      .eq('staff_profile_id', userId)
      .limit(1);
    if (staff && staff.length > 0) {
      const s = staff[0];
      if (s.role === 'head_teacher' || s.role === 'principal') {
        detected.push({
          role: 'head_teacher', label: 'Head Teacher', icon: 'shield-checkmark-outline',
          color: '#f59e0b', route: '/(education)/school/head-teacher',
          description: 'Institutional command, academics, staff, reports'
        });
      }
      if (s.role === 'accountant' || s.role === 'finance') {
        detected.push({
          role: 'accountant', label: 'Accountant', icon: 'cash-outline',
          color: '#8b5cf6', route: '/(education)/school/fees',
          description: 'Fees, invoices, payroll, financial reports'
        });
      }
      if (s.role === 'admin' || s.role === 'school_admin') {
        detected.push({
          role: 'admin', label: 'School Admin', icon: 'settings-outline',
          color: '#6366f1', route: '/(education)/entry',
          description: 'Institution settings, users, operations'
        });
      }
      if (s.role === 'driver' || s.role === 'transport') {
        detected.push({
          role: 'driver', label: 'Driver', icon: 'car-outline',
          color: '#0ea5e9', route: '/(education)/driver',
          description: 'Routes, passengers, trips, vehicle status'
        });
      }
      if (s.role === 'security') {
        detected.push({
          role: 'security', label: 'Security', icon: 'shield-outline',
          color: '#dc2626', route: '/(education)/security',
          description: 'Visitors, incidents, check-ins, campus safety'
        });
      }
      if (s.role === 'counsellor') {
        detected.push({
          role: 'counsellor', label: 'Counsellor', icon: 'heart-outline',
          color: '#ec4899', route: '/(education)/counsellor',
          description: 'Student appointments, sessions, follow-ups'
        });
      }
      if (s.role === 'ict_admin') {
        detected.push({
          role: 'ict', label: 'ICT Admin', icon: 'wifi-outline',
          color: '#059669', route: '/(education)/ict/command-center',
          description: 'Devices, systems, integrations, support'
        });
      }
    }

    // Check institution owner
    const { data: owner } = await supabase
      .from('education_schools')
      .select('id')
      .eq('owner_id', userId)
      .limit(1);
    if (owner && owner.length > 0) {
      detected.push({
        role: 'owner', label: 'Institution Owner', icon: 'business-outline',
        color: '#1e3a5f', route: '/(education)/entry',
        description: 'Ownership, performance, compliance, strategy'
      });
    }

    // Always add community/map
    detected.push({
      role: 'community', label: 'Education Community', icon: 'chatbubbles-outline',
      color: '#3b82f6', route: '/(education)/',
      description: 'Feed, announcements, events, discussions'
    });
    detected.push({
      role: 'map', label: 'Education Map', icon: 'map-outline',
      color: '#059669', route: '/(education)/map',
      description: 'Schools, buses, routes, locations'
    });

    setRoles(detected);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#94a3b8', marginTop: 12 }}>Detecting your education roles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Education Portal</Text>
        <Text style={styles.headerSub}>Choose your workspace</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {roles.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="person-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No education roles found</Text>
            <Text style={styles.emptySub}>Contact your school administrator to get enrolled.</Text>
            <TouchableOpacity style={styles.enrollBtn} onPress={() => router.push('/(education as any)/schools' as any)}>
              <Text style={styles.enrollBtnText}>Browse Schools</Text>
            </TouchableOpacity>
          </View>
        ) : (
          roles.map((r) => (
            <TouchableOpacity
              key={r.role}
              style={[styles.roleCard, { borderLeftColor: r.color, borderLeftWidth: 4 }]}
              onPress={() => router.push(r.route as any as any)}
            >
              <View style={[styles.roleIcon, { backgroundColor: r.color + '20' }]}>
                <Ionicons name={r.icon} size={28} color={r.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.roleLabel}>{r.label}</Text>
                <Text style={styles.roleDesc}>{r.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { backgroundColor: '#1e3a5f', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 20 },
  backBtn: { marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  roleCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2
  },
  roleIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  roleLabel: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  roleDesc: { fontSize: 13, color: '#64748b', marginTop: 2, lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 16, color: '#475569', marginTop: 16, fontWeight: '600' },
  emptySub: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  enrollBtn: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 20 },
  enrollBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
