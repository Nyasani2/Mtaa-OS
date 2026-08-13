import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  Platform, Dimensions, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Heart, MessageCircle, Share2, Bookmark, Play,
  Home, Search, Users, Mail, Bell, User, Plus,
  ChevronUp, ChevronDown, Music, MoreHorizontal, Send, X,
} from 'lucide-react-native';
import { useStreets } from '@/lib/hooks/useStreets';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';
import type { StreetsPost } from '@/lib/services/streets-service';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const VIDEO_W = Platform.OS === 'web' ? 360 : SCREEN_W;
const SIDEBAR_W = 60;
const ACTION_W = 60;

// ── Video Player (memoized, self-contained) ─────────────────
const VideoPlayer = memo(function VideoPlayer({
  uri, thumbnailUri,
}: {
  uri: string; thumbnailUri?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Self-contained intersection observer — no parent deps
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const v = videoRef.current;
    const container = containerRef.current;
    if (!v || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            v.muted = false;
            v.play().catch(() => {});
            setIsPlaying(true);
            setIsMuted(false);
          } else {
            v.pause();
            v.muted = true;
            setIsPlaying(false);
            setIsMuted(true);
          }
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) {
      v.pause();
      setIsPlaying(false);
    } else {
      v.muted = false;
      setIsMuted(false);
      v.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: VIDEO_W, aspectRatio: '9/16', backgroundColor: '#000', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}>
      <video
        ref={videoRef}
        src={uri}
        poster={thumbnailUri}
        muted={isMuted}
        loop
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {!isPlaying && (
        <div onClick={togglePlay} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <Play size={48} color="#fff" fill="#fff" />
        </div>
      )}
      {isPlaying && isMuted && (
        <div onClick={togglePlay} style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, padding: '6px 10px', cursor: 'pointer' }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>TAP FOR SOUND</Text>
        </div>
      )}
    </div>
  );
});

// ── Left Sidebar ───────────────────────────────────────────
function LeftSidebar({ unreadMessages, unreadNotifications, onNavigate }: any) {
  const router = useRouter();
  const items = [
    { icon: Home, label: 'Home', route: '/streets', badge: 0 },
    { icon: Search, label: 'Discover', route: '/streets/search', badge: 0 },
    { icon: Users, label: 'Following', route: '/streets/following', badge: 0 },
    { icon: Mail, label: 'Messages', route: '/messages', badge: unreadMessages },
    { icon: Bell, label: 'Notifications', route: '/streets/notifications', badge: unreadNotifications },
    { icon: User, label: 'Profile', route: '/profile', badge: 0 },
  ];
  return (
    <View style={{ width: SIDEBAR_W, height: '100%', backgroundColor: '#0a0a0a', alignItems: 'center', paddingTop: 20, paddingBottom: 20, borderRightWidth: 1, borderRightColor: '#1a1a1a' }}>
      {items.map((item, idx) => (
        <TouchableOpacity key={idx} onPress={() => onNavigate(item.route)} style={{ alignItems: 'center', marginBottom: 24, position: 'relative' }}>
          <item.icon size={24} color="#fff" />
          {item.badge > 0 && (
            <View style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#e91e63', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{item.badge > 99 ? '99+' : item.badge}</Text>
            </View>
          )}
          <Text style={{ color: '#888', fontSize: 10, marginTop: 4 }}>{item.label}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={() => router.push('/streets/create')} style={{ marginTop: 'auto', backgroundColor: '#e91e63', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
        <Plus size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ── Right Action Bar ───────────────────────────────────────
function RightActionBar({ post, author, likedMap, bookmarkedMap, onLike, onComment, onShare, onBookmark }: any) {
  const isLiked = likedMap[post.id] || false;
  const isBookmarked = bookmarkedMap[post.id] || false;
  return (
    <View style={{ width: ACTION_W, alignItems: 'center', paddingVertical: 20, gap: 20 }}>
      <View style={{ position: 'relative' }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#333', overflow: 'hidden', borderWidth: 2, borderColor: '#fff' }}>
          {author?.avatar_url ? (
            <img src={author.avatar_url} alt="" style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover' }} />
          ) : (
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#e91e63', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{(author?.full_name || 'A').charAt(0)}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#e91e63', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0a0a0a' }}>
          <Plus size={12} color="#fff" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={(e: any) => { e.stopPropagation(); onLike(post.id); }} style={{ alignItems: 'center' }}>
        <Heart size={32} color={isLiked ? '#e91e63' : '#fff'} fill={isLiked ? '#e91e63' : 'none'} />
        <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>{post.likes_count}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={(e: any) => { e.stopPropagation(); onComment(post); }} style={{ alignItems: 'center' }}>
        <MessageCircle size={32} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>{post.comments_count}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={(e: any) => { e.stopPropagation(); onBookmark(post); }} style={{ alignItems: 'center' }}>
        <Bookmark size={32} color={isBookmarked ? '#ffd700' : '#fff'} fill={isBookmarked ? '#ffd700' : 'none'} />
        <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>{post.saves_count}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={(e: any) => { e.stopPropagation(); onShare(post); }} style={{ alignItems: 'center' }}>
        <Share2 size={32} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>{post.shares_count}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ alignItems: 'center' }}>
        <MoreHorizontal size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ── Comment Panel ──────────────────────────────────────────
function CommentPanel({ visible, post, authors, onClose }: any) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const { getComments, postComment } = useStreets();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && post) getComments(post.id).then(setComments);
  }, [visible, post, getComments]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [comments]);

  const handleSubmit = async () => {
    if (!post || !newComment.trim()) return;
    const comment = await postComment(post.id, newComment.trim());
    if (comment) { setComments((prev) => [...prev, comment]); setNewComment(''); }
  };

  if (!post) return null;
  return (
    <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 380, backgroundColor: '#1a1a1a', borderLeftWidth: 1, borderLeftColor: '#333', zIndex: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#333' }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Comments ({post.comments_count})</Text>
        <TouchableOpacity onPress={onClose}><X size={24} color="#fff" /></TouchableOpacity>
      </View>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {comments.map((c) => (
          <View key={c.id} style={{ flexDirection: 'row', marginBottom: 16 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#e91e63', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{(authors[c.user_id]?.full_name || 'A').charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{authors[c.user_id]?.full_name || 'Anonymous'}</Text>
              <Text style={{ color: '#ccc', fontSize: 14, marginTop: 2 }}>{c.content}</Text>
              <Text style={{ color: '#666', fontSize: 11, marginTop: 4 }}>{new Date(c.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
        ))}
      </div>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#333' }}>
        <TextInput
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
          placeholderTextColor="#888"
          style={{ flex: 1, color: '#fff', padding: 10, backgroundColor: '#333', borderRadius: 20, marginRight: 10 }}
        />
        <TouchableOpacity onPress={handleSubmit} style={{ backgroundColor: '#e91e63', borderRadius: 20, padding: 10 }}>
          <Send size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Feed Screen ───────────────────────────────────────
export default function StreetsFeedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { posts, authors, loading, loadPosts, likePost, isLiked, handleShare } = useStreets();
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});
  const [commentPost, setCommentPost] = useState<StreetsPost | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    posts.forEach(async (post) => {
      const liked = await isLiked(post.id);
      setLikedMap((prev) => ({ ...prev, [post.id]: liked }));
    });
  }, [posts, user?.id, isLiked]);

  const handleLike = useCallback(async (postId: string) => {
    const result = await likePost(postId);
    setLikedMap((prev) => ({ ...prev, [postId]: result.liked }));
  }, [likePost]);

  const handleBookmark = useCallback(async (post: StreetsPost) => {
    if (!user?.id) return;
    const currentlySaved = bookmarkedMap[post.id] || false;
    try {
      if (currentlySaved) {
        await supabase.from('streets_saves').delete().eq('post_id', post.id).eq('user_id', user.id);
        setBookmarkedMap((prev) => ({ ...prev, [post.id]: false }));
      } else {
        await supabase.from('streets_saves').insert({ post_id: post.id, user_id: user.id });
        setBookmarkedMap((prev) => ({ ...prev, [post.id]: true }));
      }
      const { count } = await supabase.from('streets_saves').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
      await supabase.from('streets_posts').update({ saves_count: count || 0 }).eq('id', post.id);
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  }, [user?.id, bookmarkedMap]);

  const handleSharePress = useCallback(async (post: StreetsPost) => {
    if (!user?.id) return;
    try {
      await handleShare(post.id);
      const url = `${window.location.origin}/streets/post/${post.id}`;
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Share error:', err);
    }
  }, [user?.id, handleShare]);

  const scrollTo = (direction: 'up' | 'down') => {
    const newIndex = direction === 'down'
      ? Math.min(currentIndex + 1, posts.length - 1)
      : Math.max(currentIndex - 1, 0);
    setCurrentIndex(newIndex);
    const el = document.querySelector(`[data-post-index="${newIndex}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', flexDirection: 'row' }}>
      <LeftSidebar unreadMessages={3} unreadNotifications={7} onNavigate={(r: string) => router.push(r as any)} />
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
        <View style={{ flex: 1, maxWidth: VIDEO_W + ACTION_W + 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'relative' }}>
            {loading ? (
              <View style={{ width: VIDEO_W, height: SCREEN_H * 0.8, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#e91e63" />
              </View>
            ) : posts.length === 0 ? (
              <View style={{ width: VIDEO_W, height: SCREEN_H * 0.8, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#666', fontSize: 16 }}>No posts yet</Text>
                <TouchableOpacity onPress={() => router.push('/streets/create')} style={{ marginTop: 16, backgroundColor: '#e91e63', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Create First Post</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={{ height: SCREEN_H - 40 }} contentContainerStyle={{ alignItems: 'center', paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
                {posts.map((post, idx) => (
                  <div key={post.id} data-post-index={idx} style={{ marginBottom: 40 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                      <View style={{ position: 'relative' }}>
                        <VideoPlayer uri={post.media_url || ''} thumbnailUri={post.thumbnail_url} />
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: 'rgba(0,0,0,0.4)' }}>
                          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{authors[post.creator_id]?.full_name || 'Anonymous'}</Text>
                          <Text style={{ color: '#ccc', fontSize: 13, marginTop: 2 }}>{post.caption || ''}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Music size={14} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: 12, marginLeft: 4 }}>Original Sound</Text>
                          </View>
                        </View>
                      </View>

                      {posts.length > 1 && (
                        <View style={{ width: 40, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                          <TouchableOpacity onPress={() => scrollTo('up')} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 24, padding: 10 }}>
                            <ChevronUp size={24} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => scrollTo('down')} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 24, padding: 10 }}>
                            <ChevronDown size={24} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      )}

                      <RightActionBar
                        post={post}
                        author={authors[post.creator_id]}
                        likedMap={likedMap}
                        bookmarkedMap={bookmarkedMap}
                        onLike={handleLike}
                        onComment={setCommentPost}
                        onShare={handleSharePress}
                        onBookmark={handleBookmark}
                      />
                    </View>
                  </div>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </View>
      {commentPost && <CommentPanel visible={!!commentPost} post={commentPost} authors={authors} onClose={() => setCommentPost(null)} />}
    </View>
  );
}
