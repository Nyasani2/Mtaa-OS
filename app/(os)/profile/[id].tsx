import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Dimensions, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { useFollow } from '@/lib/social/hooks/useFollow';
import { useBlock } from '@/lib/social/hooks/useBlock';
import { useTip } from '@/lib/social/hooks/useTip';
import { useSubscription } from '@/lib/social/hooks/useSubscription';

const { width: SCREEN_W } = Dimensions.get('window');

interface PublicProfile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  profession: string | null;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  online_status: string;
  role: string;
}

export default function PublicProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const targetId = id;
  const isOwnProfile = user?.id === targetId;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isFollowing, followerCount, follow, unfollow } = useFollow(targetId);
  const { isBlocked, block, unblock } = useBlock(targetId);
  const { sendTip } = useTip();
  const { isSubscribed, subscriberCount, subscribe, cancel } = useSubscription(targetId);

  const fetchProfile = useCallback(async () => {
    if (!targetId) { setError('No user specified'); setLoading(false); return; }
    try {
      const { data, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, cover_photo_url, bio, city, country, profession, is_verified, follower_count, following_count, online_status, role')
        .eq('user_id', targetId)
        .single();
      if (pErr) throw pErr;
      setProfile(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle" size={48} color="#ff4444" />
        <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
        <TouchableOpacity onPress={fetchProfile} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = profile.display_name || profile.username || 'User';
  const location = [profile.city, profile.country].filter(Boolean).join(', ');

  const handleTip = () => {
    if (!isAuthenticated) { Alert.alert('Sign In', 'Please sign in to send tips'); return; }
    Alert.prompt('Send Tip', 'Enter amount (KES)', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: (amount) => { if (amount) sendTip(targetId!, parseFloat(amount)); } },
    ], 'plain-text');
  };

  const handleSubscribe = () => {
    if (!isAuthenticated) { Alert.alert('Sign In', 'Please sign in to subscribe'); return; }
    if (isSubscribed) {
      Alert.alert('Cancel Subscription?', '', [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: cancel },
      ]);
    } else {
      Alert.alert('Subscribe', 'Subscribe to creator tier?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Subscribe (KES 100/month)', onPress: () => subscribe('Standard', 100) },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.coverContainer}>
          {profile.cover_photo_url ? (
            <Image source={{ uri: profile.cover_photo_url }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]} />
          )}
          <View style={styles.coverOverlay} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          {!isOwnProfile && (
            <View style={styles.topActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push(`/streets/chat/${targetId}`)}>
                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => {}}>
                <Ionicons name="share-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.headerSection}>
          <View style={styles.avatarWrap}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
            <View style={[styles.onlineDot, { backgroundColor: profile.online_status === 'online' ? '#00ff88' : '#888' }]} />
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{displayName}</Text>
            {profile.is_verified && <Ionicons name="checkmark-circle" size={18} color="#00d4ff" />}
            {profile.role === 'creator' && <Ionicons name="sparkles" size={16} color="#ff00ff" style={{ marginLeft: 4 }} />}
          </View>

          <Text style={styles.username}>@{profile.username || 'user'}</Text>
          {profile.profession && (
            <View style={styles.professionRow}>
              <Ionicons name="briefcase-outline" size={12} color="#888" />
              <Text style={styles.professionText}>{profile.profession}</Text>
            </View>
          )}
          {location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color="#888" />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          ) : null}
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{followerCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile.following_count || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{subscriberCount}</Text>
              <Text style={styles.statLabel}>Subscribers</Text>
            </View>
          </View>

          {!isOwnProfile && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.primaryBtn, isFollowing && styles.followingBtn]}
                onPress={isFollowing ? unfollow : follow}
              >
                <Ionicons name={isFollowing ? 'checkmark' : 'person-add'} size={14} color={isFollowing ? '#fff' : '#000'} />
                <Text style={[styles.primaryBtnText, isFollowing && styles.followingBtnText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtn} onPress={handleTip}>
                <Ionicons name="cash-outline" size={14} color="#fff" />
                <Text style={styles.secondaryBtnText}>Tip</Text>
              </TouchableOpacity>

              {profile.role === 'creator' && (
                <TouchableOpacity style={[styles.secondaryBtn, isSubscribed && styles.subscribedBtn]} onPress={handleSubscribe}>
                  <Ionicons name={isSubscribed ? 'star' : 'star-outline'} size={14} color={isSubscribed ? '#ff00ff' : '#fff'} />
                  <Text style={[styles.secondaryBtnText, isSubscribed && { color: '#ff00ff' }]}>
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.iconActionBtn} onPress={() => {
                Alert.alert('More', '', [
                  { text: 'Message', onPress: () => router.push(`/streets/chat/${targetId}`) },
                  isBlocked
                    ? { text: 'Unblock', onPress: unblock }
                    : { text: 'Block', style: 'destructive', onPress: () => block() },
                  { text: 'Report', style: 'destructive', onPress: () => router.push(`/report?userId=${targetId}`) },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}>
                <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#ff4444', fontSize: 14, marginTop: 12, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: '#222', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: '#00d4ff', fontWeight: '700' },
  coverContainer: { width: SCREEN_W, height: 180, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { backgroundColor: '#111' },
  coverOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
  backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 16, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  topActions: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 16, right: 16, flexDirection: 'row', gap: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  headerSection: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  avatarWrap: { position: 'relative', alignSelf: 'flex-start', marginTop: -40 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#000' },
  avatarPlaceholder: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#000' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  displayName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  username: { color: '#888', fontSize: 14, marginTop: 2 },
  professionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  professionText: { color: '#aaa', fontSize: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  locationText: { color: '#888', fontSize: 12 },
  bio: { color: '#aaa', fontSize: 13, marginTop: 8, lineHeight: 18 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#1a1a1a', marginTop: 12 },
  stat: { alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#888', fontSize: 11, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00d4ff', paddingVertical: 10, borderRadius: 20, gap: 6 },
  primaryBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  followingBtn: { backgroundColor: '#222', borderWidth: 1, borderColor: '#444' },
  followingBtnText: { color: '#fff' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#222', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: '#333' },
  secondaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  subscribedBtn: { borderColor: '#ff00ff44' },
  iconActionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
});
