import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput, FlatList,
  ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

interface VideoData {
  id: string;
  title: string;
  description: string;
  video_url: string;
  view_count: number;
  like_count: number;
  creator_id: string;
  creator_name: string;
  creator_avatar: string;
  published_at: string;
  is_subscribed: boolean;
}

interface Comment {
  id: string;
  text: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
  like_count: number;
}

interface RelatedVideo {
  id: string;
  title: string;
  thumbnail_url: string;
  view_count: number;
  creator_name: string;
  duration_seconds: number;
}

export default function VideoPlayerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const videoRef = useRef<Video>(null);

  const [video, setVideo] = useState<VideoData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [related, setRelated] = useState<RelatedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const fetchVideo = async () => {
    if (!id) return;
    setLoading(true);

    // FIXED 2026-07-18: studio_videos.creator_id has a real FK, but it
    // points to auth.users(id) — which has no full_name/avatar_url
    // columns. The embedded relationship syntax below was guaranteed to
    // fail (PostgREST would try to embed auth.users, not user_profiles,
    // for those requested columns). Fetching the creator profile
    // separately from user_profiles instead.
    const { data, error } = await supabase
      .from('studio_videos')
      .select('id, title, description, video_url, view_count, like_count, creator_id, published_at')
      .eq('id', id)
      .single();

    if (!error && data) {
      const { data: creatorProfile } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url')
        .eq('user_id', data.creator_id)
        .maybeSingle();

      // Check subscription
      const { data: sub } = await supabase
        .from('studio_subscriptions')
        .select('id')
        .eq('creator_id', data.creator_id)
        .eq('subscriber_id', user?.id)
        .single();

      // Check like
      const { data: like } = await supabase
        .from('studio_likes')
        .select('id')
        .eq('video_id', id)
        .eq('user_id', user?.id)
        .single();

      setVideo({
        id: data.id,
        title: data.title,
        description: data.description,
        video_url: data.video_url,
        view_count: data.view_count || 0,
        like_count: data.like_count || 0,
        creator_id: data.creator_id,
        creator_name: creatorProfile?.full_name || 'Unknown',
        creator_avatar: creatorProfile?.avatar_url || '',
        published_at: data.published_at,
        is_subscribed: !!sub,
      });
      setIsLiked(!!like);

      // Increment view
      await supabase.from('studio_videos').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id);
      await supabase.from('studio_views').insert({ video_id: id, creator_id: data.creator_id, user_id: user?.id });
    }

    // Fetch comments
    const { data: commentsData } = await supabase
      .from('studio_comments')
      .select('id, text, created_at, like_count, user:user_id (full_name, avatar_url)')
      .eq('video_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    setComments((commentsData || []).map((c: any) => ({
      id: c.id,
      text: c.text,
      full_name: c.user?.full_name || 'Anonymous',
      avatar_url: c.user?.avatar_url || '',
      created_at: c.created_at,
      like_count: c.like_count || 0,
    })));

    // Fetch related
    const { data: relatedData } = await supabase
      .from('studio_videos')
      .select('id, title, thumbnail_url, view_count, duration_seconds, creator:creator_id (full_name)')
      .neq('id', id)
      .eq('status', 'published')
      .limit(10);

    setRelated((relatedData || []).map((v: any) => ({
      id: v.id,
      title: v.title,
      thumbnail_url: v.thumbnail_url,
      view_count: v.view_count || 0,
      creator_name: v.creator?.full_name || 'Unknown',
      duration_seconds: v.duration_seconds || 0,
    })));

    setLoading(false);
  };

  useEffect(() => { fetchVideo(); }, [id, user?.id]);

  const handleLike = async () => {
    if (!user?.id || !video) return;
    if (isLiked) {
      await supabase.from('studio_likes').delete().eq('video_id', id).eq('user_id', user.id);
      setVideo(prev => prev ? { ...prev, like_count: prev.like_count - 1 } : prev);
    } else {
      await supabase.from('studio_likes').insert({ video_id: id, user_id: user.id });
      setVideo(prev => prev ? { ...prev, like_count: prev.like_count + 1 } : prev);
    }
    setIsLiked(!isLiked);
  };

  const handleSubscribe = async () => {
    if (!user?.id || !video) return;
    if (video.is_subscribed) {
      await supabase.from('studio_subscriptions').delete().eq('creator_id', video.creator_id).eq('subscriber_id', user.id);
      setVideo(prev => prev ? { ...prev, is_subscribed: false } : prev);
    } else {
      await supabase.from('studio_subscriptions').insert({ creator_id: video.creator_id, subscriber_id: user.id });
      setVideo(prev => prev ? { ...prev, is_subscribed: true } : prev);
    }
  };

  const postComment = async () => {
    if (!user?.id || !commentText.trim() || !id) return;
    const { error } = await supabase.from('studio_comments').insert({
      video_id: id,
      user_id: user.id,
      text: commentText.trim(),
    });
    if (!error) {
      setCommentText('');
      fetchVideo();
    }
  };

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return `${count}`;
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff0000" />
      </SafeAreaView>
    );
  }

  if (!video) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <Feather name="film" size={48} color="#333" />
        <Text style={{ color: '#666', marginTop: 16 }}>Video not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      {/* Video Player */}
      <View style={{ width, height: width * 0.56, backgroundColor: '#000' }}>
        {video.video_url ? (
          <Video
            ref={videoRef}
            source={{ uri: video.video_url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Feather name="film" size={48} color="#333" />
            <Text style={{ color: '#666', marginTop: 12 }}>Video unavailable</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title & Actions */}
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }} numberOfLines={2}>{video.title}</Text>
          <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{formatViews(video.view_count)} views • {new Date(video.published_at).toLocaleDateString()}</Text>

          {/* Action Bar */}
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
            <TouchableOpacity onPress={handleLike} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
              <Feather name={isLiked ? 'thumbs-up' : 'thumbs-up'} size={16} color={isLiked ? '#ff0000' : '#fff'} />
              <Text style={{ color: '#fff', marginLeft: 6, fontSize: 13 }}>{formatViews(video.like_count)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
              <Feather name="share-2" size={16} color="#fff" />
              <Text style={{ color: '#fff', marginLeft: 6, fontSize: 13 }}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowComments(!showComments)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
              <Feather name="message-square" size={16} color="#fff" />
              <Text style={{ color: '#fff', marginLeft: 6, fontSize: 13 }}>{comments.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
              <Feather name="download" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Creator Info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#333' }} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>{video.creator_name}</Text>
            <Text style={{ color: '#888', fontSize: 11 }}>Creator</Text>
          </View>
          <TouchableOpacity
            onPress={handleSubscribe}
            style={{
              backgroundColor: video.is_subscribed ? '#1a1a1a' : '#ff0000',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: video.is_subscribed ? 1 : 0,
              borderColor: '#333',
            }}
          >
            <Text style={{ color: video.is_subscribed ? '#888' : '#fff', fontWeight: 'bold', fontSize: 13 }}>
              {video.is_subscribed ? 'Subscribed' : 'Subscribe'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
          <Text style={{ color: '#ccc', fontSize: 13, lineHeight: 20 }}>{video.description || 'No description'}</Text>
        </View>

        {/* Comments Section */}
        {showComments && (
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Comments ({comments.length})</Text>

            {/* Comment Input */}
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#333' }} />
              <View style={{ flex: 1, marginLeft: 10, flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Add a comment..."
                  placeholderTextColor="#555"
                  style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, color: '#fff', fontSize: 13 }}
                />
                <TouchableOpacity onPress={postComment} style={{ marginLeft: 8, padding: 8 }}>
                  <Feather name="send" size={18} color={commentText.trim() ? '#ff0000' : '#444'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Comments List */}
            {comments.map(comment => (
              <View key={comment.id} style={{ flexDirection: 'row', marginBottom: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#333' }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>{comment.full_name}</Text>
                    <Text style={{ color: '#555', fontSize: 11, marginLeft: 8 }}>{new Date(comment.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Text style={{ color: '#ccc', fontSize: 13, marginTop: 2 }}>{comment.text}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Feather name="thumbs-up" size={12} color="#666" />
                      <Text style={{ color: '#666', fontSize: 11, marginLeft: 4 }}>{comment.like_count}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginLeft: 16 }}>
                      <Text style={{ color: '#666', fontSize: 11 }}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Related Videos */}
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Related Videos</Text>
          {related.map(v => (
            <TouchableOpacity
              key={v.id}
              onPress={() => router.push(`/(os)/studio/video-player?id=${v.id}`)}
              style={{ flexDirection: 'row', marginBottom: 12 }}
            >
              <View style={{ width: 140, height: 80, borderRadius: 6, overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
                {v.thumbnail_url ? (
                  <Image source={{ uri: v.thumbnail_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Feather name="film" size={20} color="#444" />
                  </View>
                )}
                <View style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 2, paddingHorizontal: 4, paddingVertical: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 9 }}>{formatDuration(v.duration_seconds)}</Text>
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: 10, justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }} numberOfLines={2}>{v.title}</Text>
                <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{v.creator_name}</Text>
                <Text style={{ color: '#666', fontSize: 11 }}>{formatViews(v.view_count)} views</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
