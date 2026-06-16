import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  likes: number;
  replies: number;
  time: string;
  isPinned?: boolean;
}

interface CommunityPost {
  id: string;
  type: 'poll' | 'update' | 'shoutout';
  content: string;
  votes?: number;
  options?: string[];
  time: string;
}

export default function CommentsCommunityScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'comments' | 'community'>('comments');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([
    { id: '1', author: 'Wanjiku M.', avatar: 'W', text: 'This was amazing! Loved the street food segment 🔥', likes: 24, replies: 3, time: '2h ago', isPinned: true },
    { id: '2', author: 'Omondi K.', avatar: 'O', text: 'When are you visiting Mombasa next?', likes: 12, replies: 1, time: '5h ago' },
    { id: '3', author: 'Achieng L.', avatar: 'A', text: 'The editing on this is top tier 👏', likes: 8, replies: 0, time: '1d ago' },
  ]);

  const [posts] = useState<CommunityPost[]>([
    { id: '1', type: 'poll', content: 'What should my next video be about?', votes: 156, options: ['Street Food', 'Music', 'Travel'], time: '3h ago' },
    { id: '2', type: 'update', content: 'Hit 10K subscribers! Thank you all 🎉', time: '1d ago' },
  ]);

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: `c_${Date.now()}`,
      author: 'You',
      avatar: 'Y',
      text: newComment.trim(),
      likes: 0,
      replies: 0,
      time: 'Just now',
    };
    setComments([comment, ...comments]);
    setNewComment('');
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentCard}>
      {item.isPinned && (
        <View style={styles.pinnedBadge}>
          <Ionicons name="pin" size={12} color="#F59E0B" />
          <Text style={styles.pinnedText}>Pinned</Text>
        </View>
      )}
      <View style={styles.commentHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.avatar}</Text>
        </View>
        <View>
          <Text style={styles.authorName}>{item.author}</Text>
          <Text style={styles.commentTime}>{item.time}</Text>
        </View>
      </View>
      <Text style={styles.commentText}>{item.text}</Text>
      <View style={styles.commentActions}>
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="heart-outline" size={16} color="#64748B" />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="chatbubble-outline" size={16} color="#64748B" />
          <Text style={styles.actionText}>{item.replies}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="flag-outline" size={16} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 Community</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'comments' && styles.tabBtnActive]}
          onPress={() => setActiveTab('comments')}
        >
          <Ionicons name="chatbubbles" size={16} color={activeTab === 'comments' ? '#FFF' : '#94A3B8'} />
          <Text style={[styles.tabText, activeTab === 'comments' && styles.tabTextActive]}>Comments</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'community' && styles.tabBtnActive]}
          onPress={() => setActiveTab('community')}
        >
          <Ionicons name="people" size={16} color={activeTab === 'community' ? '#FFF' : '#94A3B8'} />
          <Text style={[styles.tabText, activeTab === 'community' && styles.tabTextActive]}>Posts & Polls</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'comments' ? (
        <>
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
          {/* Comment Input */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.commentInput}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              placeholderTextColor="#475569"
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handlePostComment}>
              <Ionicons name="send" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={[styles.postIcon, { backgroundColor: post.type === 'poll' ? '#3B82F620' : '#22C55E20' }]}>
                  <Ionicons name={post.type === 'poll' ? 'stats-chart' : 'megaphone'} size={18} color={post.type === 'poll' ? '#3B82F6' : '#22C55E'} />
                </View>
                <Text style={styles.postType}>{post.type.toUpperCase()}</Text>
                <Text style={styles.postTime}>{post.time}</Text>
              </View>
              <Text style={styles.postContent}>{post.content}</Text>
              {post.type === 'poll' && post.options && (
                <View style={styles.pollOptions}>
                  {post.options.map((opt) => (
                    <TouchableOpacity key={opt} style={styles.pollOption}>
                      <Text style={styles.pollOptionText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                  <Text style={styles.pollVotes}>{post.votes} votes</Text>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.newPostBtn}>
            <Ionicons name="add-circle" size={20} color="#FFF" />
            <Text style={styles.newPostText}>Create Community Post</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  backBtn: { padding: 8, alignSelf: 'flex-start' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', marginTop: 4 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155',
  },
  tabBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  tabText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  tabTextActive: { color: '#FFF' },
  commentCard: {
    backgroundColor: '#1E293B', marginHorizontal: 16, marginBottom: 10,
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#334155',
  },
  pinnedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginBottom: 8,
  },
  pinnedText: { fontSize: 11, color: '#F59E0B', fontWeight: '700' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  authorName: { fontSize: 14, fontWeight: '600', color: '#F1F5F9' },
  commentTime: { fontSize: 11, color: '#64748B', marginTop: 1 },
  commentText: { fontSize: 14, color: '#CBD5E1', lineHeight: 20 },
  commentActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: '#64748B' },
  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#334155',
  },
  commentInput: {
    flex: 1, backgroundColor: '#0F172A', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    color: '#F1F5F9', fontSize: 14, borderWidth: 1, borderColor: '#334155',
    maxHeight: 80,
  },
  sendBtn: { padding: 10, marginLeft: 8 },
  postCard: {
    backgroundColor: '#1E293B', marginHorizontal: 16, marginBottom: 10,
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#334155',
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  postIcon: {
    width: 32, height: 32, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  postType: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  postTime: { fontSize: 11, color: '#475569', marginLeft: 'auto' },
  postContent: { fontSize: 14, color: '#F1F5F9', lineHeight: 20 },
  pollOptions: { marginTop: 10, gap: 6 },
  pollOption: {
    backgroundColor: '#0F172A', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#334155',
  },
  pollOptionText: { fontSize: 13, color: '#CBD5E1' },
  pollVotes: { fontSize: 12, color: '#64748B', marginTop: 6 },
  newPostBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginTop: 16,
    backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 14,
  },
  newPostText: { fontSize: 15, color: '#FFF', fontWeight: '700' },
});
