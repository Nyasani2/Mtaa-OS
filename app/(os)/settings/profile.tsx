import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function SettingsProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    // FIXED: profiles -> user_profiles
    supabase.from('user_profiles').select('display_name, username, email, phone, is_verified, role').eq('user_id', user.id).single()
      .then(({ data }) => { setProfile(data); setLoading(false); });
  }, [user?.id]);

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#2563EB" /></View>;

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { setSigningOut(true); try { await signOut(); router.replace('/login'); } catch { Alert.alert('Error', 'Failed to sign out'); } finally { setSigningOut(false); } } },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Permanent. Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete Forever', 
        style: 'destructive', 
        onPress: async () => { 
          setDeleting(true); 
          try { 
            // FIXED: profiles -> user_profiles
            const { error: deleteError } = await supabase.from('user_profiles').delete().eq('user_id', user?.id);
            if (deleteError) throw deleteError;

            const { error: rpcError } = await supabase.rpc('delete_user_account', { user_id: user?.id });
            if (rpcError) throw rpcError;

            await signOut(); 
            router.replace('/login'); 
          } catch (err: any) { 
            // FIXED: Removed .catch(() => {}) — now shows actual error
            Alert.alert('Error', err?.message || 'Failed to delete account. Please try again.'); 
          } finally { 
            setDeleting(false); 
          } 
        } 
      },
    ]);
  };

  const settings = [
    { label: 'Edit Profile', icon: 'create-outline', route: '/profile/edit', color: '#2563EB' },
    { label: 'Privacy', icon: 'lock-closed-outline', route: '/settings/privacy', color: '#059669' },
    { label: 'Security', icon: 'shield-checkmark-outline', route: '/settings/security', color: '#d97706' },
    { label: '2FA Authentication', icon: 'key-outline', route: '/settings/2fa', color: '#dc2626' },
    { label: 'Devices', icon: 'phone-portrait-outline', route: '/settings/devices', color: '#2563EB' },
    { label: 'Active Sessions', icon: 'desktop-outline', route: '/settings/sessions', color: '#7c3aed' },
    { label: 'Blocked Users', icon: 'ban-outline', route: '/settings/blocked', color: '#dc2626' },
    { label: 'Muted Users', icon: 'volume-mute-outline', route: '/settings/muted', color: '#64748b' },
    { label: 'Language', icon: 'language-outline', route: '/settings/language', color: '#059669' },
    { label: 'Theme', icon: 'color-palette-outline', route: '/settings/theme', color: '#7c3aed' },
    { label: 'Accessibility', icon: 'accessibility-outline', route: '/settings/accessibility', color: '#2563EB' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#0f172a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}><Text style={styles.avatarText}>{(profile?.display_name || 'U').charAt(0).toUpperCase()}</Text></View>
          <Text style={styles.profileName}>{profile?.display_name || 'User'}</Text>
          <Text style={styles.profileHandle}>{user?.email || profile?.email || ''}</Text>
          <View style={styles.badges}>
            {profile?.is_verified && <View style={styles.badge}><Ionicons name="shield-checkmark" size={12} color="#2563EB" /><Text style={styles.badgeText}>Verified</Text></View>}
            <View style={styles.badge}><Text style={styles.badgeText}>{profile?.role || 'User'}</Text></View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {settings.map((s: any) => <TouchableOpacity key={s.label} style={styles.row} onPress={() => router.push(s.route as any)}><Ionicons name={s.icon as any} size={20} color={s.color} /><Text style={styles.rowText}>{s.label}</Text><Ionicons name="chevron-forward" size={16} color="#cbd5e1" /></TouchableOpacity>)}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity style={[styles.row, styles.dangerRow]} onPress={handleLogout} disabled={signingOut}><Ionicons name="log-out-outline" size={20} color="#dc2626" /><Text style={[styles.rowText, { color: '#dc2626' }]}>{signingOut ? 'Signing out...' : 'Sign Out'}</Text>{signingOut && <ActivityIndicator size="small" color="#dc2626" />}</TouchableOpacity>
          <TouchableOpacity style={[styles.row, styles.dangerRow]} onPress={handleDeleteAccount} disabled={deleting}><Ionicons name="trash-outline" size={20} color="#dc2626" /><Text style={[styles.rowText, { color: '#dc2626' }]}>{deleting ? 'Deleting...' : 'Delete Account'}</Text>{deleting && <ActivityIndicator size="small" color="#dc2626" />}</TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { color: '#0f172a', fontSize: 18, fontWeight: '700' },
  profileCard: { alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  profileName: { color: '#0f172a', fontSize: 18, fontWeight: '700', marginTop: 12 },
  profileHandle: { color: '#64748b', fontSize: 14, marginTop: 4 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  badgeText: { color: '#64748b', fontSize: 11 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { color: '#0f172a', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  rowText: { color: '#0f172a', fontSize: 14, flex: 1, marginLeft: 12 },
  dangerRow: { borderColor: '#fecaca', backgroundColor: '#fef2f2' },
});
