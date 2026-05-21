// app/(os)/settings/index.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [biometrics, setBiometrics] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person', label: 'Profile', route: '/settings/profile', color: '#3B82F6' },
        { icon: 'lock-closed', label: 'Change Password', route: '/settings/change-password', color: '#10B981' },
        { icon: 'card', label: 'Payment Methods', route: '/settings/payment-methods', color: '#F59E0B' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications', label: 'Notifications', route: '/settings/notifications', color: '#8B5CF6' },
        { icon: 'alert-circle', label: 'Transaction Alerts', route: '/settings/tx-alerts', color: '#EF4444' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle', label: 'Help Center', route: '/settings/help', color: '#06B6D4' },
        { icon: 'bug', label: 'Report a Bug', route: '/settings/bug-report', color: '#EC4899' },
        { icon: 'shield', label: 'Privacy Policy', route: '/settings/privacy', color: '#84CC16' },
        { icon: 'document-text', label: 'Terms of Service', route: '/settings/terms', color: '#64748B' },
        { icon: 'information-circle', label: 'About', route: '/settings/about', color: '#64748B' },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person-circle" size={64} color="#3B82F6" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.full_name || user?.email || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{profile?.kyc_status || 'Unverified'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.toggleSection}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Ionicons name="finger-print" size={20} color="#1E293B" />
            <Text style={styles.toggleLabel}>Biometric Login</Text>
          </View>
          <Switch value={biometrics} onValueChange={setBiometrics} trackColor={{ false: '#E2E8F0', true: '#3B82F6' }} />
        </View>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Ionicons name="moon" size={20} color="#1E293B" />
            <Text style={styles.toggleLabel}>Dark Mode</Text>
          </View>
          <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: '#E2E8F0', true: '#3B82F6' }} />
        </View>
      </View>

      {menuSections.map((section, sIdx) => (
        <View key={sIdx} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item, iIdx) => (
            <TouchableOpacity key={iIdx} style={styles.menuItem} onPress={() => router.push(item.route as any)}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Ionicons name="log-out" size={20} color="#EF4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>MTAA OS v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1E293B' },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 16, padding: 16, borderRadius: 16, marginBottom: 16 },
  avatar: { marginRight: 16 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  profileEmail: { fontSize: 14, color: '#64748B', marginTop: 2 },
  badge: { backgroundColor: '#DBEAFE', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 6 },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#3B82F6' },
  toggleSection: { backgroundColor: '#FFF', marginHorizontal: 16, borderRadius: 16, marginBottom: 16, padding: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 8 },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleLabel: { fontSize: 16, color: '#1E293B' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: 20, marginBottom: 8, marginTop: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14, marginHorizontal: 16, marginBottom: 1 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 16, color: '#1E293B' },
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', marginHorizontal: 16, padding: 16, borderRadius: 12, gap: 8, marginBottom: 16 },
  signOutText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
  version: { textAlign: 'center', fontSize: 12, color: '#94A3B8', marginBottom: 32 },
});
