import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

const ROLES = [
  {
    id: 'student',
    title: 'I am a Student',
    subtitle: 'Access classes, assignments, grades, and transport',
    icon: 'school',
    color: '#3b82f6',
    route: '/(education)/student-dashboard',
  },
  {
    id: 'teacher',
    title: 'I am a Teacher',
    subtitle: 'Manage classes, attendance, grading, and communication',
    icon: 'people',
    color: '#22c55e',
    route: '/(education)/teacher-workspace',
  },
  {
    id: 'parent',
    title: 'I am a Parent',
    subtitle: 'Track your child, view grades, pay fees, and message teachers',
    icon: 'heart',
    color: '#ec4899',
    route: '/(education)/parent-dashboard',
  },
  {
    id: 'admin',
    title: 'I am School Staff',
    subtitle: 'Manage institution, staff, students, and operations',
    icon: 'shield',
    color: '#f59e0b',
    route: '/(education)/institution-profile',
  },
  {
    id: 'explore',
    title: 'Just Exploring',
    subtitle: 'Browse African education resources and institutions',
    icon: 'compass',
    color: '#8b5cf6',
    route: '/(education)/african-feed',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="school" size={48} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Welcome to MTAA Education</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Connecting schools across Africa. Select your role to get started.
        </Text>
      </View>

      {/* Role Cards */}
      <FlatList
        data={ROLES}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.roleCard,
              {
                backgroundColor: colors.card,
                borderColor: selectedRole === item.id ? item.color : colors.border,
                borderWidth: selectedRole === item.id ? 2 : 1,
              },
            ]}
            onPress={() => setSelectedRole(item.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.roleIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={[styles.roleTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.roleSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
            </View>
            {selectedRole === item.id && (
              <Ionicons name="checkmark-circle" size={24} color={item.color} />
            )}
          </TouchableOpacity>
        )}
      />

      {/* Continue Button */}
      {selectedRole && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              const role = ROLES.find((r: any) => r.id === selectedRole);
              if (role) router.push(role.route as any);
            }}
          >
            <Text style={styles.continueText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 40, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  subtitle: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  roleCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 12 },
  roleIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  roleInfo: { flex: 1, marginLeft: 14 },
  roleTitle: { fontSize: 16, fontWeight: '700' },
  roleSubtitle: { fontSize: 12, marginTop: 3, lineHeight: 18 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
