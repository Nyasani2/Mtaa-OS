import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

type CommunityTab = 'posts' | 'polls' | 'stories' | 'announcements' | 'groups';

interface CommunityPost {
  id: string;
  author_name: string;
  author_avatar?: string | null;
  content: string;
  image_url?: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_pinned: boolean;
}

interface Poll {
  id: string;
  question: string;
  options: { text: string; votes: number }[];
  total_votes: number;
  ends_at?: string;
  has_voted: boolean;
}

interface Group {
  id: string;
  name: string;
  description: string;
  member_count: number;
  is_private: boolean;
  is_member: boolean;
  cover_url?: string | null;
}

export default function CommunityScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<CommunityTab>('posts');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [newPost, setNewPost] = useState('');
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  useEffect(() => {
    fetchPosts();
    fetchPolls();
    fetchGroups();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data } = await supabase
        .from('studio_community_posts')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);
      setPosts(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchPolls = async () => {
    try {
      const { data } = await supabase
        .from('studio_polls')
        .select('*')
        .order('created_at', { ascending: false });
      setPolls(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchGroups = async () => {
    try {
      const { data } = await supabase
        .from('studio_groups')
        .select('*')
        .order('member_count', { ascending: false });
      setGroups(data || []);
    } catch (e) { console.error(e); }
  };

  const createPost = async () => {
    if (!newPost.trim() || !user?.id) return;
    try {
      await supabase.from('studio_community_posts').insert({
        creator_id: user.id,
        author_name: user.user_metadata?.full_name || 'Creator',
        content: newPost,
      });
      setNewPost('');
      fetchPosts();
    } catch (e) { console.error(e); }
  };

  const createPoll = async () => {
    if (!pollQuestion.trim() || pollOptions.some(o => !o.trim()) || !user?.id) return;
    try {
      await supabase.from('studio_polls').insert({
        creator_id: user.id,
        question: pollQuestion,
        options: pollOptions.map(text => ({ text, votes: 0 })),
        total_votes: 0,
      });
      setPollQuestion('');
      setPollOptions(['', '']);
      setCreatingPoll(false);
      fetchPolls();
    } catch (e) { console.error(e); }
  };

  const votePoll = async (pollId: string, optionIndex: number) => {
    try {
      await supabase.rpc('vote_poll', { poll_uuid: pollId, option_idx: optionIndex });
      fetchPolls();
    } catch (e) { console.error(e); }
  };

  const joinGroup = async (groupId: string) => {
    if (!user?.id) return;
    try {
      await supabase.from('studio_group_members').insert({ group_id: groupId, user_id: user.id });
      fetchGroups();
    } catch (e) { console.error(e); }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const renderPosts = () => (
    <FlatList
      data={posts}
      keyExtractor={p => p.id}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.postComposer}>
          <View style={styles.composerAvatar}>
            <Text style={styles.composerAvatarText}>{user?.user_metadata?.full_name?.charAt(0).toUpperCase() || 'U'}</Text>
          </View>
          <TextInput
            style={styles.composerInput}
            placeholder="Share with your community..."
            placeholderTextColor="#666"
            value={newPost}
            onChangeText={setNewPost}
            multiline
          />
          <TouchableOpacity style={styles.composerBtn} onPress={createPost} disabled={!newPost.trim()}>
            <Feather name="send" size={18} color={newPost.trim() ? '#6366f1' : '#666'} />
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.postCard, item.is_pinned && styles.postPinned]}>
          {item.is_pinned && (
            <View style={styles.pinnedBadge}>
              <Feather name="map-pin" size={10} color="#f59e0b" />
              <Text style={styles.pinnedText}>Pinned</Text>
            </View>
          )}
          <View style={styles.postHeader}>
            <View style={styles.postAvatar}>
              <Text style={styles.postAvatarText}>{item.author_name.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.postAuthor}>{item.author_name}</Text>
              <Text style={styles.postTime}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
          <Text style={styles.postContent}>{item.content}</Text>
          {item.image_url && (
            <View style={styles.postImage}>
              <Text style={styles.postImageText}>Image</Text>
            </View>
          )}
          <View style={styles.postActions}>
            <TouchableOpacity style={styles.postAction}>
              <Feather name="heart" size={16} color="#666" />
              <Text style={styles.postActionText}>{item.likes_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postAction}>
              <Feather name="message-circle" size={16} color="#666" />
              <Text style={styles.postActionText}>{item.comments_count}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postAction}>
              <Feather name="share-2" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );

  const renderPolls = () => (
    <FlatList
      data={polls}
      keyExtractor={p => p.id}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          <TouchableOpacity style={styles.createPollBtn} onPress={() => setCreatingPoll(!creatingPoll)}>
            <Feather name="plus-circle" size={18} color="#6366f1" />
            <Text style={styles.createPollText}>Create Poll</Text>
          </TouchableOpacity>
          {creatingPoll && (
            <View style={styles.pollForm}>
              <TextInput style={styles.formInput} value={pollQuestion} onChangeText={setPollQuestion} placeholder="Ask a question..." placeholderTextColor="#666" />
              {pollOptions.map((opt, i) => (
                <TextInput key={i} style={styles.formInput} value={opt} onChangeText={v => {
                  const newOpts = [...pollOptions];
                  newOpts[i] = v;
                  setPollOptions(newOpts);
                }} placeholder={`Option ${i + 1}`} placeholderTextColor="#666" />
              ))}
              <TouchableOpacity onPress={() => setPollOptions([...pollOptions, ''])}>
                <Text style={styles.addOptionText}>+ Add Option</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={createPoll}>
                <Text style={styles.createBtnText}>Post Poll</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.pollCard}>
          <Text style={styles.pollQuestion}>{item.question}</Text>
          {item.options.map((opt, i) => {
            const pct = item.total_votes > 0 ? (opt.votes / item.total_votes) * 100 : 0;
            return (
              <TouchableOpacity key={i} style={styles.pollOption} onPress={() => !item.has_voted && votePoll(item.id, i)} disabled={item.has_voted}>
                <View style={styles.pollOptionRow}>
                  <Text style={styles.pollOptionText}>{opt.text}</Text>
                  <Text style={styles.pollOptionVotes}>{opt.votes} votes</Text>
                </View>
                <View style={styles.pollBarBg}>
                  <View style={[styles.pollBar, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.pollPct}>{pct.toFixed(1)}%</Text>
              </TouchableOpacity>
            );
          })}
          <Text style={styles.pollTotal}>{item.total_votes} total votes</Text>
        </View>
      )}
    />
  );

  const renderStories = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.storiesContainer}>
      <TouchableOpacity style={styles.myStory}>
        <View style={styles.myStoryCircle}>
          <Feather name="plus" size={24} color="#6366f1" />
        </View>
        <Text style={styles.myStoryText}>Your Story</Text>
      </TouchableOpacity>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesScroll}>
        {[
          { name: 'Amina', color: '#ef4444' },
          { name: 'Kofi', color: '#10b981' },
          { name: 'Nia', color: '#6366f1' },
          { name: 'Osei', color: '#f59e0b' },
          { name: 'Zara', color: '#ec4899' },
        ].map((s, i) => (
          <TouchableOpacity key={i} style={styles.storyItem}>
            <View style={[styles.storyRing, { borderColor: s.color }]}>
              <View style={styles.storyAvatar}>
                <Text style={styles.storyAvatarText}>{s.name.charAt(0)}</Text>
              </View>
            </View>
            <Text style={styles.storyName}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Announcements</Text>
      {[
        { title: 'New Course Launch', desc: 'Introduction to African History is now live!', date: '2h ago' },
        { title: 'Live Q&A Session', desc: 'Join Prof. Amina tomorrow at 3 PM EAT', date: '5h ago' },
        { title: 'Community Guidelines Update', desc: 'Please review the updated guidelines', date: '1d ago' },
      ].map((ann, i) => (
        <View key={i} style={styles.announcementCard}>
          <View style={styles.announcementIcon}>
            <Feather name="bell" size={18} color="#f59e0b" />
          </View>
          <View style={styles.announcementInfo}>
            <Text style={styles.announcementTitle}>{ann.title}</Text>
            <Text style={styles.announcementDesc}>{ann.desc}</Text>
            <Text style={styles.announcementDate}>{ann.date}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderGroups = () => (
    <FlatList
      data={groups}
      keyExtractor={g => g.id}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Feather name="users" size={48} color="#333" />
          <Text style={styles.emptyText}>No groups yet</Text>
          <TouchableOpacity style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.groupCard}>
          <View style={styles.groupCover}>
            <Feather name="users" size={32} color="#6366f1" />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupDesc} numberOfLines={2}>{item.description}</Text>
            <View style={styles.groupMeta}>
              <Feather name="users" size={12} color="#666" />
              <Text style={styles.groupMetaText}>{item.member_count} members</Text>
              {item.is_private && (
                <View style={styles.privateBadge}>
                  <Feather name="lock" size={10} color="#666" />
                  <Text style={styles.privateText}>Private</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.groupJoinBtn, item.is_member && styles.groupJoinedBtn]} 
            onPress={() => !item.is_member && joinGroup(item.id)}
          >
            <Text style={[styles.groupJoinText, item.is_member && styles.groupJoinedText]}>
              {item.is_member ? 'Joined' : 'Join'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/studio/search')}>
          <Feather name="search" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {[
          { id: 'posts' as CommunityTab, label: 'Posts', icon: 'message-square' },
          { id: 'polls' as CommunityTab, label: 'Polls', icon: 'bar-chart-2' },
          { id: 'stories' as CommunityTab, label: 'Stories', icon: 'aperture' },
          { id: 'announcements' as CommunityTab, label: 'News', icon: 'bell' },
          { id: 'groups' as CommunityTab, label: 'Groups', icon: 'users' },
        ].map(t => (
          <TouchableOpacity key={t.id} onPress={() => setActiveTab(t.id)} style={[styles.tabBtn, activeTab === t.id && styles.tabBtnActive]}>
            <Feather name={t.icon as any} size={14} color={activeTab === t.id ? '#6366f1' : '#666'} />
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.content}>
        {activeTab === 'posts' && renderPosts()}
        {activeTab === 'polls' && renderPolls()}
        {activeTab === 'stories' && renderStories()}
        {activeTab === 'announcements' && renderStories()}
        {activeTab === 'groups' && renderGroups()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  tabScroll: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1f1f1f', marginRight: 8 },
  tabBtnActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderWidth: 1, borderColor: '#6366f1' },
  tabText: { color: '#666', fontSize: 12, fontWeight: '500' },
  tabTextActive: { color: '#6366f1', fontWeight: '700' },

  content: { flex: 1 },

  // Posts
  postComposer: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#141414', borderRadius: 12, marginBottom: 12 },
  composerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  composerAvatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  composerInput: { flex: 1, color: '#fff', fontSize: 14, maxHeight: 80 },
  composerBtn: { padding: 8 },
  postCard: { backgroundColor: '#141414', borderRadius: 12, padding: 14, marginBottom: 10 },
  postPinned: { borderLeftWidth: 3, borderLeftColor: '#f59e0b' },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  pinnedText: { color: '#f59e0b', fontSize: 10, fontWeight: '800' },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  postAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  postAvatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  postAuthor: { color: '#fff', fontSize: 14, fontWeight: '600' },
  postTime: { color: '#666', fontSize: 11, marginTop: 1 },
  postContent: { color: '#e5e5e5', fontSize: 14, lineHeight: 20 },
  postImage: { width: '100%', height: 180, backgroundColor: '#1f1f1f', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  postImageText: { color: '#666', fontSize: 14 },
  postActions: { flexDirection: 'row', gap: 20, marginTop: 12 },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postActionText: { color: '#666', fontSize: 12 },

  // Polls
  createPollBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#141414', padding: 12, borderRadius: 8, marginBottom: 12 },
  createPollText: { color: '#6366f1', fontSize: 14, fontWeight: '700' },
  pollForm: { backgroundColor: '#141414', borderRadius: 12, padding: 14, marginBottom: 12 },
  formInput: { backgroundColor: '#1f1f1f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 14, marginBottom: 8 },
  addOptionText: { color: '#6366f1', fontSize: 13, fontWeight: '600', marginBottom: 10 },
  createBtn: { backgroundColor: '#6366f1', padding: 12, borderRadius: 8, alignItems: 'center' },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  pollCard: { backgroundColor: '#141414', borderRadius: 12, padding: 14, marginBottom: 10 },
  pollQuestion: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  pollOption: { marginBottom: 10 },
  pollOptionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  pollOptionText: { color: '#fff', fontSize: 13 },
  pollOptionVotes: { color: '#666', fontSize: 12 },
  pollBarBg: { width: '100%', height: 6, backgroundColor: '#1f1f1f', borderRadius: 3 },
  pollBar: { height: 6, backgroundColor: '#6366f1', borderRadius: 3 },
  pollPct: { color: '#666', fontSize: 11, marginTop: 2 },
  pollTotal: { color: '#666', fontSize: 12, marginTop: 8 },

  // Stories
  storiesContainer: { padding: 16 },
  myStory: { alignItems: 'center', marginBottom: 16 },
  myStoryCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1f1f1f', borderWidth: 2, borderColor: '#6366f1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  myStoryText: { color: '#6366f1', fontSize: 12, fontWeight: '600', marginTop: 6 },
  storiesScroll: { marginBottom: 20 },
  storyItem: { alignItems: 'center', marginRight: 14 },
  storyRing: { width: 66, height: 66, borderRadius: 33, borderWidth: 2, padding: 2 },
  storyAvatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  storyAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  storyName: { color: '#fff', fontSize: 11, marginTop: 4 },

  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  announcementCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#141414', padding: 14, borderRadius: 12, marginBottom: 10 },
  announcementIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.2)', alignItems: 'center', justifyContent: 'center' },
  announcementInfo: { flex: 1 },
  announcementTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  announcementDesc: { color: '#9ca3af', fontSize: 12, marginTop: 2, lineHeight: 18 },
  announcementDate: { color: '#666', fontSize: 11, marginTop: 4 },

  // Groups
  groupCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#141414', padding: 12, borderRadius: 12, marginBottom: 10 },
  groupCover: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#1f1f1f', alignItems: 'center', justifyContent: 'center' },
  groupInfo: { flex: 1 },
  groupName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  groupDesc: { color: '#9ca3af', fontSize: 12, marginTop: 2, lineHeight: 18 },
  groupMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  groupMetaText: { color: '#666', fontSize: 11 },
  privateBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  privateText: { color: '#666', fontSize: 10 },
  groupJoinBtn: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  groupJoinedBtn: { backgroundColor: '#1f1f1f', borderWidth: 1, borderColor: '#333' },
  groupJoinText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  groupJoinedText: { color: '#9ca3af' },

  // Empty
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptyBtn: { backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 16 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
