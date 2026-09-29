// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, StyleSheet, RefreshControl, Dimensions, Modal, Alert, Share as RNShare } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as T from '@/lib/tribes/services/tribes.service';
import { stripExifData } from '@/lib/services/privacy-service';

const TABS = ['Community', 'Museum', 'People', 'Governance'];
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function TribeHome() {
const { id } = useLocalSearchParams();
const router = useRouter();
const { user } = useAuthStore();
const [tribe, setTribe] = useState(null);
const [tab, setTab] = useState('Community');
const [role, setRole] = useState('none');
const [count, setCount] = useState(0);
const [posts, setPosts] = useState([]);
const [members, setMembers] = useState([]);
const [knowledge, setKnowledge] = useState([]);
const [loading, setLoading] = useState(true);
const [commentingOn, setCommentingOn] = useState(null);
const [commentText, setCommentText] = useState('');
const [shareModalPost, setShareModalPost] = useState(null);
const [editorOpen, setEditorOpen] = useState(false);
const [previewMedia, setPreviewMedia] = useState(null);
const [caption, setCaption] = useState('');
const [posting, setPosting] = useState(false);

const load = useCallback(async () => {
try {
const t = await T.getTribe(id);
if (!t) return;
const [p, c, r, m, k] = await Promise.all([
T.getPosts(id), T.memberCount(id), user ? T.myRole(id, user.id) : 'none', T.getMembers(id), T.getKnowledge(id)
]);
setTribe(t); setPosts(p); setCount(c); setRole(r || 'none'); setMembers(m); setKnowledge(k);
} catch (e) { console.error('[TribeHome]', e); }
setLoading(false);
}, [id, user?.id]);

useEffect(() => { load(); }, [load]);

const pickMedia = async (type) => {
const result = await ImagePicker.launchImageLibraryAsync({
mediaTypes: type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
allowsEditing: false, quality: 0.8,
});
if (!result.canceled && result.assets[0]) {
  // Strip EXIF data from images
  if (type === 'image') {
    try {
      const strippedUri = await stripExifData(result.assets[0].uri);
      setPreviewMedia({ uri: strippedUri, type: type });
    } catch (err) {
      console.error('EXIF strip failed:', err);
      setPreviewMedia({ uri: result.assets[0].uri, type: type });
    }
  } else {
    setPreviewMedia({ uri: result.assets[0].uri, type: type });
  }
  setEditorOpen(true);
}
};

const handlePost = async () => {
if (!previewMedia || !user?.id) return;
setPosting(true);
try {
await T.createPost({ 
tribe_id: id, author_id: user.id, content: caption || 'Shared a memory',
media_url: previewMedia.uri, media_type: previewMedia.type
});
setEditorOpen(false); setPreviewMedia(null); setCaption('');
await load();
} catch (e) { Alert.alert('Post failed', e.message); }
setPosting(false);
};

const handlePostOptions = (post) => {
Alert.alert('Post Options', 'What would you like to do?', [
{ text: 'Cancel', style: 'cancel' },
{
text: 'Delete Post',
style: 'destructive',
onPress: async () => {
try {
await T.deletePost(post.id, user.id);
await load();
Alert.alert('Success', 'Post deleted successfully');
} catch (e) {
Alert.alert('Error', e.message || 'Failed to delete post');
}
}
}
]);
};

const handleShare = (post) => {
setShareModalPost(post);
};

const executeShare = async (destination) => {
try {
if (destination === 'streets') await T.shareToStreets(shareModalPost, user.id);
else if (destination === 'studio') await T.shareToStudio(shareModalPost, user.id);
else if (destination === 'external') {
await RNShare.share({ message: `Check out this post: ${shareModalPost.content}`, url: shareModalPost.media_url });
}
Alert.alert('Success', `Shared to ${destination}!`);
setShareModalPost(null);
} catch (e) { Alert.alert('Share failed', e.message); }
};

const handleComment = async (postId) => {
if (!commentText.trim()) return;
try {
await T.addTribeComment(postId, user.id, commentText);
setCommentText(''); setCommentingOn(null);
await load();
} catch (e) { Alert.alert('Comment failed', e.message); }
};

if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0ea5e9" /></View>;
if (!tribe) return <View style={styles.center}><Text style={styles.errorText}>Tribe not found</Text></View>;

return (
<View style={{ flex: 1, backgroundColor: '#020617' }}>
<ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor="#0ea5e9" />}>
<LinearGradient colors={['#0f172a', '#1e293b']} style={styles.hero}>
<View style={styles.heroContent}>
<View style={styles.avatarContainer}><Text style={styles.avatarText}>{tribe.name.charAt(0)}</Text></View>
<View style={styles.heroText}>
<Text style={styles.tribeName}>{tribe.name}</Text>
<Text style={styles.tribeTagline}>{tribe.category} • {tribe.country || 'Global'}</Text>
</View>
</View>
<View style={styles.statsRow}>
<View style={styles.stat}><Text style={styles.statNum}>{count}</Text><Text style={styles.statLabel}>Members</Text></View>
<View style={styles.stat}><Text style={styles.statNum}>{knowledge.length}</Text><Text style={styles.statLabel}>Artifacts</Text></View>
<View style={styles.stat}><Text style={styles.statNum}>{posts.length}</Text><Text style={styles.statLabel}>Posts</Text></View>
</View>
<View style={styles.actionRow}>
<TouchableOpacity style={[styles.actionBtn, styles.btnPrimary]}><Text style={styles.actionBtnText}>Joined ✓</Text></TouchableOpacity>
<TouchableOpacity style={styles.iconBtn} onPress={() => router.push(`/(os)/studio/live-setup?tribeId=${id}`)}><Ionicons name="radio" size={20} color="#ef4444" /></TouchableOpacity>
</View>
</LinearGradient>

<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabContent}>
{TABS.map((t) => (
<TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
<Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
</TouchableOpacity>
))}
</ScrollView>

<View style={styles.content}>
{tab === 'Community' && (
<View>
<View style={styles.composer}>
<Text style={{ color: '#64748b', marginBottom: 12 }}>Share a memory with the tribe...</Text>
<View style={{ flexDirection: 'row', gap: 12 }}>
<TouchableOpacity onPress={() => pickMedia('image')} style={styles.mediaBtn}>
<Ionicons name="image-outline" size={18} color="#0ea5e9" />
<Text style={styles.mediaBtnText}>Photo</Text>
</TouchableOpacity>
<TouchableOpacity onPress={() => pickMedia('video')} style={styles.mediaBtn}>
<Ionicons name="videocam-outline" size={18} color="#0ea5e9" />
<Text style={styles.mediaBtnText}>Video</Text>
</TouchableOpacity>
<TouchableOpacity onPress={() => router.push(`/(os)/studio/live-setup?module=tribes&moduleId=${id}`)} style={[styles.mediaBtn, { borderColor: '#ef4444' }]}>
<Ionicons name="radio" size={18} color="#ef4444" />
<Text style={[styles.mediaBtnText, { color: '#ef4444' }]}>Live</Text>
</TouchableOpacity>
</View>
<Text style={{ color: '#475569', fontSize: 11, marginTop: 8 }}>🔒 Privacy: Metadata stripped automatically</Text>
</View>

{posts.map((p) => (
<View key={p.id} style={styles.postCard}>
<View style={styles.postHeader}>
<View style={styles.postAuthorRow}>
<Image source={{ uri: p.author_profile?.avatar_url || 'https://via.placeholder.com/40' }} style={styles.authorAvatar} />
<View style={{ flex: 1 }}>
<Text style={styles.postAuthorName}>{p.author_profile?.full_name || 'Member'}</Text>
<Text style={styles.postTime}>{new Date(p.created_at).toLocaleDateString()}</Text>
</View>
{p.author_id === user?.id && (
<TouchableOpacity onPress={() => handlePostOptions(p)} style={{ padding: 8 }}>
<Ionicons name="ellipsis-vertical" size={20} color="#94a3b8" />
</TouchableOpacity>
)}
</View>
<Text style={styles.postContent}>{p.content}</Text>
</View>
<View style={styles.mediaContainer}>
{p.media_type === 'video' ? (
<Video source={{ uri: p.media_url }} style={styles.mediaContent} resizeMode="contain" isLooping shouldPlay useNativeControls />
) : p.media_url ? (
<Image source={{ uri: p.media_url }} style={styles.mediaContent} resizeMode="contain" />
) : null}
</View>
<View style={styles.actionsRow}>
<TouchableOpacity style={styles.actionItem}><Ionicons name="heart-outline" size={20} color="#fff" /><Text style={styles.actionText}>{p.likes_count || 0}</Text></TouchableOpacity>
<TouchableOpacity style={styles.actionItem} onPress={() => setCommentingOn(commentingOn === p.id ? null : p.id)}><Ionicons name="chatbubble-outline" size={20} color="#fff" /><Text style={styles.actionText}>{p.comments_count || 0}</Text></TouchableOpacity>
<TouchableOpacity style={styles.actionItem} onPress={() => handleShare(p)}><Ionicons name="share-social-outline" size={20} color="#fff" /><Text style={styles.actionText}>Share</Text></TouchableOpacity>
</View>
{commentingOn === p.id && (
<View style={styles.commentBox}>
<TextInput value={commentText} onChangeText={setCommentText} placeholder="Add a comment..." style={styles.commentInput} />
<TouchableOpacity onPress={() => handleComment(p.id)} style={styles.commentBtn}><Ionicons name="send" size={18} color="#fff" /></TouchableOpacity>
</View>
)}
</View>
))}
</View>
)}
</View>
</ScrollView>

<Modal visible={editorOpen} animationType="slide" style={{ backgroundColor: '#000' }}>
<View style={{ flex: 1, backgroundColor: '#0f172a' }}>
<View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#1e293b' }}>
<TouchableOpacity onPress={() => setEditorOpen(false)}><Text style={{ color: '#fff' }}>Cancel</Text></TouchableOpacity>
<Text style={{ color: '#fff', fontWeight: '700' }}>New Post</Text>
<TouchableOpacity onPress={handlePost} disabled={posting}><Text style={{ color: '#0ea5e9', fontWeight: '700' }}>{posting ? 'Posting...' : 'Share'}</Text></TouchableOpacity>
</View>
<ScrollView style={{ flex: 1 }}>
<View style={{ width: '100%', height: 400, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
{previewMedia?.type === 'video' ? (
<Video source={{ uri: previewMedia.uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" useNativeControls />
) : previewMedia ? (
<Image source={{ uri: previewMedia.uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
) : null}
</View>
<View style={{ padding: 16 }}>
<TextInput value={caption} onChangeText={setCaption} placeholder="Write a caption..." placeholderTextColor="#64748b" style={{ color: '#fff', fontSize: 16, minHeight: 60, backgroundColor: '#1e293b', borderRadius: 8, padding: 12 }} />
</View>
</ScrollView>
</View>
</Modal>

<Modal visible={shareModalPost !== null} animationType="slide" transparent={true}>
<View style={styles.modalOverlay}>
<View style={styles.modalContent}>
<Text style={styles.modalTitle}>Share this post to...</Text>
<TouchableOpacity style={styles.modalBtn} onPress={() => executeShare('streets')}><Text style={styles.modalBtnText}>📰 Streets (Mtaa Pulse)</Text></TouchableOpacity>
<TouchableOpacity style={styles.modalBtn} onPress={() => executeShare('studio')}><Text style={styles.modalBtnText}>🎥 Studio</Text></TouchableOpacity>
<TouchableOpacity style={styles.modalBtn} onPress={() => executeShare('external')}><Text style={styles.modalBtnText}>🔗 External (WhatsApp, etc)</Text></TouchableOpacity>
<TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#334155'}]} onPress={() => setShareModalPost(null)}><Text style={styles.modalBtnText}>Cancel</Text></TouchableOpacity>
</View>
</View>
</Modal>
</View>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: '#020617' },
center: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
errorText: { color: '#ef4444', fontSize: 16 },
hero: { padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
heroContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
avatarContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
heroText: { flex: 1 },
tribeName: { color: '#f8fafc', fontSize: 20, fontWeight: '800' },
tribeTagline: { color: '#94a3b8', fontSize: 12 },
statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1e293b' },
stat: { alignItems: 'center' },
statNum: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
statLabel: { color: '#64748b', fontSize: 10 },
actionRow: { flexDirection: 'row', gap: 12 },
actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
btnPrimary: { backgroundColor: '#0ea5e9' },
actionBtnText: { color: '#fff', fontWeight: '700' },
iconBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
tabBar: { backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
tabContent: { paddingHorizontal: 12, paddingVertical: 8 },
tab: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: '#1e293b' },
tabActive: { backgroundColor: '#0ea5e9' },
tabText: { color: '#94a3b8', fontWeight: '600' },
tabTextActive: { color: '#fff' },
content: { padding: 16 },
composer: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 20 },
mediaBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
mediaBtnText: { color: '#0ea5e9', fontSize: 13, fontWeight: '600' },
postCard: { backgroundColor: '#0f172a', borderRadius: 16, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b' },
postHeader: { padding: 12 },
postAuthorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
authorAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
postAuthorName: { color: '#f8fafc', fontWeight: '700', fontSize: 14 },
postTime: { color: '#64748b', fontSize: 11 },
postContent: { color: '#cbd5e1', fontSize: 14, lineHeight: 20 },
mediaContainer: { width: '100%', height: 300, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
mediaContent: { width: '100%', height: '100%' },
actionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#1e293b' },
actionItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
actionText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
commentBox: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#1e293b', backgroundColor: '#0f172a' },
commentInput: { flex: 1, backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, color: '#fff', marginRight: 8 },
commentBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center' },
modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
modalContent: { width: '80%', backgroundColor: '#1e293b', borderRadius: 16, padding: 20, alignItems: 'center' },
modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 20 },
modalBtn: { width: '100%', backgroundColor: '#0ea5e9', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
