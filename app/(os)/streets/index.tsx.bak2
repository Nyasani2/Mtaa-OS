import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Pause, Send, X, Repeat, TrendingUp, Eye } from 'lucide-react-native';
import { useStreets } from '@/domains/streets/hooks/useStreets';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import type { StreetsPost } from '@/lib/services/streets-service';

// ── Video Player ───────────────────────────────────────────
function VideoPlayer({
  uri,
  thumbnailUri,
  isVisible,
  onView,
}: {
  uri: string;
  thumbnailUri?: string;
  isVisible: boolean;
  onView: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isVisible) {
      video.play().then(() => {
        setIsPlaying(true);
        onView();
      }).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isVisible, onView]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
      if (!hasInteracted) { setHasInteracted(true); onView(); }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div
      style={{ position: 'relative', width: '100%', aspectRatio: '9/16', backgroundColor: '#000', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={uri}
        poster={thumbnailUri}
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {!isPlaying && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <Play size={48} color="#fff" />
        </div>
      )}
      <button
        onClick={toggleMute}
        style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 20, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {isMuted ? <VolumeX size={18} color="#fff" /> : <Volume2 size={18} color="#fff" />}
      </button>
      {isMuted && isPlaying && !hasInteracted && (
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: '6px 14px' }}>
          <Text style={{ color: '#fff', fontSize: 12 }}>Tap to unmute</Text>
        </div>
      )}
    </div>
  );
}

// ── Analytics Overlay ──────────────────────────────────────
function AnalyticsOverlay({ post }: { post: StreetsPost }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8, paddingHorizontal: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Eye size={14} color="#888" />
        <Text style={{ color: '#888', fontSize: 12 }}>{post.view_count || 0}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Heart size={14} color="#888" />
        <Text style={{ color: '#888', fontSize: 12 }}>{post.likes_count || 0}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <MessageCircle size={14} color="#888" />
        <Text style={{ color: '#888', fontSize: 12 }}>{post.comments_count || 0}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Share2 size={14} color="#888" />
        <Text style={{ color: '#888', fontSize: 12 }}>{post.shares_count || 0}</Text>
      </View>
    </View>
  );
}

// ── Post Card ──────────────────────────────────────────────
function PostCard({
  post,
  author,
  likedMap,
  onLike,
  onComment,
  onShare,
  onRepost,
  onBoost,
  isVisible,
  onView,
}: {
  post: StreetsPost;
  author?: { full_name?: string; username?: string; avatar_url?: string };
  likedMap: Record<string, boolean>;
  onLike: (id: string) => void;
  onComment: (post: StreetsPost) => void;
  onShare: (post: StreetsPost) => void;
  onRepost: (post: StreetsPost) => void;
  onBoost: (post: StreetsPost) => void;
  isVisible: boolean;
  onView: () => void;
}) {
  const displayName = author?.full_name || 'Anonymous';
  const username = author?.username || 'user';
  const isLiked = likedMap[post.id] || false;

  return (
    <View style={{ marginBottom: 20, paddingHorizontal: 12 }}>
      {/* Author header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', marginRight: 10, overflow: 'hidden' }}>
          {author?.avatar_url ? (
            <img src={author.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: 20, objectFit: 'cover' }} />
          ) : (
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#e91e63', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>{displayName}</Text>
          <Text style={{ color: '#888', fontSize: 12 }}>@{username}</Text>
        </View>
        <TouchableOpacity
          onPress={() => onBoost(post)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a2a', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 }}
        >
          <TrendingUp size={14} color="#e91e63" />
          <Text style={{ color: '#e91e63', fontSize: 12, marginLeft: 4, fontWeight: '600' }}>Boost</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {post.content ? (
        <Text style={{ color: '#fff', fontSize: 14, marginBottom: 8, lineHeight: 20 }}>{post.content}</Text>
      ) : null}

      {/* Media */}
      {post.media_url && post.media_type === 'video' ? (
        <VideoPlayer uri={post.media_url} thumbnailUri={post.thumbnail_url} isVisible={isVisible} onView={onView} />
      ) : post.media_url ? (
        <img src={post.media_url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 12 }} />
      ) : null}

      {/* Caption */}
      {post.caption ? <Text style={{ color: '#aaa', fontSize: 13, marginTop: 8 }}>{post.caption}</Text> : null}

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
          {post.hashtags.map((tag, i) => (
            <Text key={i} style={{ color: '#e91e63', fontSize: 13, marginRight: 8 }}>#{tag}</Text>
          ))}
        </View>
      )}

      {/* Analytics */}
      <AnalyticsOverlay post={post} />

      {/* Actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 24 }}>
        <TouchableOpacity onPress={() => onLike(post.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Heart size={22} color={isLiked ? '#e91e63' : '#fff'} fill={isLiked ? '#e91e63' : 'none'} />
          <Text style={{ color: '#fff', fontSize: 13 }}>{post.likes_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onComment(post)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MessageCircle size={22} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 13 }}>{post.comments_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onShare(post)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Share2 size={22} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 13 }}>{post.shares_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onRepost(post)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Repeat size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Comment Modal ──────────────────────────────────────────
function CommentModal({ visible, post, onClose }: { visible: boolean; post: StreetsPost | null; onClose: () => void }) {
  const { getComments, postComment, authors } = useStreets();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible && post) getComments(post.id).then(setComments);
  }, [visible, post, getComments]);

  const handleSend = async () => {
    if (!post || !newComment.trim()) return;
    setSending(true);
    const comment = await postComment(post.id, newComment.trim());
    setSending(false);
    if (comment) { setComments((prev) => [...prev, comment]); setNewComment(''); }
  };

  if (!visible || !post) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Comments</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color="#fff" /></TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 300 }}>
            {comments.length === 0 ? (
              <Text style={{ color: '#888', textAlign: 'center', paddingVertical: 20 }}>No comments yet</Text>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={{ marginBottom: 12, flexDirection: 'row' }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e91e63', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{(authors[c.user_id]?.full_name || 'A').charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>{authors[c.user_id]?.full_name || 'Anonymous'}</Text>
                    <Text style={{ color: '#ccc', fontSize: 13, marginTop: 2 }}>{c.content}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 }}>
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              placeholderTextColor="#666"
              style={{ flex: 1, backgroundColor: '#2a2a2a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14 }}
            />
            <TouchableOpacity onPress={handleSend} disabled={sending || !newComment.trim()}>
              {sending ? <ActivityIndicator size="small" color="#e91e63" /> : <Send size={22} color={newComment.trim() ? '#e91e63' : '#666'} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Share Modal ────────────────────────────────────────────
function ShareModal({ visible, post, onClose, onRepost }: { visible: boolean; post: StreetsPost | null; onClose: () => void; onRepost: (post: StreetsPost) => void }) {
  const [repostCaption, setRepostCaption] = useState('');
  const [reposting, setReposting] = useState(false);

  const handleRepost = async () => {
    if (!post) return;
    setReposting(true);
    await onRepost(post);
    setReposting(false);
    setRepostCaption('');
    onClose();
  };

  const handleCopyLink = async () => {
    if (!post) return;
    const url = `${window.location.origin}/streets/post/${post.id}`;
    try { await navigator.clipboard.writeText(url); alert('Link copied!'); } catch { alert('Could not copy'); }
  };

  const handleNativeShare = async () => {
    if (!post) return;
    try { await navigator.share({ title: 'MTAA Streets', text: post.content || '', url: `${window.location.origin}/streets/post/${post.id}` }); } catch { /* cancelled */ }
  };

  if (!visible || !post) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Share</Text>
          <TouchableOpacity onPress={handleNativeShare} style={{ backgroundColor: '#2a2a2a', borderRadius: 12, padding: 14, marginBottom: 10, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 15 }}>Share via...</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCopyLink} style={{ backgroundColor: '#2a2a2a', borderRadius: 12, padding: 14, marginBottom: 10, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 15 }}>Copy Link</Text>
          </TouchableOpacity>
          <View style={{ marginTop: 10 }}>
            <Text style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>Repost with caption:</Text>
            <TextInput
              value={repostCaption}
              onChangeText={setRepostCaption}
              placeholder="Say something about this..."
              placeholderTextColor="#666"
              style={{ backgroundColor: '#2a2a2a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 14, marginBottom: 10 }}
            />
            <TouchableOpacity onPress={handleRepost} disabled={reposting} style={{ backgroundColor: '#e91e63', borderRadius: 12, padding: 14, alignItems: 'center' }}>
              {reposting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Repost</Text>}
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ color: '#888', fontSize: 15 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Boost Modal ────────────────────────────────────────────
function BoostModal({ visible, post, onClose, onBoost }: { visible: boolean; post: StreetsPost | null; onClose: () => void; onBoost: (postId: string, budget: number, days: number) => Promise<any> }) {
  const [budget, setBudget] = useState('500');
  const [days, setDays] = useState('7');
  const [boosting, setBoosting] = useState(false);
  const [boostResult, setBoostResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleBoost = async () => {
    if (!post) return;
    setBoosting(true);
    setBoostResult(null);
    const result = await onBoost(post.id, parseInt(budget) || 500, parseInt(days) || 7);
    setBoosting(false);
    if (result.success) {
      setBoostResult({ success: true, message: 'Post boosted successfully! Your advert is pending review.' });
      setTimeout(() => { onClose(); setBoostResult(null); }, 2000);
    } else {
      setBoostResult({ success: false, message: result.error || 'Boost failed' });
    }
  };

  if (!visible || !post) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 4 }}>Boost Post</Text>
          <Text style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>Promote this post to reach more people</Text>

          <View style={{ backgroundColor: '#2a2a2a', borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 14 }} numberOfLines={2}>{post.content || post.caption || 'Media post'}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8, gap: 12 }}>
              <Text style={{ color: '#888', fontSize: 12 }}><Eye size={12} color="#888" /> {post.view_count || 0} views</Text>
              <Text style={{ color: '#888', fontSize: 12 }}><Heart size={12} color="#888" /> {post.likes_count || 0} likes</Text>
            </View>
          </View>

          <Text style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>Budget (KES)</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {['100', '500', '1000', '5000'].map((b) => (
              <TouchableOpacity
                key={b}
                onPress={() => setBudget(b)}
                style={{
                  flex: 1,
                  backgroundColor: budget === b ? '#e91e63' : '#2a2a2a',
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: budget === b ? '700' : '400' }}>KES {b}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>Duration (days)</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            {['3', '7', '14', '30'].map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setDays(d)}
                style={{
                  flex: 1,
                  backgroundColor: days === d ? '#e91e63' : '#2a2a2a',
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: days === d ? '700' : '400' }}>{d} days</Text>
              </TouchableOpacity>
            ))}
          </View>

          {boostResult && (
            <View style={{ backgroundColor: boostResult.success ? '#1a3a1a' : '#3a1a1a', borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <Text style={{ color: boostResult.success ? '#4caf50' : '#ff6b6b', fontSize: 13, textAlign: 'center' }}>{boostResult.message}</Text>
            </View>
          )}

          <TouchableOpacity onPress={handleBoost} disabled={boosting} style={{ backgroundColor: '#e91e63', borderRadius: 12, padding: 14, alignItems: 'center' }}>
            {boosting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Boost for KES {budget}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ color: '#888', fontSize: 15 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Feed Screen ───────────────────────────────────────
export default function StreetsFeedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    posts,
    authors,
    loading,
    refreshing,
    error,
    loadPosts,
    likePost,
    isLiked,
    handleShare,
    handleRepost,
    markViewed,
    handleBoost,
  } = useStreets();

  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [commentPost, setCommentPost] = useState<StreetsPost | null>(null);
  const [sharePostState, setSharePostState] = useState<StreetsPost | null>(null);
  const [boostPostState, setBoostPostState] = useState<StreetsPost | null>(null);
  const [visiblePostId, setVisiblePostId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    posts.forEach(async (post) => {
      const liked = await isLiked(post.id);
      setLikedMap((prev) => ({ ...prev, [post.id]: liked }));
    });
  }, [posts, user?.id, isLiked]);

  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const postId = entry.target.getAttribute('data-post-id');
          if (entry.isIntersecting && postId) setVisiblePostId(postId);
        });
      },
      { threshold: 0.6 }
    );
    Object.values(itemRefs.current).forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [posts]);

  const handleLike = useCallback(async (postId: string) => {
    const result = await likePost(postId);
    setLikedMap((prev) => ({ ...prev, [postId]: result.liked }));
  }, [likePost]);

  const handleComment = useCallback((post: StreetsPost) => setCommentPost(post), []);
  const handleSharePress = useCallback((post: StreetsPost) => { handleShare(post.id); setSharePostState(post); }, [handleShare]);
  const handleRepostPress = useCallback(async (post: StreetsPost) => { await handleRepost(post.id); }, [handleRepost]);
  const handleBoostPress = useCallback((post: StreetsPost) => setBoostPostState(post), []);
  const handleView = useCallback((postId: string) => markViewed(postId), [markViewed]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#0a0a0a' }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Streets</Text>
        <TouchableOpacity onPress={() => router.push('/streets/create')} style={{ backgroundColor: '#e91e63', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '300' }}>+</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={{ backgroundColor: '#3a1a1a', padding: 12, marginHorizontal: 12, borderRadius: 8, marginBottom: 8 }}>
          <Text style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</Text>
        </View>
      )}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPosts(true)} tintColor="#e91e63" />}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <div ref={(el) => { itemRefs.current[item.id] = el; }} data-post-id={item.id}>
            <PostCard
              post={item}
              author={authors[item.creator_id]}
              likedMap={likedMap}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleSharePress}
              onRepost={handleRepostPress}
              onBoost={handleBoostPress}
              isVisible={visiblePostId === item.id}
              onView={() => handleView(item.id)}
            />
          </div>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#e91e63" />
            </View>
          ) : (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <Text style={{ color: '#666', fontSize: 15 }}>No posts yet</Text>
              <TouchableOpacity onPress={() => router.push('/streets/create')} style={{ marginTop: 16, backgroundColor: '#e91e63', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Create First Post</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      <CommentModal visible={!!commentPost} post={commentPost} onClose={() => setCommentPost(null)} />
      <ShareModal visible={!!sharePostState} post={sharePostState} onClose={() => setSharePostState(null)} onRepost={handleRepostPress} />
      <BoostModal visible={!!boostPostState} post={boostPostState} onClose={() => setBoostPostState(null)} onBoost={handleBoost} />
    </View>
  );
}
