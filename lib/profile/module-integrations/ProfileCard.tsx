// @ts-nocheck
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { Profile } from '../types';

interface ProfileCardProps {
  profile: Profile;
  compact?: boolean;
  showFollowButton?: boolean;
}

export function ProfileCard({ profile, compact = false, showFollowButton = true }: ProfileCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.compact]}
      onPress={() => router.push(`/(os)/profile/${profile.id}` as any)}
    >
      <Image source={{ uri: profile.avatar_url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }} style={styles.avatar} />
      <View style={styles.info}>
    // @ts-ignore
        <Text style={styles.name}>{profile.display_name || profile.username || 'Anonymous'}</Text>
    // @ts-ignore
        {profile.profession && <Text style={styles.profession}>{profile.profession}</Text>}
    // @ts-ignore
        {profile.is_verified && <Text style={styles.badge}>✓ Verified</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 12, marginBottom: 8 },
  compact: { padding: 8 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  profession: { fontSize: 13, color: '#6B7280' },
  badge: { fontSize: 12, color: '#3B82F6', marginTop: 2 },
});
