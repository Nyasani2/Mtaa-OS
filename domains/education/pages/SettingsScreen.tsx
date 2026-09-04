import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [homeworkReminders, setHomeworkReminders] = useState(true);
  const [transportAlerts, setTransportAlerts] = useState(true);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut?.() },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Preferences',
      items: [
        {
          icon: 'moon',
          label: 'Dark Mode',
          right: <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#d1d5db', true: colors.primary }} />,
        },
        {
          icon: 'notifications',
          label: 'Push Notifications',
          right: <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: '#d1d5db', true: colors.primary }} />,
        },
      ],
    },
    {
      title: 'Education Alerts',
      items: [
        {
          icon: 'book',
          label: 'Homework Reminders',
          right: <Switch value={homeworkReminders} onValueChange={setHomeworkReminders} trackColor={{ false: '#d1d5db', true: colors.primary }} />,
        },
        {
          icon: 'bus',
          label: 'Transport Alerts',
          right: <Switch value={transportAlerts} onValueChange={setTransportAlerts} trackColor={{ false: '#d1d5db', true: colors.primary }} />,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: 'person',
          label: 'Profile',
          onPress: () => router.push('/(os)/profile' as any),
        },
        {
          icon: 'shield-checkmark',
          label: 'Teacher Verification',
          onPress: () => router.push('/(education)/verification' as any),
        },
        {
          icon: 'help-circle',
          label: 'Help & Support',
          onPress: () => router.push('/(os)/help' as any),
        },
      ],
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Education Settings</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Manage your preferences</Text>
      </View>

      {settingsSections.map((section, idx) => (
        <View key={idx} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {section.items.map((item, itemIdx) => (
              <TouchableOpacity
                key={itemIdx}
                style={[styles.settingRow, itemIdx < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                onPress={item.onPress}
                disabled={!item.onPress}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                  <Text style={[styles.settingLabel, { color: colors.text }]}>{item.label}</Text>
                </View>
                {item.right || <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Sign Out */}
      <View style={styles.section}>
        <TouchableOpacity style={[styles.signOutBtn, { borderColor: colors.error }]} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.version, { color: colors.textSecondary }]}>MTAA Education v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 15 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  signOutText: { fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', marginTop: 24, fontSize: 12 },
});
