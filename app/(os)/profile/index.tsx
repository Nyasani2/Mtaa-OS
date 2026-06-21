// app/(os)/profile/index.tsx — MTAA Identity Engine Dashboard
// v3.1: Uses full_name, username, bio, location, avatar_url, cover_url from actual schema

import { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator,
  ScrollView, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, profile, isLoading, isAuthenticated, initialize, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => { initialize(); }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading identity...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <View style={styles.notSignedCard}>
          <Ionicons name="person-circle-outline" size={64} color="#ccc" />
          <Text style={styles.notSignedTitle}>Not Signed In</Text>
          <Text style={styles.notSignedText}>Sign in to view your MTAA Identity</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/auth/sign-in')}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createAccountBtn} onPress={() => router.push('/auth/signup')}>
            <Text style={styles.createAccountText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = user.full_name || user.display_name || user.username || user.email?.split('@')[0] || 'User';
  const handle = user.username ? `@${user.username}` : user.email;
  const avatarUri = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff`;
  const coverUri = user.cover_url || user.cover_photo_url;

  const sections = [
    { key: 'edit', icon: 'person-outline', label: 'Edit Profile', color: '#6366f1', route: '/(os)/profile/edit' },
    { key: 'wallet', icon: 'wallet-outline', label: 'Wallet', color: '#10b981', route: '/(os)/wallet' },
    { key: 'professional', icon: 'briefcase-outline', label: 'Professional CV', color: '#f59e0b', route: '/(os)/profile/professional' },
    { key: 'business', icon: 'storefront-outline', label: 'My Business', color: '#8b5cf6', route: '/(os)/profile/business' },
    { key: 'family', icon: 'people-outline', label: 'Family', color: '#ec4899', route: '/(os)/profile/family' },
    { key: 'creator', icon: 'create-outline', label: 'Creator', color: '#ef4444', route: '/(os)/profile/creator' },
    { key: 'reputation', icon: 'star-outline', label: 'Reputation', color: '#f97316', route: '/(os)/profile/reputation' },
    { key: 'qr', icon: 'qr-code-outline', label: 'QR Identity', color: '#06b6d4', route: '/(os)/profile/qr' },
    { key: 'documents', icon: 'document-text-outline', label: 'Documents', color: '#64748b', route: '/(os)/profile/documents' },
    { key: 'assets', icon: 'cube-outline', label: 'Assets', color: '#84cc16', route: '/(os)/profile/assets' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover + Avatar Header */}
        <View style={styles.header}>
          {coverUri && (
            <Image source={{ uri: coverUri }} style={styles.coverImage} />
          )}
          <View style={[styles.avatarWrap, coverUri && styles.avatarWrapOverlay]}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {handle && <Text style={styles.handle}>{handle}</Text>}
          {user.bio && <Text style={styles.bio} numberOfLines={2}>{user.bio}</Text>}
          {user.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#888" />
              <Text style={styles.locationText}>{user.location}</Text>
            </View>
          )}
          {user.is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#fff" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
          {user.role !== 'user' && (
            <View style={[styles.roleBadge, { backgroundColor: user.role === 'admin' ? '#ef4444' : '#6366f1' }]}>
              <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/(os)/profile/edit')}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.content_count || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.followers_count || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.following_count || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.trust_score || 0}</Text>
            <Text style={styles.statLabel}>Trust</Text>
          </View>
        </View>

        {/* Section Grid */}
        <View style={styles.grid}>
          {sections.map((s) => (
            <TouchableOpacity key={s.key} style={styles.gridItem} onPress={() => router.push(s.route as any)}>
              <View style={[styles.gridIcon, { backgroundColor: s.color + '15' }]}>
                <Ionicons name={s.icon as any} size={24} color={s.color} />
              </View>
              <Text style={styles.gridLabel}>{s.label}</Text>
              <Ionicons name="chevron-forward" size={14} color="#999" style={styles.gridArrow} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom */}
        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/(os)/settings')}>
            <Ionicons name="settings-outline" size={22} color="#333" />
            <Text style={styles.rowText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.row, styles.signOutRow]} onPress={signOut}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text style={[styles.rowText, styles.signOutText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Completeness */}
        <View style={styles.completenessCard}>
          <Text style={styles.completenessLabel}>Profile Completeness</Text>
          <View style={styles.completenessBar}>
            <View style={[styles.completenessFill, { width: `${Math.min(user.profile_completeness || 0, 100)}%` }]} />
          </View>
          <Text style={styles.completenessText}>{user.profile_completeness || 0}% complete</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  notSignedCard: { alignItems: 'center', padding: 32 },
  notSignedTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginTop: 16 },
  notSignedText: { fontSize: 14, color: '#888', marginTop: 4, marginBottom: 24 },
  signInBtn: { backgroundColor: '#6366f1', paddingHorizontal: 48, paddingVertical: 14, borderRadius: 12, width: '80%', alignItems: 'center' },
  signInBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  createAccountBtn: { marginTop: 12 },
  createAccountText: { color: '#6366f1', fontSize: 14, fontWeight: '500' },

  header: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff', marginBottom: 12, position: 'relative' },
  coverImage: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  avatarWrap: { marginBottom: 12 },
  avatarWrapOverlay: { marginTop: 60 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#fff' },
  name: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  handle: { fontSize: 14, color: '#888', marginTop: 2 },
  bio: { fontSize: 13, color: '#666', marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  locationText: { fontSize: 12, color: '#888', marginLeft: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  verifiedText: { color: '#fff', fontSize: 11, fontWeight: '600', marginLeft: 4 },
  roleBadge: { marginTop: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  roleText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  editBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  editBtnText: { color: '#6366f1', fontSize: 13, fontWeight: '600' },

  statsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 16, marginBottom: 12 },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 12 },
  gridItem: { width: (width - 48) / 2, backgroundColor: '#fff', borderRadius: 12, padding: 16, margin: 4, flexDirection: 'row', alignItems: 'center' },
  gridIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  gridLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#333' },
  gridArrow: { marginLeft: 4 },

  bottomSection: { backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowText: { flex: 1, fontSize: 15, marginLeft: 12, color: '#333', fontWeight: '500' },
  signOutRow: { borderBottomWidth: 0 },
  signOutText: { color: '#ef4444' },

  completenessCard: { backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 12, padding: 16, marginBottom: 24 },
  completenessLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 8 },
  completenessBar: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  completenessFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 3 },
  completenessText: { fontSize: 12, color: '#888', marginTop: 6 },
});
