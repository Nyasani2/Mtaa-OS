#!/usr/bin/env python3
import os

BASE = os.path.expanduser("~/MTAA_OS_V10")

files = {
    "domains/streets/services/commentService.ts": """import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 20;

export interface StreetComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  likes_count: number;
  replies_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  liked_by_me?: boolean;
}

export interface CommentInput {
  text: string;
}

export interface ReplyInput {
  text: string;
}

export async function fetchComments(
  postId: string,
  page: number = 0
): Promise<{ comments: StreetComment[]; hasMore: boolean }> {
  const { data, error } = await supabase
    .from('streets_comments')
    .select(`*, author:profiles(id, full_name, avatar_url)`)
    .eq('post_id', postId)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (error) throw error;

  const comments: StreetComment[] = (data || []).map((row: any) => ({
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    content: row.content,
    parent_id: row.parent_id,
    likes_count: row.likes_count || 0,
    replies_count: row.replies_count || 0,
    is_pinned: row.is_pinned || false,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: Array.isArray(row.author) ? row.author[0] : row.author,
    liked_by_me: false,
  }));

  return { comments, hasMore: comments.length === PAGE_SIZE };
}

export async function fetchReplies(
  commentId: string,
  page: number = 0
): Promise<{ replies: StreetComment[]; hasMore: boolean }> {
  const { data, error } = await supabase
    .from('streets_comments')
    .select(`*, author:profiles(id, full_name, avatar_url)`)
    .eq('parent_id', commentId)
    .order('created_at', { ascending: true })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (error) throw error;

  const replies: StreetComment[] = (data || []).map((row: any) => ({
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    content: row.content,
    parent_id: row.parent_id,
    likes_count: row.likes_count || 0,
    replies_count: row.replies_count || 0,
    is_pinned: row.is_pinned || false,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: Array.isArray(row.author) ? row.author[0] : row.author,
    liked_by_me: false,
  }));

  return { replies, hasMore: replies.length === PAGE_SIZE };
}

export async function addComment(postId: string, input: CommentInput): Promise<StreetComment> {
  return createComment(postId, input.text);
}

export async function addReply(commentId: string, input: ReplyInput): Promise<StreetComment> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { data: parentComment } = await supabase
    .from('streets_comments')
    .select('post_id')
    .eq('id', commentId)
    .single();

  if (!parentComment) throw new Error('Parent comment not found');

  const { data, error } = await supabase
    .from('streets_comments')
    .insert({
      post_id: parentComment.post_id,
      user_id: userData.user.id,
      parent_id: commentId,
      content: input.text,
      likes_count: 0,
      replies_count: 0,
    })
    .select(`*, author:profiles(id, full_name, avatar_url)`)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    post_id: data.post_id,
    user_id: data.user_id,
    content: data.content,
    parent_id: data.parent_id,
    likes_count: data.likes_count || 0,
    replies_count: data.replies_count || 0,
    is_pinned: data.is_pinned || false,
    created_at: data.created_at,
    updated_at: data.updated_at,
    author: Array.isArray(data.author) ? data.author[0] : data.author,
    liked_by_me: false,
  };
}

export async function createComment(
  postId: string,
  content: string
): Promise<StreetComment> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('streets_comments')
    .insert({
      post_id: postId,
      user_id: userData.user.id,
      parent_id: null,
      content: content,
      likes_count: 0,
      replies_count: 0,
    })
    .select(`*, author:profiles(id, full_name, avatar_url)`)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    post_id: data.post_id,
    user_id: data.user_id,
    content: data.content,
    parent_id: data.parent_id,
    likes_count: data.likes_count || 0,
    replies_count: data.replies_count || 0,
    is_pinned: data.is_pinned || false,
    created_at: data.created_at,
    updated_at: data.updated_at,
    author: Array.isArray(data.author) ? data.author[0] : data.author,
    liked_by_me: false,
  };
}

export async function likeComment(commentId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('streets_comment_likes')
    .insert({ comment_id: commentId, user_id: userData.user.id });

  if (error) {
    await supabase
      .from('streets_comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userData.user.id);
  }
}

export async function unlikeComment(commentId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('streets_comment_likes')
    .delete()
    .eq('comment_id', commentId)
    .eq('user_id', userData.user.id);

  if (error) throw error;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('streets_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userData.user.id);

  if (error) throw error;
}
""",

    "domains/streets/hooks/useComments.ts": """import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as commentService from '../services/commentService';
import type { CommentInput, ReplyInput } from '../services/commentService';

export function useComments(postId: string) {
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['streets', 'comments', postId],
    queryFn: () => commentService.fetchComments(postId),
    enabled: !!postId,
  });

  const comments = commentsData?.comments || [];

  const addComment = useMutation({
    mutationFn: (input: CommentInput) => commentService.addComment(postId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'comments', postId] });
      setCommentText('');
    },
  });

  const addReply = useMutation({
    mutationFn: ({ commentId, input }: { commentId: string; input: ReplyInput }) =>
      commentService.addReply(commentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'comments', postId] });
      setReplyingTo(null);
      setCommentText('');
    },
  });

  const likeComment = useMutation({
    mutationFn: (commentId: string) => commentService.likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'comments', postId] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) => commentService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'comments', postId] });
    },
  });

  const startReply = useCallback((commentId: string) => {
    setReplyingTo(commentId);
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
    setCommentText('');
  }, []);

  return {
    comments,
    commentsLoading,
    commentText,
    setCommentText,
    replyingTo,
    addComment,
    addReply,
    likeComment,
    deleteComment,
    startReply,
    cancelReply,
  };
}
""",

    "domains/streets/components/CommentThread.tsx": """import React from 'react';
import { View, Text, TextInput, Pressable, FlatList, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useComments } from '../hooks/useComments';
import type { StreetComment } from '../services/commentService';

interface CommentThreadProps {
  postId: string;
}

export function CommentThread({ postId }: CommentThreadProps) {
  const {
    comments,
    commentsLoading,
    commentText,
    setCommentText,
    replyingTo,
    addComment,
    addReply,
    likeComment,
    deleteComment,
    startReply,
    cancelReply,
  } = useComments(postId);

  const renderComment = ({ item }: { item: StreetComment }) => {
    const avatarUri = item.author?.avatar_url || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(item.author?.full_name || 'U')}&background=6366f1&color=fff`;

    return (
      <View style={styles.comment}>
        <Image source={{ uri: avatarUri }} style={styles.commentAvatar} />
        <View style={styles.commentBody}>
          <Text style={styles.commentUser}>{item.author?.full_name || 'User'}</Text>
          <Text style={styles.commentText}>{item.content}</Text>
          <View style={styles.commentActions}>
            <Pressable onPress={() => likeComment.mutate(item.id)} style={styles.actionBtn}>
              <Text style={styles.commentAction}>{'❤️ ' + (item.likes_count || 0)}</Text>
            </Pressable>
            <Pressable onPress={() => startReply(item.id)} style={styles.actionBtn}>
              <Text style={styles.commentAction}>Reply</Text>
            </Pressable>
            <Pressable onPress={() => deleteComment.mutate(item.id)} style={styles.actionBtn}>
              <Text style={styles.commentAction}>🗑️</Text>
            </Pressable>
          </View>
          {item.replies_count ? (
            <Text style={styles.repliesHint}>{item.replies_count + ' replies'}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  if (commentsLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No comments yet</Text>
            <Text style={styles.emptySubtext}>Be the first to comment!</Text>
          </View>
        }
      />
      <View style={styles.inputBar}>
        {replyingTo && (
          <View style={styles.replyBar}>
            <Text style={styles.replyingTo}>Replying to comment</Text>
            <Pressable onPress={cancelReply}><Text>✕</Text></Pressable>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={() => replyingTo
              ? addReply.mutate({ commentId: replyingTo, input: { text: commentText } })
              : addComment.mutate({ text: commentText })
            }
            disabled={!commentText.trim() || addComment.isPending || addReply.isPending}
          >
            <Text style={[styles.sendBtn, (!commentText.trim() || addComment.isPending || addReply.isPending) ? styles.disabled : null]}>➤</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  comment: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  commentBody: { flex: 1 },
  commentUser: { fontWeight: '700', fontSize: 13, color: '#333' },
  commentText: { fontSize: 14, marginTop: 4, lineHeight: 20, color: '#333' },
  commentActions: { flexDirection: 'row', marginTop: 8, gap: 16 },
  actionBtn: { padding: 4 },
  commentAction: { fontSize: 12, color: '#888' },
  repliesHint: { fontSize: 12, color: '#007AFF', marginTop: 6, fontWeight: '600' },
  inputBar: { borderTopWidth: 1, borderTopColor: '#eee', padding: 12, backgroundColor: '#fff' },
  replyBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  replyingTo: { fontSize: 12, color: '#007AFF', fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn: { fontSize: 20, color: '#007AFF', marginLeft: 10 },
  disabled: { opacity: 0.3 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#999', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#bbb', marginTop: 4 },
});
""",

    "domains/streets/components/CreateModal.tsx": """import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface CreateModalProps {
  visible?: boolean;
  onClose: () => void;
}

export default function CreateModal({ visible, onClose }: CreateModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'text'>('text');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!caption.trim() && !mediaUrl) {
      alert('Please add a caption or media');
      return;
    }
    if (!user) {
      alert('Please sign in to post');
      return;
    }

    setIsPublishing(true);
    try {
      const { error } = await supabase.from('streets_posts').insert({
        creator_id: user.id,
        caption: caption.trim(),
        title: caption.trim().substring(0, 100),
        content: caption.trim(),
        media_type: mediaUrl ? mediaType : 'text',
        media_url: mediaUrl || null,
        is_public: true,
        allow_comments: true,
        views_count: 0,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
      });

      if (error) throw error;
      setCaption('');
      setMediaUrl('');
      setMediaType('text');
      onClose();
      router.replace('/streets/feed');
    } catch (err: any) {
      alert('Failed to publish: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const content = (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeBtn}>×</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Post</Text>
        <TouchableOpacity 
          onPress={handlePublish} 
          disabled={isPublishing || (!caption.trim() && !mediaUrl)}
        >
          <Text style={[styles.publishBtn, (isPublishing || (!caption.trim() && !mediaUrl)) ? styles.disabled : null]}>
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="What's happening?"
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        value={caption}
        onChangeText={setCaption}
        maxLength={500}
      />

      <TextInput
        style={styles.mediaInput}
        placeholder="Media URL (optional - paste image or video URL)"
        value={mediaUrl}
        onChangeText={setMediaUrl}
      />

      <View style={styles.mediaButtons}>
        <TouchableOpacity 
          style={[styles.mediaBtn, mediaType === 'image' ? styles.mediaBtnActive : null]} 
          onPress={() => setMediaType('image')}
        >
          <Ionicons name="image" size={20} color={mediaType === 'image' ? '#007AFF' : '#666'} />
          <Text style={[styles.mediaBtnText, mediaType === 'image' ? styles.mediaBtnTextActive : null]}>Image</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.mediaBtn, mediaType === 'video' ? styles.mediaBtnActive : null]} 
          onPress={() => setMediaType('video')}
        >
          <Ionicons name="videocam" size={20} color={mediaType === 'video' ? '#007AFF' : '#666'} />
          <Text style={[styles.mediaBtnText, mediaType === 'video' ? styles.mediaBtnTextActive : null]}>Video</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.mediaBtn, mediaType === 'text' ? styles.mediaBtnActive : null]} 
          onPress={() => { setMediaType('text'); setMediaUrl(''); }}
        >
          <Ionicons name="text" size={20} color={mediaType === 'text' ? '#007AFF' : '#666'} />
          <Text style={[styles.mediaBtnText, mediaType === 'text' ? styles.mediaBtnTextActive : null]}>Text</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  if (visible !== undefined) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        {content}
      </Modal>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingTop: 40 },
  closeBtn: { fontSize: 32, color: '#333', paddingHorizontal: 8 },
  title: { fontSize: 18, fontWeight: '600' },
  publishBtn: { color: '#007AFF', fontWeight: '600', fontSize: 16 },
  disabled: { opacity: 0.5 },
  input: { fontSize: 16, minHeight: 120, textAlignVertical: 'top', marginBottom: 16, lineHeight: 22 },
  mediaInput: { fontSize: 14, borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 16 },
  mediaButtons: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  mediaBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 20, backgroundColor: '#f5f5f5' },
  mediaBtnActive: { backgroundColor: '#E3F2FD' },
  mediaBtnText: { fontSize: 13, color: '#666' },
  mediaBtnTextActive: { color: '#007AFF', fontWeight: '600' },
});
""",

    "domains/streets/components/InboxList.tsx": """import React from 'react';
import { View, Text, Image, Pressable, FlatList, StyleSheet, TextInput } from 'react-native';
import { useInbox } from '../hooks/useInbox';

export function InboxList() {
  const { threads, isLoading, selectedThread, setSelectedThread, searchQuery, setSearchQuery } = useInbox();

  const renderThread = ({ item }: { item: any }) => (
    <Pressable
      style={[styles.thread, selectedThread === item.id && styles.selected]}
      onPress={() => setSelectedThread(item.id)}
    >
      <Image source={{ uri: item.participantAvatar }} style={styles.avatar} />
      <View style={styles.threadInfo}>
        <View style={styles.threadHeader}>
          <Text style={styles.name}>{item.participantName}</Text>
          <Text style={styles.time}>{item.lastMessageTime}</Text>
        </View>
        <Text style={[styles.preview, !item.isRead && styles.unread]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={threads}
        renderItem={renderThread}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  thread: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', alignItems: 'center' },
  selected: { backgroundColor: '#f0f8ff' },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  threadInfo: { flex: 1 },
  threadHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontWeight: '700', fontSize: 14 },
  time: { fontSize: 12, color: '#888' },
  preview: { fontSize: 13, color: '#666' },
  unread: { fontWeight: '700', color: '#000' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E91E63', position: 'absolute', right: 12, top: '50%' },
});
""",

    "domains/streets/screens/CreateScreen.tsx": """import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import CreateModal from '../components/CreateModal';

export default function CreateScreen() {
  return (
    <View style={styles.container}>
      <CreateModal onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
""",

    "domains/streets/screens/ShareScreen.tsx": """import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ShareSheet } from '../components/ShareSheet';

export default function ShareScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();

  return (
    <View style={styles.container}>
      <ShareSheet postId={postId} visible={true} onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
});
""",
}

for path, content in files.items():
    full_path = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w') as f:
        f.write(content)
    print(f'Written: {path} ({len(content)} chars)')

print('\\n✅ All files written successfully!')
print('Restart with: npx expo start -c')
