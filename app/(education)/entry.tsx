import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { detectUserEducationRole, EducationRole } from '@/domains/education/services/education-role-guard';
import StudentDashboard from './dashboards/student-dashboard';
import TeacherDashboard from './dashboards/teacher-dashboard';
import HeadTeacherDashboard from './dashboards/head-teacher-dashboard';
import ParentDashboard from './dashboards/parent-dashboard';
import StaffDashboard from './dashboards/staff-dashboard';
import AdminDashboard from './dashboards/admin-dashboard';
import AccountantDashboard from './dashboards/accountant-dashboard';
import { GraduationCap, School, UserPlus, Shield } from 'lucide-react-native';

export default function EducationEntry() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [role, setRole] = useState<EducationRole>(null);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    detectUserEducationRole(user.id).then((res) => {
      setRole(res.role);
      setInstitutionId(res.institutionId);
      setLoading(false);
    });
  }, [user?.id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Detecting your education profile...</Text>
      </View>
    );
  }

  if (!user?.id) {
    return (
      <View style={styles.center}>
        <GraduationCap size={48} color="#64748b" />
        <Text style={styles.title}>Please sign in</Text>
        <Text style={styles.subtitle}>Authentication required to access Education.</Text>
      </View>
    );
  }

  if (!role) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.centerBox}>
          <GraduationCap size={56} color="#38bdf8" />
          <Text style={styles.title}>Welcome to Education</Text>
          <Text style={styles.subtitle}>You are not enrolled in any institution yet. Choose an option below to get started.</Text>

          <TouchableOpacity style={styles.btn} onPress={() => router.push('/education/participants/create')}>
            <UserPlus size={18} color="#0f172a" />
            <Text style={styles.btnText}>Register as Participant</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => router.push('/education/schools')}>
            <School size={18} color="#f8fafc" />
            <Text style={styles.btnTextSecondary}>Browse Schools</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => router.push('/education/admin')}>
            <Shield size={18} color="#f8fafc" />
            <Text style={styles.btnTextSecondary}>Admin Portal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const dashboards: Record<NonNullable<EducationRole>, React.ReactNode> = {
    student: <StudentDashboard institutionId={institutionId} />,
    teacher: <TeacherDashboard institutionId={institutionId} />,
    head_teacher: <HeadTeacherDashboard institutionId={institutionId} />,
    parent: <ParentDashboard institutionId={institutionId} />,
    staff: <StaffDashboard institutionId={institutionId} />,
    admin: <AdminDashboard institutionId={institutionId} />,
    accountant: <AccountantDashboard institutionId={institutionId} />,
  };

  return <View style={styles.container}>{dashboards[role]}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', padding: 24 },
  centerBox: { alignItems: 'center', padding: 32, marginTop: 60 },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 10, textAlign: 'center', lineHeight: 20 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#38bdf8', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 20, width: '100%', justifyContent: 'center' },
  btnText: { color: '#0f172a', fontWeight: '700', fontSize: 15 },
  btnSecondary: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  btnTextSecondary: { color: '#f8fafc', fontWeight: '600', fontSize: 15 },
});
