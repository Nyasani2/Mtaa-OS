import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, Share, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

let VideoComponent: any;
let ResizeModeConst: any;
try {
  const av = require('expo-av');
  VideoComponent = av.Video;
  ResizeModeConst = av.ResizeMode;
} catch (e) {
  VideoComponent = null;
}

interface VideoData {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  creator_id: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  creator?: { full_name: string | null; avatar_url: string | null };
}

interface CommentItem {
  id: string;
  user_name: string;
  body: string;
  created_at: string;
}

export default function VideoPlayerScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (videoId) {
      fetchVideoData();
      incrementViewCount();
    }
  }, [videoId]);

  const fetchVideoData = async () => {
    try {
      const { data: videoData, error: videoError } = await supabase
        .from('studio_videos')
        .select('*, user_profiles(full_name, avatar_url)')
        .eq('id', videoId)
        .single();
      if (videoError) throw videoError;
      setVideo(videoData);

      const { data: commentsData } = await supabase
        .from('studio_video_comments')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });
      setComments(commentsData || []);

      if (user?.id) {
        const { data: likeData } = await supabase
          .from('studio_video_likes')
          .select('*')
          .eq('video_id', videoId)
          .eq('user_id', user.id)
          .single();
        setIsLiked(!!likeData);

        if (videoData?.creator_id) {
          const { data: subData } = await supabase
            .from('studio_subscriptions')
            .select('*')
            .eq('subscriber_id', user.id)
            .eq('creator_id', videoData.creator_id)
            .single();
          setIsSubscribed(!!subData);
        }
      }
    } catch (e) {
      console.error('Fetch video error:', e);
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      const { data: current } = await supabase.from('studio_videos').select('views_count').eq('id', videoId).single();
      await supabase.from('studio_videos').update({ views_count: (current?.views_count || 0) + 1 }).eq('id', videoId);
    } catch (e) {
      console.error('View count error:', e);
    }
  };

  const toggleLike = async () => {
    if (!user?.id || !videoId) return;
    try {
      if (isLiked) {
        await supabase.from('studio_video_likes').delete().eq('video_id', videoId).eq('user_id', user.id);
        setIsLiked(false);
        setVideo(prev => prev ? { ...prev, likes_count: Math.max(0, (prev.likes_count || 0) - 1) } : prev);
      } else {
        await supabase.from('studio_video_likes').insert({ video_id: videoId, user_id: user.id });
        setIsLiked(true);
        setVideo(prev => prev ? { ...prev, likes_count: (prev.likes_count || 0) + 1 } : prev);
      }
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  const toggleSubscribe = async () => {
    if (!user?.id || !video?.creator_id) return;
    try {
      if (isSubscribed) {
        await supabase.from('studio_subscriptions').delete().eq('subscriber_id', user.id).eq('creator_id', video.creator_id);
        setIsSubscribed(false);
      } else {
        await supabase.from('studio_subscriptions').insert({ subscriber_id: user.id, creator_id: video.creator_id });
        setIsSubscribed(true);
      }
    } catch (e) {
      console.error('Subscribe error:', e);
    }
  };

  const postComment = async () => {
    if (!commentText.trim() || !user?.id || !videoId) return;
    try {
      const { data } = await supabase
        .from('studio_video_comments')
        .insert({ video_id: videoId, user_id: user.id, user_name: user.user_metadata?.full_name || 'User', body: commentText.trim() })
        .select()
        .single();
      if (data) {
        setComments(prev => [data, ...prev]);
        setCommentText('');
        setVideo(prev => prev ? { ...prev, comments_count: (prev.comments_count || 0) + 1 } : prev);
      }
    } catch (e) {
      console.error('Comment error:', e);
    }
  };

  const onShare = async () => {
    try {
      await Share.share({ message: `Check out "${video?.title}" on MStudio!` });
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderComment = ({ item }: { item: CommentItem }) => (
    <View style={styles.commentCard}>
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>{item.user_name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.commentContent}>
        <Text style={styles.commentUser}>{item.user_name} <Text style={styles.commentTime}>• {formatDate(item.created_at)}</Text></Text>
        <Text style={styles.commentBody}>{item.body}</Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.videoContainer}>
        {VideoComponent && video?.video_url ? (
          <VideoComponent
            source={{ uri: video.video_url }}
            style={styles.video}
            resizeMode={ResizeModeConst?.CONTAIN || 'contain'}
            useNativeControls
            isLooping
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Feather name="film" size={48} color="#666" />
            <Text style={styles.videoPlaceholderText}>Video unavailable</Text>
          </View>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.title}>{video?.title || 'Untitled Video'}</Text>
        <Text style={styles.meta}>
          {video?.views_count?.toLocaleString() || 0} views • {formatDate(video?.created_at || new Date().toISOString())}
        </Text>
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={toggleLike}>
          <Feather name={isLiked ? 'heart' : 'heart-o'} size={22} color={isLiked ? '#ef4444' : '#fff'} />
          <Text style={styles.actionLabel}>{video?.likes_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onShare}>
          <Feather name="share-2" size={22} color="#fff" />
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Feather name="bookmark" size={22} color="#fff" />
          <Text style={styles.actionLabel}>Save</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.creatorRow}
        onPress={() => video?.creator_id && router.push(`/(os)/studio/channel?creatorId=${video.creator_id}`)}
      >
        <View style={styles.creatorAvatar}>
          <Text style={styles.creatorAvatarText}>{video?.creator?.full_name?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
        <View style={styles.creatorInfo}>
          <Text style={styles.creatorName}>{video?.creator?.full_name || 'Creator'}</Text>
          <Text style={styles.creatorSub}>Tap to view channel</Text>
        </View>
        {user?.id !== video?.creator_id && (
          <TouchableOpacity style={[styles.subscribeBtn, isSubscribed && styles.subscribedBtn]} onPress={toggleSubscribe}>
            <Text style={[styles.subscribeText, isSubscribed && styles.subscribedText]}>
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {video?.description && (
        <View style={styles.descriptionBox}>
          <Text style={styles.description}>{video.description}</Text>
        </View>
      )}

      <View style={styles.commentsHeader}>
        <Text style={styles.commentsTitle}>{video?.comments_count || 0} Comments</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#6366f1" size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Now Playing</Text>
        <TouchableOpacity onPress={onShare}>
          <Feather name="share-2" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          data={comments}
          keyExtractor={c => c.id}
          renderItem={renderComment}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor="#666"
            value={commentText}
            onChangeText={setCommentText}
            onSubmitEditing={postComment}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={postComment}>
            <Feather name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 16 },
  videoContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  video: { width: '100%', height: '100%' },
  videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  videoPlaceholderText: { color: '#666', fontSize: 14 },
  infoSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 22 },
  meta: { color: '#9ca3af', fontSize: 13, marginTop: 4 },
  actionBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionLabel: { color: '#fff', fontSize: 12, fontWeight: '500' },
  creatorRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  creatorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  creatorAvatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  creatorInfo: { flex: 1, marginLeft: 12 },
  creatorName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  creatorSub: { color: '#666', fontSize: 12, marginTop: 2 },
  subscribeBtn: { backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  subscribedBtn: { backgroundColor: '#1f1f1f', borderWidth: 1, borderColor: '#333' },
  subscribeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  subscribedText: { color: '#9ca3af' },
  descriptionBox: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  description: { color: '#e5e5e5', fontSize: 14, lineHeight: 20 },
  commentsHeader: { paddingHorizontal: 16, paddingVertical: 12 },
  commentsTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  commentCard: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1f1f1f', alignItems: 'center', justifyContent: 'center' },
  commentAvatarText: { color: '#6366f1', fontSize: 13, fontWeight: '700' },
  commentContent: { flex: 1 },
  commentUser: { color: '#fff', fontSize: 13, fontWeight: '600' },
  commentTime: { color: '#666', fontWeight: '400' },
  commentBody: { color: '#e5e5e5', fontSize: 13, marginTop: 2, lineHeight: 18 },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: '#1f1f1f', backgroundColor: '#0a0a0a' },
  input: { flex: 1, backgroundColor: '#1f1f1f', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
});
