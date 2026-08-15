import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
p = "app/(os)/streets/index.tsx"
src = open(p).read()
orig = src

# ── 1. Expand lucide imports ──
old_imp = "import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Pause, Send, X, Repeat, TrendingUp, Eye } from 'lucide-react-native';"
new_imp = "import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Pause, Send, X, Repeat, TrendingUp, Eye, ChevronUp, ChevronDown, Bell, Users, Home, Search, Plus, User } from 'lucide-react-native';"
src = src.replace(old_imp, new_imp)

# ── 2. Replace PostCard with TikTok-style card (right rail + arrows + overlays) ──
NEW_POSTCARD = '''// ── Post Card ──────────────────────────────────────────────
function PostCard({
  post, author, likedMap, onLike, onComment, onShare, onRepost, onBoost,
  isVisible, onView, onPrev, onNext, hasPrev, hasNext,
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
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const displayName = author?.full_name || 'Anonymous';
  const username = author?.username || 'user';
  const isLiked = likedMap[post.id] || false;

  return (
    <View style={{ marginBottom: 24, alignItems: 'center', width: '100%' }}>
      <View style={{ width: '100%', maxWidth: 480 }}>
        <View style={{ position: 'relative' }}>
          {post.media_url && post.media_type === 'video' ? (
            <VideoPlayer uri={post.media_url} thumbnailUri={post.thumbnail_url} isVisible={isVisible} onView={onView} />
          ) : post.media_url ? (
            <img src={post.media_url} alt="" style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', borderRadius: 12, display: 'block' }} />
          ) : (
            <View style={{ width: '100%', aspectRatio: '9/16', backgroundColor: '#1a1a1a', borderRadius: 12, justifyContent: 'center', padding: 16 }}>
              <Text style={{ color: '#fff', fontSize: 16, lineHeight: 24 }}>{post.content}</Text>
            </View>
          )}

          {/* Right action rail (TikTok-style) */}
          <div style={{ position: 'absolute', right: 6, bottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 6 }}>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, border: '2px solid #fff', overflow: 'hidden', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {author?.avatar_url ? (
                  <img src={author.avatar_url} alt="" style={{ width: 44, height: 44, objectFit: 'cover' }} />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{displayName.charAt(0).toUpperCase()}</Text>
                )}
              </div>
              <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', width: 18, height: 18, borderRadius: 9, backgroundColor: '#e91e63', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>+</Text>
              </div>
            </div>
            <TouchableOpacity onPress={() => onLike(post.id)} style={{ alignItems: 'center' }}>
              <Heart size={26} color={isLiked ? '#e91e63' : '#fff'} fill={isLiked ? '#e91e63' : 'none'} />
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{post.likes_count || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onComment(post)} style={{ alignItems: 'center' }}>
              <MessageCircle size={26} color="#fff" fill="#fff" />
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{post.comments_count || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onShare(post)} style={{ alignItems: 'center' }}>
              <Share2 size={26} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{post.shares_count || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onRepost(post)} style={{ alignItems: 'center' }}>
              <Repeat size={26} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 11 }}>Repost</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onBoost(post)} style={{ alignItems: 'center' }}>
              <TrendingUp size={26} color="#ffd143" />
              <Text style={{ color: '#ffd143', fontSize: 11, fontWeight: '600' }}>Boost</Text>
            </TouchableOpacity>
          </div>

          {/* Up / down navigation arrows */}
          <div style={{ position: 'absolute', right: -48, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <TouchableOpacity onPress={onPrev} disabled={!hasPrev} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center', opacity: hasPrev ? 1 : 0.35 }}>
              <ChevronUp size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onNext} disabled={!hasNext} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center', opacity: hasNext ? 1 : 0.35 }}>
              <ChevronDown size={22} color="#fff" />
            </TouchableOpacity>
          </div>

          {/* Bottom-left author + caption overlay */}
          <div style={{ position: 'absolute', left: 12, bottom: 12, right: 64, zIndex: 5 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>@{username}</Text>
            {post.caption ? <Text style={{ color: '#eee', fontSize: 13, marginTop: 4 }} numberOfLines={2}>{post.caption}</Text> : null}
            {post.hashtags && post.hashtags.length > 0 && (
              <Text style={{ color: '#fff', fontSize: 13, marginTop: 4, fontWeight: '600' }} numberOfLines={1}>
                {post.hashtags.map((t) => '#' + t).join(' ')}
              </Text>
            )}
          </div>
        </View>

        {post.content && post.media_url ? (
          <Text style={{ color: '#ddd', fontSize: 13, marginTop: 8, lineHeight: 19 }}>{post.content}</Text>
        ) : null}

        <AnalyticsOverlay post={post} />
      </View>
    </View>
  );
}

'''
start = src.find("// ── Post Card")
end = src.find("// ── Comment Modal")
if start != -1 and end != -1:
    src = src[:start] + NEW_POSTCARD + src[end:]

# ── 3. Main screen: add left rail + centered column + nav helpers ──
old_open = """  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#0a0a0a' }}>"""
new_open = """  const isWeb = typeof window !== 'undefined';
  const visibleIndex = posts.findIndex((pp) => pp.id === visiblePostId);
  const scrollToPost = (dir: number) => {
    const idx = posts.findIndex((pp) => pp.id === visiblePostId);
    const target = posts[idx + dir];
    if (!target) return;
    const el: any = itemRefs.current[target.id];
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', flexDirection: 'row' }}>
      {isWeb && (
        <View style={{ width: 68, paddingTop: 46, alignItems: 'center', gap: 16, borderRightWidth: 1, borderRightColor: '#1f1f1f', backgroundColor: '#0a0a0a' }}>
          <TouchableOpacity onPress={() => scrollToPost(-visibleIndex)} style={{ alignItems: 'center' }}>
            <Home size={22} color="#fff" />
            <Text style={{ color: '#888', fontSize: 10 }}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/streets/explore')} style={{ alignItems: 'center' }}>
            <Search size={22} color="#fff" />
            <Text style={{ color: '#888', fontSize: 10 }}>Explore</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/streets/create')} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#e91e63', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/notifications')} style={{ alignItems: 'center' }}>
            <Bell size={22} color="#fff" />
            <Text style={{ color: '#888', fontSize: 10 }}>Alerts</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/messages')} style={{ alignItems: 'center' }}>
            <MessageCircle size={22} color="#fff" />
            <Text style={{ color: '#888', fontSize: 10 }}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/profile/followers')} style={{ alignItems: 'center' }}>
            <Users size={22} color="#fff" />
            <Text style={{ color: '#888', fontSize: 10 }}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/profile')} style={{ alignItems: 'center' }}>
            <User size={22} color="#fff" />
            <Text style={{ color: '#888', fontSize: 10 }}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#0a0a0a' }}>"""
src = src.replace(old_open, new_open)

# ── 4. Center the FlatList content ──
src = src.replace(
    "contentContainerStyle={{ paddingBottom: 100 }}",
    "contentContainerStyle={{ paddingBottom: 100, alignItems: 'center' }}"
)

# ── 5. Pass nav props to PostCard ──
old_props = """              isVisible={visiblePostId === item.id}
              onView={() => handleView(item.id)}
            />"""
new_props = """              isVisible={visiblePostId === item.id}
              onView={() => handleView(item.id)}
              onPrev={() => scrollToPost(-1)}
              onNext={() => scrollToPost(1)}
              hasPrev={visibleIndex > 0}
              hasNext={visibleIndex >= 0 && visibleIndex < posts.length - 1}
            />"""
src = src.replace(old_props, new_props)

# ── 6. Close the inner column wrapper before the modals ──
src = src.replace(
    """      />

      <CommentModal""",
    """      />
      </View>

      <CommentModal"""
)

open(p, "w").write(src)
print("✅ TikTok-style layout applied" if src != orig else "❌ No changes made")
