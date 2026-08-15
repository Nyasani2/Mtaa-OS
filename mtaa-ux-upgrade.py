import os, re
os.chdir(os.path.dirname(os.path.abspath(__file__)))

def rd(p):
    return open(p).read() if os.path.exists(p) else ""
def wr(p, s):
    open(p, "w").write(s); print("  ✅", p)

# ═══════════════════════════════════════════════════════════
# 1. STREETS: smaller player, sound-on while visible, pause+mute when past, watermark, Live button
# ═══════════════════════════════════════════════════════════
p = "app/(os)/streets/index.tsx"; s = rd(p)
if s:
    # size 480 -> 420
    s = s.replace("maxWidth: 480", "maxWidth: 420")
    # play WITH sound when visible; pause+mute when scrolled past
    s = s.replace("""    if (isVisible) {
      video.play().then(() => {
        setIsPlaying(true);
        onView();
      }).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }""",
"""    if (isVisible) {
      video.muted = false;
      setIsMuted(false);
      video.play().then(() => {
        setIsPlaying(true);
        onView();
      }).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      video.muted = true;
      setIsMuted(true);
      setIsPlaying(false);
    }""")
    s = s.replace("const [isMuted, setIsMuted] = useState(true);", "const [isMuted, setIsMuted] = useState(false);")
    # remove "Tap to unmute", add MTAA watermark badge
    s = re.sub(r"\{isMuted && isPlaying && !hasInteracted && \([\s\S]*?Tap to unmute[\s\S]*?\)\}",
"""<div style={{ position: 'absolute', top: 10, left: 10, zIndex: 4, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 12, padding: '4px 10px' }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>MTAA OS</Text>
        </div>""", s)
    # Live button in rail (after Explore)
    if "/studio/live-active" not in s:
        s = s.replace("""          <TouchableOpacity onPress={() => router.push('/streets/create')} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#e91e63', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={22} color="#fff" />
          </TouchableOpacity>""",
"""          <TouchableOpacity onPress={() => router.push('/streets/create')} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#e91e63', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/studio/live-active')} style={{ alignItems: 'center' }}>
            <Video size={22} color="#ff4d6d" />
            <Text style={{ color: '#888', fontSize: 10 }}>Live</Text>
          </TouchableOpacity>""")
        s = s.replace("ChevronUp, ChevronDown, Bell, Users, Home, Search, Plus, User }", "ChevronUp, ChevronDown, Bell, Users, Home, Search, Plus, User, Video }")
    wr(p, s)

# ═══════════════════════════════════════════════════════════
# 2. SHARE MODAL: social sharing + MTAA watermark
# ═══════════════════════════════════════════════════════════
    if "shareSocial" not in s:
        s = rd(p)
        s = s.replace("const handleCopyLink = async () => {",
"""const WATERMARK = ' · via MTAA OS 🌍';
  const shareSocial = (kind: string) => {
    if (!post) return;
    const url = `${window.location.origin}/streets/post/${post.id}`;
    const text = encodeURIComponent((post.content || post.caption || 'Watch this on MTAA Streets') + WATERMARK);
    const u = encodeURIComponent(url);
    const links: any = {
      whatsapp: `https://wa.me/?text=${text}%20${u}`,
      x: `https://twitter.com/intent/tweet?text=${text}&url=${u}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${text}`,
      telegram: `https://t.me/share/url?url=${u}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    };
    if (links[kind]) window.open(links[kind], '_blank');
  };

  const handleCopyLink = async () => {""")
        s = s.replace("title: 'MTAA Streets', text: post.content || ''", "title: 'MTAA Streets', text: (post.content || '') + WATERMARK")
        s = s.replace("""          <TouchableOpacity onPress={handleCopyLink} style={{ backgroundColor: '#2a2a2a', borderRadius: 12, padding: 14, marginBottom: 10, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 15 }}>Copy Link</Text>
          </TouchableOpacity>""",
"""          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            {(['whatsapp','x','facebook','telegram','linkedin'] as any[]).map((k) => (
              <TouchableOpacity key={k} onPress={() => shareSocial(k)} style={{ flex: 1, backgroundColor: '#2a2a2a', borderRadius: 10, paddingVertical: 10, marginHorizontal: 3, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{k === 'x' ? 'X' : k[0].toUpperCase() + k.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={handleCopyLink} style={{ backgroundColor: '#2a2a2a', borderRadius: 12, padding: 14, marginBottom: 10, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 15 }}>Copy Link</Text>
          </TouchableOpacity>""")
        wr(p, s)

# ═══════════════════════════════════════════════════════════
# 3. PROFILE: crash fix + donut dropdown + content grid w/ delete + analytics
# ═══════════════════════════════════════════════════════════
pp = "app/(os)/profile/index.tsx"; ps = rd(pp)
# extract existing menu label/route pairs so NOTHING is downgraded
pairs = re.findall(r"label:\s*['\"]([^'\"]+)['\"][^}]*?route:\s*['\"]([^'\"]+)['\"]", ps)
if not pairs:
    pairs = re.findall(r"['\"]([A-Z][^'\"]*)['\"]\s*[:,][^'\"\/]*['\"](\/[^'\"]+)['\"]", ps)
menu = []
for lab, rout in pairs:
    if (lab, rout) not in menu: menu.append((lab, rout))
if not menu:
    menu = [("Edit Profile","/profile/edit"),("Privacy & Security","/settings/security"),
            ("Achievements","/profile/achievements"),("Professional","/profile/professional/portfolio"),
            ("Portfolio","/profile/professional/portfolio"),("Earnings","/profile/creator/earnings"),
            ("Family","/profile/family"),("QR Code","/profile/qr"),("Messages","/messages"),
            ("Notifications","/notifications"),("Settings","/settings")]
menu.append(("Set App PIN","/set-pin"))
menu_js = "[\n" + ",\n".join(f"    {{ label: {json_escape(l)}, route: {json_escape(r)} }}" for l, r in menu) + "\n  ]" if False else "[" + ", ".join('{ label: %r, route: %r }' % (l, r)) + "]"

NEW_PROFILE = '''// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, ActivityIndicator, Alert, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { User, ChevronRight, MoreVertical, Trash2, Eye, Heart, Share2, Play, LogOut, X } from 'lucide-react-native';

const MENU_ITEMS = ''' + menu_js + ''';

export default function ProfileIndex() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = useCallback(async () => {
    if (!user?.id) { setLoadingPosts(false); return; }
    try {
      const svc = require('@/lib/services/streets-service');
      const fn = svc.fetchPostsByUser || svc.getPostsByUser;
      if (fn) setMyPosts((await fn(user.id)) || []);
    } catch (e) { console.error('[Profile] loadPosts', e); }
    finally { setLoadingPosts(false); }
  }, [user?.id]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const { data } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle();
        if (data) setProfile(data);
      } catch (e) {}
    })();
  }, [user?.id]);

  const handleDelete = (post: any) => {
    Alert.alert('Delete post', 'Remove this post permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const svc = require('@/lib/services/streets-service');
          await svc.deletePost(post.id, user?.id);
          setMyPosts((prev) => prev.filter((x) => x.id !== post.id));
        } catch (e: any) { Alert.alert('Delete failed', String(e?.message || e)); }
      }},
    ]);
  };

  const handleAnalytics = async (post: any) => {
    try {
      const svc = require('@/lib/services/streets-service');
      const a = svc.fetchPostAnalytics ? await svc.fetchPostAnalytics(post.id) : null;
      Alert.alert('Post analytics', [
        'Views: ' + (a?.view_count ?? post.view_count ?? 0),
        'Likes: ' + (post.likes_count ?? 0),
        'Comments: ' + (post.comments_count ?? 0),
        'Shares: ' + (post.shares_count ?? 0),
      ].join('\\n'));
    } catch (e) { Alert.alert('Analytics', 'Unavailable right now'); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadPosts(); setRefreshing(false); };

  return (
    <ScrollView style={st.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e91e63" />}>
      {/* Donut menu button */}
      <TouchableOpacity style={st.donut} onPress={() => setMenuOpen((v) => !v)}>
        {menuOpen ? <X size={22} color="#fff" /> : <MoreVertical size={22} color="#fff" />}
      </TouchableOpacity>

      {/* Header */}
      <View style={st.header}>
        <View style={st.avatarWrap}>
          {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={st.avatar} />
            : <View style={st.avatarPh}><User size={40} color="#94a3b8" /></View>}
        </View>
        <Text style={st.name}>{profile?.full_name || profile?.display_name || user?.email?.split('@')[0] || 'User'}</Text>
        <Text style={st.handle}>@{profile?.username || user?.email?.split('@')[0] || 'user'}</Text>
        <View style={st.statsRow}>
          <View style={st.stat}><Text style={st.statNum}>{myPosts.length}</Text><Text style={st.statLab}>Posts</Text></View>
          <View style={st.stat}><Text style={st.statNum}>{profile?.followers_count || 0}</Text><Text style={st.statLab}>Followers</Text></View>
          <View style={st.stat}><Text style={st.statNum}>{profile?.following_count || 0}</Text><Text style={st.statLab}>Following</Text></View>
        </View>
      </View>

      {/* Dropdown with ALL features */}
      {menuOpen && (
        <View style={st.menu}>
          {MENU_ITEMS.map((m: any, i: number) => (
            <Pressable key={i} style={st.menuItem} onPress={() => { setMenuOpen(false); router.push(m.route); }}>
              <Text style={st.menuLabel}>{m.label}</Text>
              <ChevronRight size={16} color="#475569" />
            </Pressable>
          ))}
          <Pressable style={st.menuItem} onPress={() => { setMenuOpen(false); Alert.alert('Log out?', '', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: () => logout() },
          ])}}>
            <Text style={[st.menuLabel, { color: '#ef4444' }]}>Log Out</Text>
            <LogOut size={16} color="#ef4444" />
          </Pressable>
        </View>
      )}

      {/* Content grid */}
      <View style={st.gridHead}>
        <Text style={st.gridTitle}>My Content</Text>
        <Text style={st.gridSub}>{myPosts.length} posts</Text>
      </View>
      {loadingPosts ? <ActivityIndicator color="#e91e63" style={{ marginVertical: 24 }} /> : (
        <View style={st.grid}>
          {myPosts.map((post) => (
            <Pressable key={post.id} style={st.cell} onPress={() => router.push(`/streets/post/${post.id}`)}>
              {post.thumbnail_url || post.media_url ? (
                <Image source={{ uri: post.thumbnail_url || post.media_url }} style={st.thumb} />
              ) : (
                <View style={[st.thumb, { backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', padding: 6 }]}>
                  <Text style={{ color: '#94a3b8', fontSize: 10 }} numberOfLines={3}>{post.content}</Text>
                </View>
              )}
              <View style={st.cellOverlay}>
                <View style={st.cellStat}><Play size={9} color="#fff" /><Text style={st.cellStatT}>{post.view_count || 0}</Text></View>
                <View style={st.cellStat}><Heart size={9} color="#fff" /><Text style={st.cellStatT}>{post.likes_count || 0}</Text></View>
                <View style={st.cellStat}><Share2 size={9} color="#fff" /><Text style={st.cellStatT}>{post.shares_count || 0}</Text></View>
              </View>
              <View style={st.cellActions}>
                <TouchableOpacity onPress={() => handleAnalytics(post)} style={st.cellBtn}><Eye size={13} color="#7dd3fc" /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(post)} style={st.cellBtn}><Trash2 size={13} color="#f87171" /></TouchableOpacity>
              </View>
            </Pressable>
          ))}
          {myPosts.length === 0 && (
            <View style={{ paddingVertical: 40, alignItems: 'center', width: '100%' }}>
              <Text style={{ color: '#64748b', fontSize: 14 }}>No posts yet — create your first one!</Text>
              <TouchableOpacity style={{ marginTop: 12, backgroundColor: '#e91e63', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 }} onPress={() => router.push('/streets/create')}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Create Post</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  donut: { position: 'absolute', top: 48, right: 16, zIndex: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  header: { alignItems: 'center', padding: 24, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  avatarWrap: { marginBottom: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: '#e91e63' },
  avatarPh: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 22, fontWeight: '700', color: '#f8fafc' },
  handle: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 28 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  statLab: { fontSize: 11, color: '#64748b', marginTop: 2 },
  menu: { margin: 12, backgroundColor: '#1e293b', borderRadius: 14, padding: 6, borderWidth: 1, borderColor: '#334155' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#0f172a' },
  menuLabel: { flex: 1, fontSize: 14, color: '#e2e8f0', fontWeight: '500' },
  gridHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16 },
  gridTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  gridSub: { color: '#64748b', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingTop: 10, justifyContent: 'space-between' },
  cell: { width: '32%', marginBottom: 8, borderRadius: 10, overflow: 'hidden', backgroundColor: '#1e293b', position: 'relative' },
  thumb: { width: '100%', aspectRatio: 0.75, borderRadius: 10 },
  cellOverlay: { position: 'absolute', left: 4, right: 4, bottom: 26, flexDirection: 'row', gap: 6, justifyContent: 'center' },
  cellStat: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 2 },
  cellStatT: { color: '#fff', fontSize: 9, fontWeight: '600' },
  cellActions: { position: 'absolute', right: 4, top: 4, flexDirection: 'row', gap: 4 },
  cellBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
});
'''
wr(pp, NEW_PROFILE)
print("\n✅ Profile rebuilt: donut dropdown (all features) + content grid + delete + analytics")
