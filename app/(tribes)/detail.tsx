// @ts-nocheck
// app/(os)/tribes/[id].tsx
// Tribe Detail Screen — posts feed, events, members, donate, join/leave

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tribesService, Tribe, TribePost, TribeEvent, TribeMember } from '@/lib/tribes/services/tribes.service';

export default function TribeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const tribeId = id as string;

  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [posts, setPosts] = useState<TribePost[]>([]);
  const [events, setEvents] = useState<TribeEvent[]>([]);
  const [members, setMembers] = useState<TribeMember[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'events' | 'members' | 'about'>('posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [donateAmount, setDonateAmount] = useState('');
  const [showDonate, setShowDonate] = useState(false);

  const loadAll = useCallback(async () => {
    if (!tribeId) return;
    setLoading(true);
    const [tribeData, postsData, eventsData, membersData] = await Promise.all([
      tribesService.getTribe(tribeId),
      tribesService.getPosts(tribeId),
      tribesService.getEvents(tribeId),
      tribesService.getMembers(tribeId),
    ]);
    setTribe(tribeData);
    setPosts(postsData);
    setEvents(eventsData);
    setMembers(membersData);
    setLoading(false);
  }, [tribeId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleJoin = async () => {
    if (!tribe) return;
    setJoining(true);

    if (tribe.is_paid && tribe.membership_fee > 0) {
      const res = await tribesService.joinPaidTribe(tribeId);
      setJoining(false);
      if (res.success) {
        Alert.alert('Welcome!', `You are now a member of ${tribe.name}`);
        loadAll();
      } else {
        Alert.alert('Payment Required', res.error || 'Could not process payment');
      }
    } else {
      const res = await tribesService.joinTribe(tribeId);
      setJoining(false);
      if (res.success) {
        Alert.alert('Welcome!', `You joined ${tribe.name}`);
        loadAll();
      } else {
        Alert.alert('Error', res.error || 'Could not join');
      }
    }
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Tribe',
      `Are you sure you want to leave ${tribe?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            const res = await tribesService.leaveTribe(tribeId);
            if (res.success) {
              loadAll();
            } else {
              Alert.alert('Error', res.error || 'Could not leave');
            }
          },
        },
      ]
    );
  };

  const handleDonate = async () => {
    const amount = parseFloat(donateAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid donation amount');
      return;
    }
    const res = await tribesService.donate(tribeId, amount, 'KES');
    if (res.success) {
      Alert.alert('Thank You!', 'Your donation has been received');
      setDonateAmount('');
      setShowDonate(false);
      loadAll();
    } else {
      Alert.alert('Donation Failed', res.error || 'Could not process');
    }
  };

  const handleLike = async (postId: string) => {
    const res = await tribesService.toggleLike(postId);
    if (res.success) {
      setPosts(posts.map((p: any) => p.id === postId ? { ...p, is_liked: res.liked, like_count: p.like_count + (res.liked ? 1 : -1) } : p));
    }
  };

  const renderPost = (post: TribePost) => (
    <View key={post.id} style={styles.postCard}>
      <View style={styles.postHeader}>
        <Image
          source={{ uri: post.author?.avatar_url || 'https://via.placeholder.com/36' }}
          style={styles.postAvatar}
        />
        <View>
          <Text style={styles.postAuthor}>{post.author?.first_name} {post.author?.last_name}</Text>
          <Text style={styles.postTime}>{new Date(post.created_at).toLocaleDateString()}</Text>
        </View>
        {post.is_pinned && <Text style={styles.pinnedBadge}>📌 Pinned</Text>}
      </View>
      {post.title && <Text style={styles.postTitle}>{post.title}</Text>}
      <Text style={styles.postContent}>{post.content}</Text>
      {post.media_urls && post.media_urls.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
          {post.media_urls.map((url, idx) => (
            <Image key={idx} source={{ uri: url }} style={styles.mediaImage} />
          ))}
        </ScrollView>
      )}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(post.id)}>
          <Text style={[styles.actionText, post.is_liked && styles.actionTextActive]}>
            {post.is_liked ? '❤️' : '🤍'} {post.like_count}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/(os)/tribes/post/${post.id}` as any)}>
          <Text style={styles.actionText}>💬 {post.comment_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>↗️ {post.share_count}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEvent = (event: TribeEvent) => (
    <View key={event.id} style={styles.eventCard}>
      <View style={styles.eventDateBox}>
        <Text style={styles.eventDay}>{new Date(event.start_at).getDate()}</Text>
        <Text style={styles.eventMonth}>{new Date(event.start_at).toLocaleString('default', { month: 'short' })}</Text>
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventMeta}>📍 {event.location || 'Online'} • 👥 {event.attendee_count}{event.max_attendees ? `/${event.max_attendees}` : ''}</Text>
        <View style={styles.eventActions}>
          {['going', 'maybe', 'not_going'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.eventActionBtn, event.my_status === status && styles.eventActionBtnActive]}
              onPress={() => tribesService.setAttendance(event.id, status as any).then(loadAll)}
            >
              <Text style={event.my_status === status ? styles.eventActionTextActive : styles.eventActionText}>
                {status === 'going' ? '✓ Going' : status === 'maybe' ? '⊘ Maybe' : '✕ Not Going'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderMember = (member: TribeMember) => (
    <View key={member.id} style={styles.memberRow}>
      <Image
        source={{ uri: member.profile?.avatar_url || 'https://via.placeholder.com/40' }}
        style={styles.memberAvatar}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.profile?.first_name} {member.profile?.last_name}</Text>
        <Text style={styles.memberRole}>{member.role}</Text>
      </View>
      <Text style={styles.memberJoined}>{new Date(member.joined_at).toLocaleDateString()}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!tribe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyTitle}>Tribe not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
      >
        {/* Cover */}
        <Image source={{ uri: tribe.cover_url || 'https://via.placeholder.com/400x150' }} style={styles.coverImage} />

        {/* Tribe Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Image source={{ uri: tribe.avatar_url || 'https://via.placeholder.com/64' }} style={styles.infoAvatar} />
            <View style={styles.infoText}>
              <Text style={styles.infoName}>{tribe.name}</Text>
              <Text style={styles.infoCategory}>{tribe.category?.icon} {tribe.category?.name}</Text>
            </View>
          </View>
          <Text style={styles.infoDesc}>{tribe.description}</Text>
          <View style={styles.infoStats}>
            <Text style={styles.stat}>👥 {tribe.member_count.toLocaleString()} members</Text>
            <Text style={styles.stat}>📝 {tribe.post_count} posts</Text>
            {tribe.location && <Text style={styles.stat}>📍 {tribe.location}</Text>}
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            {tribe.is_member ? (
              <>
                <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
                  <Text style={styles.leaveBtnText}>Leave</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postBtn} onPress={() => router.push(`/(os)/tribes/post-create?tribeId=${tribeId}` as any)}>
                  <Text style={styles.postBtnText}>+ Post</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.joinBtn} onPress={handleJoin} disabled={joining}>
                <Text style={styles.joinBtnText}>
                  {joining ? 'Processing...' : tribe.is_paid ? `Join ${tribe.membership_currency} ${tribe.membership_fee}` : 'Join Tribe'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.donateBtn} onPress={() => setShowDonate(!showDonate)}>
              <Text style={styles.donateBtnText}>💰 Donate</Text>
            </TouchableOpacity>
          </View>

          {/* Donate Form */}
          {showDonate && (
            <View style={styles.donateForm}>
              <TextInput
                style={styles.donateInput}
                placeholder="Amount (KES)"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
                value={donateAmount}
                onChangeText={setDonateAmount}
              />
              <TouchableOpacity style={styles.donateSubmit} onPress={handleDonate}>
                <Text style={styles.donateSubmitText}>Send Donation</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {(['posts', 'events', 'members', 'about'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={activeTab === tab ? styles.tabTextActive : styles.tabText}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'posts' && (
            posts.length === 0 ? (
              <View style={styles.emptyTab}>
                <Text style={styles.emptyTabText}>No posts yet. Be the first to share!</Text>
              </View>
            ) : posts.map(renderPost)
          )}
          {activeTab === 'events' && (
            events.length === 0 ? (
              <View style={styles.emptyTab}>
                <Text style={styles.emptyTabText}>No upcoming events</Text>
              </View>
            ) : events.map(renderEvent)
          )}
          {activeTab === 'members' && (
            members.length === 0 ? (
              <View style={styles.emptyTab}>
                <Text style={styles.emptyTabText}>No members yet</Text>
              </View>
            ) : members.map(renderMember)
          )}
          {activeTab === 'about' && (
            <View style={styles.aboutCard}>
              <Text style={styles.aboutTitle}>About</Text>
              <Text style={styles.aboutText}>{tribe.description}</Text>
              {tribe.rules && (
                <>
                  <Text style={styles.aboutTitle}>Rules</Text>
                  <Text style={styles.aboutText}>{tribe.rules}</Text>
                </>
              )}
              {tribe.tags && tribe.tags.length > 0 && (
                <View style={styles.tagRow}>
                  {tribe.tags.map((tag, idx) => (
                    <View key={idx} style={styles.tagChip}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  coverImage: { width: '100%', height: 150, resizeMode: 'cover' },

  infoCard: { backgroundColor: '#1a1a2e', marginTop: -20, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: '#1a1a2e', marginTop: -48 },
  infoText: { marginLeft: 12, flex: 1 },
  infoName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  infoCategory: { fontSize: 13, color: '#888', marginTop: 2 },
  infoDesc: { fontSize: 14, color: '#aaa', lineHeight: 20, marginBottom: 12 },
  infoStats: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  stat: { fontSize: 13, color: '#888' },

  actionRow: { flexDirection: 'row', gap: 10 },
  joinBtn: { flex: 1, backgroundColor: '#007AFF', borderRadius: 12, padding: 12, alignItems: 'center' },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  leaveBtn: { flex: 1, backgroundColor: '#2a2a3e', borderRadius: 12, padding: 12, alignItems: 'center' },
  leaveBtnText: { color: '#ff3b30', fontWeight: '700', fontSize: 14 },
  postBtn: { backgroundColor: '#007AFF', borderRadius: 12, padding: 12, alignItems: 'center', paddingHorizontal: 16 },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  donateBtn: { backgroundColor: '#f5a62320', borderRadius: 12, padding: 12, alignItems: 'center', paddingHorizontal: 16 },
  donateBtnText: { color: '#f5a623', fontWeight: '700', fontSize: 14 },

  donateForm: { marginTop: 12, gap: 8 },
  donateInput: { backgroundColor: '#0f0f1a', borderRadius: 10, padding: 12, fontSize: 15, color: '#fff', borderWidth: 1, borderColor: '#2a2a3e' },
  donateSubmit: { backgroundColor: '#f5a623', borderRadius: 10, padding: 12, alignItems: 'center' },
  donateSubmitText: { color: '#0a0a0f', fontWeight: '700', fontSize: 14 },

  tabBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#007AFF' },
  tabText: { fontSize: 14, color: '#888' },
  tabTextActive: { fontSize: 14, color: '#fff', fontWeight: '700' },

  tabContent: { paddingHorizontal: 16, paddingBottom: 40 },

  // Posts
  postCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 14, marginBottom: 12 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  postAuthor: { fontSize: 14, fontWeight: '600', color: '#fff' },
  postTime: { fontSize: 11, color: '#666', marginTop: 2 },
  pinnedBadge: { fontSize: 11, color: '#f5a623', marginLeft: 'auto' },
  postTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 6 },
  postContent: { fontSize: 14, color: '#ccc', lineHeight: 20, marginBottom: 10 },
  mediaScroll: { marginBottom: 10 },
  mediaImage: { width: 200, height: 150, borderRadius: 10, marginRight: 8 },
  postActions: { flexDirection: 'row', gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 13, color: '#888' },
  actionTextActive: { fontSize: 13, color: '#ff3b30' },

  // Events
  eventCard: { flexDirection: 'row', backgroundColor: '#1a1a2e', borderRadius: 14, padding: 14, marginBottom: 12 },
  eventDateBox: { backgroundColor: '#007AFF20', borderRadius: 12, padding: 10, alignItems: 'center', marginRight: 14, minWidth: 56 },
  eventDay: { fontSize: 22, fontWeight: '800', color: '#007AFF' },
  eventMonth: { fontSize: 11, color: '#007AFF', textTransform: 'uppercase' },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4 },
  eventMeta: { fontSize: 12, color: '#888', marginBottom: 8 },
  eventActions: { flexDirection: 'row', gap: 6 },
  eventActionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#0f0f1a' },
  eventActionBtnActive: { backgroundColor: '#007AFF' },
  eventActionText: { fontSize: 11, color: '#888' },
  eventActionTextActive: { fontSize: 11, color: '#fff', fontWeight: '600' },

  // Members
  memberRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 12, marginBottom: 8 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  memberRole: { fontSize: 12, color: '#888', textTransform: 'capitalize' },
  memberJoined: { fontSize: 11, color: '#666' },

  // About
  aboutCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12 },
  aboutTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 8, marginTop: 12 },
  aboutText: { fontSize: 14, color: '#aaa', lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tagChip: { backgroundColor: '#0f0f1a', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: 12, color: '#007AFF' },

  emptyTab: { alignItems: 'center', paddingVertical: 40 },
  emptyTabText: { fontSize: 14, color: '#666' },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
  backLink: { fontSize: 14, color: '#007AFF' },
});
