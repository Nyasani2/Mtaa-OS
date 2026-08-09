import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import StudentDashboard from '../entry/dashboards/student-dashboard';
import TeacherDashboard from '../entry/dashboards/teacher-dashboard';
import HeadTeacherDashboard from '../entry/dashboards/head-teacher-dashboard';
import ParentDashboard from '../entry/dashboards/parent-dashboard';
import StaffDashboard from '../entry/dashboards/staff-dashboard';
import AdminDashboard from '../entry/dashboards/admin-dashboard';
import AccountantDashboard from '../entry/dashboards/accountant-dashboard';

const DASHBOARDS: Record<string, React.FC<any>> = {
  student: StudentDashboard,
  teacher: TeacherDashboard,
  head_teacher: HeadTeacherDashboard,
  parent: ParentDashboard,
  staff: StaffDashboard,
  admin: AdminDashboard,
  accountant: AccountantDashboard,
};

export default function PortalRole() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const Dashboard = DASHBOARDS[role || ''];

  if (!Dashboard) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Unknown Portal</Text>
        <Text style={styles.errorSub}>Role "{role}" is not recognized.</Text>
      </View>
    );
  }

  return <Dashboard institutionId={null} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#ef4444' },
  errorSub: { fontSize: 14, color: '#64748b', marginTop: 8 },
});
