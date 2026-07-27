import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  RefreshControl, ActivityIndicator, Alert, Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import {
  User, Settings, ChevronRight, Shield, Award, Briefcase,
  Users, QrCode, TrendingUp, Edit3, LogOut, CreditCard,
  MessageCircle, Bell, Globe, MapPin, Link, Star, Copy
} from 'lucide-react-native';

// Conditional clipboard import
let Clipboard: any = null;
try {
   
  Clipboard = require('expo-clipboard');
} catch {
  Clipboard = null;
}

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  verified: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  reputation_score: number;
}

function getFallbackProfile(user: any): ProfileData {
  return {
    id: user?.id || '',
    full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Your Name',
    avatar_url: null,
    bio: null,
    location: null,
    website: null,
    verified: false,
    followers_count: 0,
    following_count: 0,
    posts_count: 0,
    reputation_score: 0,
  };
}

export default function ProfileIndex() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  // IMMEDIATE RENDER: compute fallback from user metadata, no async
  const displayProfile = profile || (user ? getFallbackProfile(user) : null);

  // Background fetch — fire once on mount, no deps that change
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setSyncing(true);

    const timeout = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (cancelled) return;

        if (data) {
          setProfile(data);
        } else if (error && error.code === 'PGRST116') {
          // No row found — create one silently
          const fallback = getFallbackProfile(user);
          await supabase.from('user_profiles').upsert({
            id: user.id,
            full_name: fallback.full_name,
            avatar_url: null,
            bio: null,
            location: null,
            website: null,
            verified: false,
            followers_count: 0,
            following_count: 0,
            posts_count: 0,
            reputation_score: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setProfile(fallback);
        }
      } catch (err) {
        console.error('Profile sync error:', err);
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }, 100); // 100ms delay lets React finish first render

    return () => { cancelled = true; clearTimeout(timeout); };
  }, []); // EMPTY deps — runs once only

  const onRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    try {
      const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyLink = async () => {
    const link = `https://mtaa.app/u/${user?.id}`;
    if (Clipboard?.setStringAsync) {
      await Clipboard.setStringAsync(link);
    } else {
      Alert.alert('Copy Link', link);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/login'); } }
    ]);
  };

  const menuItems = [
    { icon: Edit3, label: 'Edit Profile', route: '/(os)/profile/edit', color: '#38bdf8' },
    { icon: Shield, label: 'Privacy & Security', route: '/(os)/profile/privacy', color: '#a78bfa' },
    { icon: Award, label: 'Achievements', route: '/(os)/profile/achievements', color: '#fbbf24' },
    { icon: Briefcase, label: 'Professional', route: '/(os)/profile/professional', color: '#34d399' },
    { icon: Users, label: 'Family', route: '/(os)/profile/family', color: '#fb923c' },
    { icon: QrCode, label: 'My QR Code', route: '/(os)/profile/qr', color: '#f472b6' },
    { icon: TrendingUp, label: 'Analytics', route: '/(os)/profile/analytics', color: '#60a5fa' },
    { icon: CreditCard, label: 'Creator Earnings', route: '/(os)/profile/earnings', color: '#10b981' },
    { icon: MessageCircle, label: 'Messages', route: '/(os)/messages', color: '#818cf8' },
    { icon: Bell, label: 'Notifications', route: '/(os)/notifications', color: '#f87171' },
    { icon: Settings, label: 'Settings', route: '/(os)/settings', color: '#94a3b8' },
  ];

  // If absolutely no user, show minimal state
  if (!displayProfile) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={{ color: '#64748b', marginTop: 12 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {displayProfile.avatar_url ? (
            <Image source={{ uri: displayProfile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={40} color="#94a3b8" />
            </View>
          )}
          {displayProfile.verified && (
            <View style={styles.verifiedBadge}>
              <Star size={12} color="#0f172a" fill="#fbbf24" />
            </View>
          )}
        </View>
        <Text style={styles.name}>{displayProfile.full_name || 'Your Name'}</Text>
        <Text style={styles.handle}>@{user?.email?.split('@')[0] || 'user'}</Text>
        {displayProfile.bio ? <Text style={styles.bio}>{displayProfile.bio}</Text> : null}

        <View style={styles.metaRow}>
          {displayProfile.location && (
            <View style={styles.metaItem}>
              <MapPin size={14} color="#64748b" />
              <Text style={styles.metaText}>{displayProfile.location}</Text>
            </View>
          )}
          {displayProfile.website && (
            <View style={styles.metaItem}>
              <Link size={14} color="#64748b" />
              <Text style={styles.metaText}>{displayProfile.website}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{displayProfile.posts_count || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{displayProfile.followers_count || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{displayProfile.following_count || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{displayProfile.reputation_score || 0}</Text>
            <Text style={styles.statLabel}>Rep</Text>
          </View>
        </View>

        {/* Copy Link */}
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
          <Copy size={16} color="#38bdf8" />
          <Text style={styles.copyText}>{copied ? 'Copied!' : 'Copy Profile Link'}</Text>
        </TouchableOpacity>

        {syncing && (
          <Text style={styles.syncText}>Syncing profile...</Text>
        )}
      </View>

      {/* Menu */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
              <item.icon size={20} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <ChevronRight size={18} color="#475569" />
          </Pressable>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={18} color="#ef4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  header: { alignItems: 'center', padding: 24, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#38bdf8' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#334155' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fbbf24', borderRadius: 10, padding: 4, borderWidth: 2, borderColor: '#0f172a' },
  name: { fontSize: 24, fontWeight: '700', color: '#f8fafc', marginBottom: 4 },
  handle: { fontSize: 14, color: '#64748b', marginBottom: 8 },
  bio: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 12, paddingHorizontal: 20 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#64748b' },
  statsRow: { flexDirection: 'row', gap: 24 },
  stat: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#f8fafc' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  copyButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#1e293b', borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
  copyText: { fontSize: 13, color: '#38bdf8', fontWeight: '600' },
  syncText: { fontSize: 11, color: '#64748b', marginTop: 8, fontStyle: 'italic' },
  menuContainer: { padding: 16, gap: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#1e293b', borderRadius: 12, marginBottom: 8 },
  menuItemPressed: { opacity: 0.7 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, color: '#e2e8f0', fontWeight: '500' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 8, padding: 14, backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#ef444440' },
  logoutText: { fontSize: 15, color: '#ef4444', fontWeight: '600' },
});