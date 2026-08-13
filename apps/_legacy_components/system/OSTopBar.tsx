/**
 * MTAA OS — Top Bar (React Native)
 * Profile + kernel status + realtime connection + notifications.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useKernelState } from '@/hooks/useKernelState';
import { useAuth } from '@/hooks/useAuth';

export function OSTopBar() {
  const router = useRouter();
  const { phase, healthScore } = useKernelState();
  const { user, profile } = useAuth();

  const isOnline = phase === 'ready';
  const isDegraded = healthScore < 80;

  return (
    <View style={styles.container}>
      {/* Left: Profile */}
      <TouchableOpacity onPress={() => router.push('/profile' as any)} style={styles.profileBtn}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.full_name?.[0] || user?.email?.[0] || '?'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.full_name || user?.email?.split('@')[0] || 'Guest'}</Text>
          <Text style={styles.profileMeta}>{profile?.kyc_level ? `KYC L${profile.kyc_level}` : 'Unverified'}</Text>
        </View>
      </TouchableOpacity>

      {/* Center: Kernel Status */}
      <View style={styles.statusBox}>
        <View style={[styles.statusDot, { backgroundColor: isOnline ? '#34d399' : isDegraded ? '#fbbf24' : '#f87171' }]} />
        <Text style={styles.statusText}>{isOnline ? 'Online' : isDegraded ? 'Degraded' : 'Booting...'}</Text>
      </View>

      {/* Right: Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => router.push('/notifications' as any)} style={styles.iconBtn}>
          <Text style={styles.iconText}>🔔</Text>
          <View style={styles.badge} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/system-status' as any)} style={styles.iconBtn}>
          <Text style={styles.iconText}>📊</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  profileBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  profileInfo: { display: 'none' }, // Hidden on small screens, shown on larger
  profileName: { fontSize: 13, color: '#fff', fontWeight: '500' },
  profileMeta: { fontSize: 10, color: '#94a3b8' },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, color: '#94a3b8' },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6, position: 'relative' },
  iconText: { fontSize: 18 },
  badge: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
});
