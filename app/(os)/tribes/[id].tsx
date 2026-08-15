// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Heart, MessageCircle, Share, UserPlus, Flag, Radio, Send, MessageSquare } from 'lucide-react-native';
import * as T from '@/lib/tribes/services/tribes.service';
import AskAsis from '@/lib/tribes/components/AskAsis';

const TABS = ['Discussion', 'Knowledge', 'Elders', 'Events', 'Governance', 'Members'];

export default function TribeHome() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [tribe, setTribe] = useState(null);
  const [tab, setTab] = useState('Discussion');
  const [role, setRole] = useState('none');
  const [count, setCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [events, setEvents] = useState([]);
  const [elections, setElections] = useState([]);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [diag, setDiag] = useState(null);
  const [commentsFor, setCommentsFor] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentDraft, setCommentDraft] = useState('');

  const load = useCallback(async () => {
    try {
      const t = await T.getTribe(id);
      if (!t) {
        const { data, error } = await supabase.from('tribes').select('id,name,visibility,status').eq('id', id);
        setDiag('tribe null → ' + JSON.stringify({ rows: data, err: error?.message || null }));
      }
      const [p, c, r] = await Promise.all([T.getPosts(id), T.memberCount(id), user ? T.myRole(id, user.id) : 'none']);
      setTribe(t); setPosts(p); setCount(c); setRole(r || 'none');
      const [m, k, i, e, el] = await Promise.all([T.getMembers(id), T.getKnowledge(id), T.getInterviews(id), T.getEvents(id), T.getElections(id)]);
      setMembers(m); setKnowledge(k); setInterviews(i); setEvents(e); setElections(el);
    } catch (e) { console.error('[TribeHome]', e); setDiag(String(e?.message || e)); }
    setLoading(false);
  }, [id, user?.id]);
  useEffect(() => { load(); }, [load]);

  const isMember = role !== 'none';
  const toggleJoin = async () => {
    if (!user?.id) return Alert.alert('Log in first');
    try { if (isMember) await T.leaveTribe(id, user.id); else await T.joinTribe(id, user.id); load(); }
    catch (e) { Alert.alert('Failed', e?.message || String(e)); }
  };
  const publish = async () => {
    if (!draft.trim() || !user?.id) return;
    setPosting(true);
    try { await T.createPost({ tribe_id: id, author_id: user.id, content: draft.trim() }); setDraft(''); load(); }
    catch (e) { Alert.alert('Post failed', e?.message || String(e)); }
    setPosting(false);
  };
  const share = async (p) => { try { await T.shareToStreets(p, user?.id); Alert.alert('Shared to Streets'); } catch (e) { Alert.alert('Share failed', e?.message || String(e)); } };
  const report = async (p) => {
    const reason = window.prompt('Why are you reporting this post?');
    if (!reason || !user?.id) return;
    try { await T.reportTribePost(p.id, user.id, reason); Alert.alert('Report submitted for moderation'); }
    catch (e) { Alert.alert('Report failed', e?.message || String(e)); }
  };
  const openComments = async (postId) => {
    if (commentsFor === postId) { setCommentsFor(null); return; }
    setCommentsFor(postId); setComments(await T.getTribeComments(postId));
  };
  const sendComment = async (postId) => {
    if (!commentDraft.trim() || !user?.id) return;
    try { await T.addTribeComment(postId, user.id, commentDraft.trim()); setCommentDraft(''); setComments(await T.getTribeComments(postId)); }
    catch (e) { Alert.alert('Comment failed', e?.message || String(e)); }
  };
  const createEvent = async () => {
    const title = window.prompt('Event title'); if (!title) return;
    const location = window.prompt('Location (optional)') || null;
    try { await T.createTribeEvent({ tribe_id: id, title, location, created_by: user?.id }); load(); }
    catch (e) { Alert.alert('Event failed', e?.message || String(e)); }
  };
  const vote = async (eid) => { try { await T.castVote(eid); Alert.alert('Vote recorded'); load(); } catch (e) { Alert.alert('Vote rejected', e?.message || String(e)); } };

  if (loading) return <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#2196f3" /></View>;
  if (!tribe) return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ color: '#888', marginBottom: 12 }}>Tribe not found</Text>
      {diag ? <Text style={{ color: '#ff6b6b', fontSize: 11, textAlign: 'center' }}>{diag}</Text> : null}
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ height: 140, backgroundColor: '#12233a' }}>{tribe.cover_url ? <Image source={{ uri: tribe.cover_url }} style={{ width: '100%', height: '100%' }} /> : null}</View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: -28 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#2196f3', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#0a0a0a', overflow: 'hidden' }}>
            {tribe.avatar_url ? <Image source={{ uri: tribe.avatar_url }} style={{ width: 64, height: 64 }} /> : <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>{(tribe.name || 'T').charAt(0)}</Text>}
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>{tribe.name}</Text>
            <Text style={{ color: '#888', fontSize: 12 }}>{count} members · {tribe.category} · {tribe.country || 'Global'}</Text>
          </View>
        </View>
        {tribe.description ? <Text style={{ color: '#bbb', fontSize: 13, marginTop: 8 }}>{tribe.description}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <TouchableOpacity onPress={toggleJoin} style={{ flex: 1, backgroundColor: isMember ? '#2a2a2a' : '#2196f3', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{isMember ? 'Joined ✓' : 'Join Tribe'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/messages')} style={{ backgroundColor: '#2a2a2a', borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center' }}><MessageSquare size={18} color="#fff" /></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/studio/live-active')} style={{ backgroundColor: '#2a2a2a', borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center' }}><Radio size={18} color="#ff4d6d" /></TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Invite', 'Share link: mtaa.app/t/' + tribe.id)} style={{ backgroundColor: '#2a2a2a', borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center' }}><UserPlus size={18} color="#fff" /></TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#101018', borderBottomWidth: 1, borderBottomColor: '#1f1f1f' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Tribe intelligence</Text>
          <AskAsis tribeId={id} tribeName={tribe.name} context="tribe knowledge & campaigns" onInsert={setDraft} />
        </View>
        <Text style={{ color: '#9aa', fontSize: 12, marginTop: 4 }}>{tribe.description || 'No description yet.'}</Text>
        {knowledge.slice(0, 2).map((k) => <Text key={k.id} style={{ color: '#7dd3fc', fontSize: 12, marginTop: 4 }}>• {k.title}{k.summary ? ': ' + k.summary : ''}</Text>)}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: 1, borderBottomColor: '#1f1f1f' }} contentContainerStyle={{ paddingHorizontal: 12 }}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: tab === t ? '#2196f3' : 'transparent' }}>
            <Text style={{ color: tab === t ? '#2196f3' : '#888', fontWeight: '700', fontSize: 13 }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {tab === 'Discussion' && (
        <View style={{ padding: 12 }}>
          {isMember && (
            <View style={{ backgroundColor: '#141414', borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <TextInput value={draft} onChangeText={setDraft} placeholder="Write something..." placeholderTextColor="#666" multiline style={{ color: '#fff', fontSize: 14, minHeight: 60 }} />
              <TouchableOpacity onPress={publish} disabled={posting} style={{ backgroundColor: '#2196f3', borderRadius: 10, paddingVertical: 8, alignItems: 'center', marginTop: 8 }}>
                {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Post</Text>}
              </TouchableOpacity>
            </View>
          )}
          {posts.map((p) => (
            <View key={p.id} style={{ backgroundColor: '#141414', borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{p.author_id === user?.id ? 'You' : 'Member'}</Text>
              <Text style={{ color: '#ddd', fontSize: 14, marginTop: 6 }}>{p.content}</Text>
              {p.media_url ? <Image source={{ uri: p.media_url }} style={{ width: '100%', height: 220, borderRadius: 10, marginTop: 8 }} /> : null}
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Heart size={14} color="#e91e63" /><Text style={{ color: '#888', fontSize: 12 }}>{p.likes_count || 0}</Text></View>
                <TouchableOpacity onPress={() => openComments(p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><MessageCircle size={14} color="#888" /><Text style={{ color: '#888', fontSize: 12 }}>{p.comments_count || 0}</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => share(p)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Share size={14} color="#888" /><Text style={{ color: '#888', fontSize: 12 }}>Streets</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => report(p)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Flag size={14} color="#888" /><Text style={{ color: '#888', fontSize: 12 }}>Report</Text></TouchableOpacity>
              </View>
              {commentsFor === p.id && (
                <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: '#222', paddingTop: 8 }}>
                  {comments.map((c) => <Text key={c.id} style={{ color: '#bbb', fontSize: 12, marginBottom: 6 }}>• {c.content}</Text>)}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput value={commentDraft} onChangeText={setCommentDraft} placeholder="Add a comment..." placeholderTextColor="#666" style={{ flex: 1, backgroundColor: '#1e1e2e', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: '#fff', fontSize: 13 }} />
                    <TouchableOpacity onPress={() => sendComment(p.id)} style={{ backgroundColor: '#2196f3', borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center' }}><Send size={16} color="#fff" /></TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
          {posts.length === 0 && <Text style={{ color: '#666', textAlign: 'center', paddingVertical: 24 }}>No posts yet. Start the discussion.</Text>}
        </View>
      )}

      {tab === 'Knowledge' && (
        <View style={{ padding: 12 }}>
          {knowledge.map((k) => (
            <View key={k.id} style={{ backgroundColor: '#141414', borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{k.title}</Text>
              {k.summary ? <Text style={{ color: '#bbb', fontSize: 13, marginTop: 4 }}>{k.summary}</Text> : null}
              <Text style={{ color: k.verification === 'verified' ? '#4ade80' : '#fbbf24', fontSize: 11, marginTop: 6 }}>{k.verification} · {k.kind}</Text>
            </View>
          ))}
          {knowledge.length === 0 && <Text style={{ color: '#666', textAlign: 'center', paddingVertical: 24 }}>No knowledge yet. Contribute via ASIS or add entries.</Text>}
        </View>
      )}

      {tab === 'Elders' && (
        <View style={{ padding: 12 }}>
          {members.filter((m) => m.role === 'elder').map((m) => (
            <View key={m.user_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#141414', borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '700' }}>{(m.user_profiles?.full_name || 'E').charAt(0)}</Text></View>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{m.user_profiles?.full_name || 'Elder'}</Text>
            </View>
          ))}
          {interviews.map((i) => (
            <View key={i.id} style={{ backgroundColor: '#141414', borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{i.speaker_name || 'Elder'} · {i.topic}</Text>
              {i.summary ? <Text style={{ color: '#bbb', fontSize: 13, marginTop: 4 }}>{i.summary}</Text> : null}
            </View>
          ))}
          {interviews.length === 0 && members.filter((m) => m.role === 'elder').length === 0 && <Text style={{ color: '#666', textAlign: 'center', paddingVertical: 24 }}>No elders recognized yet.</Text>}
        </View>
      )}

      {tab === 'Events' && (
        <View style={{ padding: 12 }}>
          {isMember && <TouchableOpacity onPress={createEvent} style={{ backgroundColor: '#2196f3', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginBottom: 12 }}><Text style={{ color: '#fff', fontWeight: '700' }}>Create event</Text></TouchableOpacity>}
          {events.map((e) => (
            <View key={e.id} style={{ backgroundColor: '#141414', borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{e.title}</Text>
              <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{e.starts_at ? new Date(e.starts_at).toLocaleString() : ''}{e.location ? ' · ' + e.location : ''}</Text>
            </View>
          ))}
          {events.length === 0 && <Text style={{ color: '#666', textAlign: 'center', paddingVertical: 24 }}>No events scheduled.</Text>}
        </View>
      )}

      {tab === 'Governance' && (
        <View style={{ padding: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 10 }}>Elections unlock at 500 members ({count}/500). Enforced server-side.</Text>
          {count >= 500 && isMember && (
            <TouchableOpacity onPress={async () => { try { await T.createElection(id, 'Elect administrator', 'admin'); load(); } catch (e) { Alert.alert('Blocked', e.message); } }} style={{ backgroundColor: '#e91e63', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Start election</Text>
            </TouchableOpacity>
          )}
          {elections.map((e) => (
            <View key={e.id} style={{ backgroundColor: '#141414', borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{e.title}</Text>
              <Text style={{ color: '#888', fontSize: 12 }}>{e.election_type} · {e.status}</Text>
              {e.status === 'open' && <TouchableOpacity onPress={() => vote(e.id)} style={{ marginTop: 8, backgroundColor: '#2a2a2a', borderRadius: 8, paddingVertical: 8, alignItems: 'center' }}><Text style={{ color: '#e91e63', fontWeight: '700' }}>Vote</Text></TouchableOpacity>}
            </View>
          ))}
        </View>
      )}

      {tab === 'Members' && (
        <View style={{ padding: 12 }}>
          {members.map((m) => (
            <View key={m.user_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#141414', borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '700' }}>{(m.user_profiles?.full_name || 'M').charAt(0)}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{m.user_profiles?.full_name || 'Member'}</Text>
                <Text style={{ color: '#888', fontSize: 11 }}>{m.role}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
