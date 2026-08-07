import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, Image,
  StyleSheet, ActivityIndicator, Platform, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ThumbsUp, MessageCircle, Share2, Bookmark,
  ArrowLeft, Send,
} from 'lucide-react-native';
import { useStudio, StudioVideo } from '@/domains/studio/hooks/useStudio';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import VideoCard from '@/domains/studio/components/video-card';

const { width: SCREEN_W } = Dimensions.get('window');

export default function VideoPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    getVideo, fetchComments, postComment, toggleLike, checkLiked,
    toggleSubscribe, checkSubscribed, incrementView, getCreatorVideos,
  } = useStudio();

  const [video, setVideo] = useState<(StudioVideo & { source?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [related, setRelated] = useState<StudioVideo[]>([]);
  const [viewIncremented, setViewIncremented] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const v = await getVideo(id);
      if (v) {
        setVideo(v);
        setLikeCount(v.likes_count || 0);
        if (!viewIncremented) {
          incrementView(id);
          setViewIncremented(true);
        }
        const isLiked = await checkLiked(id);
        setLiked(isLiked);
        if (v.creator_id && v.creator_id !== user?.id) {
          const isSubbed = await checkSubscribed(v.creator_id);
          setSubscribed(isSubbed);
        }
        const c = await fetchComments(id);
        setComments(c);
        const rel = await getCreatorVideos(v.creator_id);
        setRelated(rel.filter((r: any) => r.id !== id).slice(0, 6));
      }
      setLoading(false);
    })();
  }, [id]);

  const handleLike = async () => {
    if (!id) return;
    const result = await toggleLike(id);
    setLiked(result);
    setLikeCount(prev => result ? prev + 1 : Math.max(0, prev - 1));
  };

  const handleSubscribe = async () => {
    if (!video?.creator_id) return;
    const result = await toggleSubscribe(video.creator_id);
    setSubscribed(result);
  };

  const handlePostComment = async () => {
    if (!id || !commentText.trim()) return;
    const ok = await postComment(id, commentText);
    if (ok) {
      setCommentText('');
      const c = await fetchComments(id);
      setComments(c);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: video?.title || 'Video',
        url: typeof window !== 'undefined' ? window.location.href : '',
      });
    }
  };

  const handleSave = () => {
    alert('Saved to your library!');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff0040" />
      </View>
    );
  }

  if (!video) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Video not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.goBack}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isOwnVideo = video.creator_id === user?.id;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Video Player */}
      <View style={styles.playerWrap}>
        {Platform.OS === 'web' ? (
          <video
            src={video.video_url || ''}
            controls
            autoPlay
            style={{ width: '100%', height: Math.min(SCREEN_W * 0.56, 480), backgroundColor: '#000' }}
            poster={video.thumbnail_url || undefined}
          />
        ) : (
          <View style={[styles.nativePlayer, { height: Math.min(SCREEN_W * 0.56, 480) }]}>
            <Text style={styles.nativePlayerText}>Native video player</Text>
          </View>
        )}
      </View>

      {/* Title & Meta */}
      <View style={styles.section}>
        <Text style={styles.title}>{video.title || 'Untitled'}</Text>
        <Text style={styles.meta}>
          {video.view_count || 0} views • {new Date(video.created_at).toLocaleDateString()}
        </Text>
      </View>

      {/* Creator Row */}
      <View style={[styles.section, styles.creatorRow]}>
        <Pressable
          style={styles.creatorInfo}
          onPress={() => router.push(`/(os)/studio/creator-profile?id=${video.creator_id}`)}
        >
          {video.creator_avatar ? (
            <Image source={{ uri: video.creator_avatar }} style={styles.creatorAvatar} />
          ) : (
            <View style={[styles.creatorAvatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{(video.creator_name || '?').charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.creatorName}>{video.creator_name || 'Unknown'}</Text>
            <Text style={styles.creatorHandle}>@{video.creator_handle || 'creator'}</Text>
          </View>
        </Pressable>

        {!isOwnVideo && (
          <Pressable
            style={[styles.subscribeBtn, subscribed && styles.subscribedBtn]}
            onPress={handleSubscribe}
          >
            <Text style={[styles.subscribeText, subscribed && styles.subscribedText]}>
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Action Bar */}
      <View style={[styles.section, styles.actionBar]}>
        <Pressable style={styles.actionBtn} onPress={handleLike}>
          <ThumbsUp size={20} color={liked ? '#ff0040' : '#fff'} fill={liked ? '#ff0040' : 'none'} />
          <Text style={[styles.actionText, liked && { color: '#ff0040' }]}>{likeCount}</Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={() => {}}>
          <MessageCircle size={20} color="#fff" />
          <Text style={styles.actionText}>{comments.length}</Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={handleShare}>
          <Share2 size={20} color="#fff" />
          <Text style={styles.actionText}>Share</Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={handleSave}>
          <Bookmark size={20} color="#fff" />
          <Text style={styles.actionText}>Save</Text>
        </Pressable>
      </View>

      {/* Description */}
      {video.description ? (
        <View style={styles.section}>
          <Text style={styles.description}>{video.description}</Text>
        </View>
      ) : null}

      {/* Comments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="#666"
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <Pressable onPress={handlePostComment} disabled={!commentText.trim()}>
            <Send size={20} color={commentText.trim() ? '#ff0040' : '#444'} />
          </Pressable>
        </View>

        {comments.map((c) => (
          <View key={c.id} style={styles.commentItem}>
            {c.user_avatar ? (
              <Image source={{ uri: c.user_avatar }} style={styles.commentAvatar} />
            ) : (
              <View style={[styles.commentAvatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{(c.user_name || '?').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.commentName}>{c.user_name || 'User'}</Text>
              <Text style={styles.commentBody}>{c.content}</Text>
              <Text style={styles.commentTime}>{new Date(c.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Related Videos */}
      {related.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Related Videos</Text>
          <View style={styles.relatedGrid}>
            {related.map((v) => (
              <VideoCard
                key={v.id}
                id={v.id}
                title={v.title}
                thumbnail_url={v.thumbnail_url}
                video_url={v.video_url}
                creator_name={v.creator_name}
                creator_avatar={v.creator_avatar}
                view_count={v.view_count}
                duration_seconds={v.duration_seconds}
                created_at={v.created_at}
                size="small"
              />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  notFound: { color: '#fff', fontSize: 18, fontWeight: '600' },
  goBack: { color: '#ff0040', fontSize: 14, marginTop: 12 },
  playerWrap: { backgroundColor: '#000', width: '100%' },
  nativePlayer: { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  nativePlayerText: { color: '#666' },
  section: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 22 },
  meta: { color: '#aaa', fontSize: 12, marginTop: 4 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  creatorInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  creatorAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  avatarFallback: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  creatorName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  creatorHandle: { color: '#aaa', fontSize: 12 },
  subscribeBtn: { backgroundColor: '#ff0040', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  subscribedBtn: { backgroundColor: '#333' },
  subscribeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  subscribedText: { color: '#aaa' },
  actionBar: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#222', paddingVertical: 10 },
  actionBtn: { alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 11, marginTop: 4 },
  description: { color: '#ccc', fontSize: 13, lineHeight: 20 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 12 },
  commentInput: { flex: 1, color: '#fff', fontSize: 14, maxHeight: 80 },
  commentItem: { flexDirection: 'row', marginBottom: 14 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  commentName: { color: '#fff', fontSize: 13, fontWeight: '600' },
  commentBody: { color: '#ccc', fontSize: 13, marginTop: 2, lineHeight: 18 },
  commentTime: { color: '#666', fontSize: 11, marginTop: 2 },
  relatedGrid: { flexDirection: 'row', flexWrap: 'wrap' },
});
