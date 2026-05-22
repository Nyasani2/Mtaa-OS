import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/stores/auth-store';

const settingsSections = [
  { title: 'Account', items: [
    { icon: 'person', label: 'Profile', action: () => {} },
    { icon: 'shield-checkmark', label: 'Security', action: () => {} },
    { icon: 'key', label: 'Change PIN', action: () => {} },
  ]},
  { title: 'Preferences', items: [
    { icon: 'notifications', label: 'Notifications', toggle: true },
    { icon: 'moon', label: 'Dark Mode', toggle: true, value: true },
    { icon: 'globe', label: 'Language', value: 'English' },
  ]},
  { title: 'System', items: [
    { icon: 'information-circle', label: 'About MTAA', action: () => {} },
    { icon: 'help-circle', label: 'Help & Support', action: () => {} },
    { icon: 'log-out', label: 'Sign Out', action: () => {}, danger: true },
  ]},
];

export function SettingsShell() {
  const { user, signOut } = useAuthStore();
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.email}>{user?.email || 'Guest'}</Text>
      </View>
      {settingsSections.map((section, si) => (
        <View key={si} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item, ii) => (
            <TouchableOpacity key={ii} style={styles.row} onPress={item.label === 'Sign Out' ? signOut : item.action}>
              <Ionicons name={item.icon as any} size={20} color={item.danger ? '#EF4444' : '#94A3B8'} />
              <Text style={[styles.rowLabel, item.danger && styles.dangerText]}>{item.label}</Text>
              {item.toggle ? (
                <Switch value={item.value} />
              ) : (
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
  header: { padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  email: { color: '#94A3B8', marginTop: 4 },
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle: { color: '#64748B', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 14, borderRadius: 12, marginBottom: 8 },
  rowLabel: { flex: 1, color: 'white', fontSize: 15, marginLeft: 12 },
  dangerText: { color: '#EF4444' },
});
