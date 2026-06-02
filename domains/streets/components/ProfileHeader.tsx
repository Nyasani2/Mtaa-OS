import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useProfile } from '../hooks/useProfile';

interface ProfileHeaderProps {
  userId?: string;
  onEditPress: () => void;
  onFollowPress: () => void;
}

export function ProfileHeader({ userId, onEditPress, onFollowPress }: ProfileHeaderProps) {
  const { profile, stats, follow, unfollow } = useProfile(userId);

  if (!profile) return null;

  return (
    <View style={styles.container}>
      <Image source={{ uri: profile.avatar }} style={styles.avatar} />
      <Text style={styles.name}>{profile.displayName}</Text>
      <Text style={styles.handle}>@{profile.username}</Text>
      <Text style={styles.bio}>{profile.bio}</Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{stats?.postCount || 0}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{stats?.followerCount || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{stats?.followingCount || 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {profile.isOwnProfile ? (
        <Pressable style={styles.editBtn} onPress={onEditPress}>
          <Text style={styles.editText}>Edit Profile</Text>
        </Pressable>
      ) : (
        <Pressable
          style={[styles.followBtn, profile.isFollowing && styles.followingBtn]}
          onPress={() => profile.isFollowing ? unfollow.mutate(profile.id) : follow.mutate(profile.id)}
        >
          <Text style={[styles.followText, profile.isFollowing && styles.followingText]}>
            {profile.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700' },
  handle: { fontSize: 14, color: '#888', marginBottom: 8 },
  bio: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 16 },
  stats: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#888' },
  editBtn: { borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 8 },
  editText: { fontWeight: '600' },
  followBtn: { backgroundColor: '#E91E63', paddingHorizontal: 32, paddingVertical: 10, borderRadius: 8 },
  followText: { color: '#fff', fontWeight: '700' },
  followingBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  followingText: { color: '#333' },
});
