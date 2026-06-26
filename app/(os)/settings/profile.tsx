import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function SettingsProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('display_name, username, email, phone, is_verified, role').eq('user_id', user.id).single()
      .then(({ data }) => { setProfile(data); setLoading(false); });
  }, [user?.id]);

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#00d4ff" /></View>;

  const settings = [
    { label: 'Edit Profile', icon: 'create-outline', route: '/profile/edit', color: '#00d4ff' },
    { label: 'Privacy', icon: 'lock-closed-outline', route: '/settings/privacy', color: '#00ff88' },
    { label: 'Security', icon: 'shield-checkmark-outline', route: '/settings/security', color: '#ffaa00' },
    { label: '2FA Authentication', icon: 'key-outline', route: '/settings/2fa', color: '#ff4444' },
    { label: 'Devices', icon: 'phone-portrait-outline', route: '/settings/devices', color: '#00d4ff' },
    { label: 'Active Sessions', icon: 'desktop-outline', route: '/settings/sessions', color: '#aa66ff' },
    { label: 'Blocked Users', icon: 'ban-outline', route: '/settings/blocked', color: '#ff4444' },
    { label: 'Muted Users', icon: 'volume-mute-outline', route: '/settings/muted', color: '#888' },
    { label: 'Language', icon: 'language-outline', route: '/settings/language', color: '#00ff88' },
    { label: 'Theme', icon: 'color-palette-outline', route: '/settings/theme', color: '#ff00ff' },
    { label: 'Accessibility', icon: 'accessibility-outline', route: '/settings/accessibility', color: '#00d4ff' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <Ionicons name="person-circle" size={56} color="#00d4ff" />
          <Text style={styles.profileName}>{profile?.display_name || 'User'}</Text>
          <Text style={styles.profileHandle}>@{profile?.username || 'user'}</Text>
          <View style={styles.badges}>
            {profile?.is_verified && <View style={styles.badge}><Ionicons name="shield-checkmark" size={12} color="#00d4ff" /><Text style={styles.badgeText}>Verified</Text></View>}
            <View style={styles.badge}><Text style={styles.badgeText}>{profile?.role || 'User'}</Text></View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {settings.map(s => (
            <TouchableOpacity key={s.label} style={styles.row} onPress={() => router.push(s.route as any)}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text style={styles.rowText}>{s.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#444" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity style={[styles.row, styles.dangerRow]} onPress={() => {}}>
            <Ionicons name="log-out-outline" size={20} color="#ff4444" />
            <Text style={[styles.rowText, { color: '#ff4444' }]}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.row, styles.dangerRow]} onPress={() => {}}>
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
            <Text style={[styles.rowText, { color: '#ff4444' }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  profileCard: { alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  profileName: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 12 },
  profileHandle: { color: '#888', fontSize: 14, marginTop: 4 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4, borderWidth: 1, borderColor: '#222' },
  badgeText: { color: '#888', fontSize: 11 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  rowText: { color: '#fff', fontSize: 14, flex: 1, marginLeft: 12 },
  dangerRow: { borderColor: '#ff444422' },
});
