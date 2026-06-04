import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useOSKernel } from '@/hooks/useOSKernel';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    items: [
      { id: 'profile', label: 'Profile', icon: 'person-outline', route: '/settings/profile' },
      { id: 'security', label: 'Security & PIN', icon: 'lock-closed-outline', route: '/settings/security' },
      { id: 'kyc', label: 'Identity Verification', icon: 'id-card-outline', route: '/settings/kyc' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { id: 'notifications', label: 'Notifications', icon: 'notifications-outline', route: '/settings/notifications' },
      { id: 'language', label: 'Language', icon: 'language-outline', route: '/settings/language' },
      { id: 'theme', label: 'Appearance', icon: 'color-palette-outline', route: '/settings/theme' },
    ],
  },
  {
    title: 'System',
    items: [
      { id: 'storage', label: 'Storage & Cache', icon: 'server-outline', route: '/settings/storage' },
      { id: 'about', label: 'About MTAA OS', icon: 'information-circle-outline', route: '/settings/about' },
      { id: 'help', label: 'Help & Support', icon: 'help-circle-outline', route: '/settings/help' },
    ],
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { kernel } = useOSKernel();

  const [biometrics, setBiometrics] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout?.();
              router.replace('/auth/login');
            } catch (err) {
              console.error('[Settings] logout error:', err);
            }
          },
        },
      ]
    );
  }, [logout, router]);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Clear Cache',
      'This will remove temporary files. Your data will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            kernel?.storage?.clearCache?.();
            Alert.alert('Done', 'Cache cleared successfully');
          },
        },
      ]
    );
  }, [kernel]);

  const renderItem = useCallback((item: any) => {
    if (item.id === 'biometrics') {
      return (
        <View key={item.id} style={styles.row}>
          <Ionicons name={item.icon as any} size={22} color={COLORS.primary} style={styles.rowIcon} />
          <Text style={styles.rowLabel}>{item.label}</Text>
          <Switch value={biometrics} onValueChange={setBiometrics} trackColor={{ true: COLORS.primary }} />
        </View>
      );
    }
    if (item.id === 'analytics') {
      return (
        <View key={item.id} style={styles.row}>
          <Ionicons name={item.icon as any} size={22} color={COLORS.primary} style={styles.rowIcon} />
          <Text style={styles.rowLabel}>{item.label}</Text>
          <Switch value={analytics} onValueChange={setAnalytics} trackColor={{ true: COLORS.primary }} />
        </View>
      );
    }
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.row}
        onPress={() => {
          if (item.id === 'storage') { handleClearCache(); return; }
          if (item.route) router.push(item.route as any);
        }}
      >
        <Ionicons name={item.icon as any} size={22} color={COLORS.primary} style={styles.rowIcon} />
        <Text style={styles.rowLabel}>{item.label}</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
    );
  }, [biometrics, analytics, router, handleClearCache]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userPhone}>{user?.phone || user?.email || 'No contact info'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings/profile' as any)}>
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Toggles */}
        <View style={styles.section}>
          {renderItem({ id: 'biometrics', label: 'Biometric Unlock', icon: 'finger-print-outline' })}
          {renderItem({ id: 'analytics', label: 'Share Analytics', icon: 'bar-chart-outline' })}
        </View>

        {/* Sections */}
        {SETTINGS_SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map(renderItem)}
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} style={{ marginRight: SIZES.sm }} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>MTAA OS v1.0.0 · Build 20250603</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  scroll: { paddingHorizontal: SIZES.md, paddingBottom: SIZES.xl },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontFamily: FONTS.bold, fontSize: 22, color: '#fff' },
  userInfo: { flex: 1, marginLeft: SIZES.md },
  userName: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  userPhone: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    marginBottom: SIZES.lg,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rowIcon: { marginRight: SIZES.md },
  rowLabel: { flex: 1, fontFamily: FONTS.medium, fontSize: 15, color: COLORS.text },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    paddingVertical: SIZES.md,
    marginBottom: SIZES.lg,
  },
  logoutText: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.danger },
  version: { textAlign: 'center', fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textSecondary, marginBottom: SIZES.xl },
});
