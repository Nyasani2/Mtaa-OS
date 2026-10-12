// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, FlatList, Image, TextInput, Modal, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX, ArrowLeft, ThumbsUp, ThumbsDown, Bookmark, Flag, MoreVertical } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

export default function VideoPlayerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const videoRef = useRef<any>(null);
  
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);

  useEffect(() => {
    loadVideo();
    loadComments();
    loadRelated();
  }, [id]);

  async function loadVideo() {
    try {
      const { data, error } = await supabase
        .from('studio_videos_with_creator')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setVideo(data);
      setLikeCount(data.likes_count || 0);
      
      // Increment view count
      await supabase.rpc('increment_video_view', { p_video_id: id });
    } catch (err) {
      console.error('Load video error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadComments() {
    const { data } = await supabase
      .from('studio_comments')
      .select('*, creator:user_id(full_name, avatar_url)')
      .eq('video_id', id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) setComments(data);
  }

  async function loadRelated() {
    const { data } = await supabase
      .from('studio_videos_with_creator')
      .select('*')
      .eq('status', 'published')
      .neq('id', id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) setRelatedVideos(data);
  }

  async function handleLike() {
    if (!user) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
    
    if (newLiked) {
      await supabase.from('studio_video_likes').insert({ video_id: id, user_id: user.id });
    } else {
      await supabase.from('studio_video_likes').delete().eq('video_id', id).eq('user_id', user.id);
    }
  }

  async function handleDislike() {
    if (!user) return;
    setDisliked(!disliked);
  }

  async function handleSave() {
    if (!user) return;
    setSaved(!saved);
    await supabase.rpc('save_video', { p_video_id: id, p_user_id: user.id });
  }

  async function postComment() {
    if (!newComment.trim() || !user) return;
    
    const { data, error } = await supabase
      .from('studio_comments')
      .insert({
        video_id: id,
        user_id: user.id,
        content: newComment.trim()
      })
      .select('*, creator:user_id(full_name, avatar_url)')
      .single();
    
    if (!error && data) {
      setComments(prev => [data, ...prev]);
      setNewComment('');
    }
  }

  async function handleShare() {
    // TODO: Implement share functionality
    console.log('Share video:', id);
  }

  const togglePlay = async () => {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current?.playAsync();
      setIsPlaying(true);
    }
  };

  const toggleMute = async () => {
    const newMuted = !isMuted;
    await videoRef.current?.setIsMutedAsync(newMuted);
    setIsMuted(newMuted);
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
        <Text style={{ color: '#fff', fontSize: 16 }}>Video not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <View style={styles.videoContainer}>
        <ExpoVideo
          ref={videoRef}
          source={{ uri: video.video_url }}
          resizeMode={ResizeMode.CONTAIN}
          isMuted={isMuted}
          isLooping
          shouldPlay
          style={styles.video}
        />
        
        {/* Play/Pause Overlay */}
        <TouchableOpacity style={styles.playOverlay} onPress={togglePlay}>
          {!isPlaying && <Play size={64} color="#fff" fill="#fff" />}
        </TouchableOpacity>

        {/* Mute Button */}
        <TouchableOpacity style={styles.muteBtn} onPress={toggleMute}>
          {isMuted ? <VolumeX size={24} color="#fff" /> : <Volume2 size={24} color="#fff" />}
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Video Info */}
      <ScrollView style={styles.infoContainer}>
        <Text style={styles.title}>{video.title}</Text>
        <Text style={styles.meta}>
          {video.view_count?.toLocaleString() || 0} views • {new Date(video.created_at).toLocaleDateString()}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <ThumbsUp size={20} color={liked ? '#ff0040' : '#fff'} fill={liked ? '#ff0040' : 'none'} />
            <Text style={[styles.actionText, liked && { color: '#ff0040' }]}>{likeCount}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtn} onPress={handleDislike}>
            <ThumbsDown size={20} color={disliked ? '#ff0040' : '#fff'} fill={disliked ? '#ff0040' : 'none'} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Share2 size={20} color="#fff" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
            <Bookmark size={20} color={saved ? '#ffd700' : '#fff'} fill={saved ? '#ffd700' : 'none'} />
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Creator Info */}
        <View style={styles.creatorSection}>
          <Image source={{ uri: video.creator_avatar || 'https://i.pravatar.cc/150' }} style={styles.creatorAvatar} />
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName}>{video.creator_name || 'Unknown Creator'}</Text>
            <Text style={styles.creatorHandle}>@{video.creator_handle || 'creator'}</Text>
          </View>
          <TouchableOpacity style={styles.subscribeBtn}>
            <Text style={styles.subscribeText}>Subscribe</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        {video.description && (
          <View style={styles.descriptionBox}>
            <Text style={styles.description}>{video.description}</Text>
          </View>
        )}

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <TouchableOpacity onPress={() => setShowComments(!showComments)} style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
            <MessageCircle size={20} color="#fff" />
          </TouchableOpacity>

          {showComments && (
            <View>
              {/* Comment Input */}
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor="#666"
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                />
                <TouchableOpacity onPress={postComment} style={styles.sendBtn}>
                  <Text style={{ color: newComment.trim() ? '#ff0040' : '#666', fontWeight: '600' }}>Post</Text>
                </TouchableOpacity>
              </View>

              {/* Comments List */}
              {comments.map((comment) => (
                <View key={comment.id} style={styles.comment}>
                  <Image source={{ uri: comment.creator?.avatar_url || 'https://i.pravatar.cc/150' }} style={styles.commentAvatar} />
                  <View style={styles.commentBody}>
                    <Text style={styles.commentAuthor}>{comment.creator?.full_name || 'User'}</Text>
                    <Text style={styles.commentText}>{comment.content}</Text>
                    <Text style={styles.commentTime}>{new Date(comment.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Related Videos */}
        <View style={styles.relatedSection}>
          <Text style={styles.relatedTitle}>Related Videos</Text>
          {relatedVideos.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={styles.relatedCard}
              onPress={() => router.push(`/(os)/studio/video-player?id=${v.id}`)}
            >
              <Image source={{ uri: v.thumbnail_url }} style={styles.relatedThumb} />
              <View style={styles.relatedInfo}>
                <Text style={styles.relatedVideoTitle} numberOfLines={2}>{v.title}</Text>
                <Text style={styles.relatedMeta}>{v.creator_name} • {v.view_count?.toLocaleString() || 0} views</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  videoContainer: { width: '100%', aspectRatio: 16/9, backgroundColor: '#000', position: 'relative' },
  video: { width: '100%', height: '100%' },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  muteBtn: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 8 },
  backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 16, left: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 8 },
  infoContainer: { flex: 1, padding: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  meta: { color: '#888', fontSize: 13, marginBottom: 16 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', marginBottom: 16 },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  creatorSection: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', marginBottom: 16 },
  creatorAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  creatorInfo: { flex: 1 },
  creatorName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  creatorHandle: { color: '#888', fontSize: 13, marginTop: 2 },
  subscribeBtn: { backgroundColor: '#ff0040', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  subscribeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  descriptionBox: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12, marginBottom: 16 },
  description: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  commentsSection: { marginBottom: 24 },
  commentsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  commentsTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16, gap: 8 },
  commentInput: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14, maxHeight: 80 },
  sendBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  comment: { flexDirection: 'row', marginBottom: 16 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  commentBody: { flex: 1 },
  commentAuthor: { color: '#fff', fontSize: 13, fontWeight: '600' },
  commentText: { color: '#ccc', fontSize: 14, marginTop: 4, lineHeight: 19 },
  commentTime: { color: '#666', fontSize: 11, marginTop: 4 },
  relatedSection: { marginBottom: 40 },
  relatedTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  relatedCard: { flexDirection: 'row', marginBottom: 12 },
  relatedThumb: { width: 160, height: 90, borderRadius: 8, marginRight: 12 },
  relatedInfo: { flex: 1 },
  relatedVideoTitle: { color: '#fff', fontSize: 14, fontWeight: '600', lineHeight: 19 },
  relatedMeta: { color: '#888', fontSize: 12, marginTop: 4 },
});
