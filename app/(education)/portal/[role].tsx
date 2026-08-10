import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import StudentDashboard from '../student-dashboard';
import TeacherDashboard from '../teacher-dashboard';
import HeadTeacherDashboard from '../head-teacher-dashboard';
import ParentDashboard from '../parent-dashboard';
import AdminDashboard from '../admin-dashboard';
import AccountantDashboard from '../accountant-dashboard';
import StaffDashboard from '../staff-dashboard';

const ROLE_COMPONENTS: Record<string, React.FC> = {
  student: StudentDashboard,
  teacher: TeacherDashboard,
  'head-teacher': HeadTeacherDashboard,
  parent: ParentDashboard,
  admin: AdminDashboard,
  accountant: AccountantDashboard,
  staff: StaffDashboard,
};

export default function RolePortal() {
  const { role } = useLocalSearchParams();
  const roleKey = typeof role === 'string' ? role.toLowerCase() : '';
  const Component = ROLE_COMPONENTS[roleKey];

  if (!Component) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Unknown role: {role}</Text>
      </View>
    );
  }

  return <Component />;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  error: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});
