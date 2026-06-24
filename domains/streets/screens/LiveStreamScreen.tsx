import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  TextInput, ActivityIndicator, Dimensions, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

interface LiveComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface LiveGift {
  id: string;
  sender_id: string;
  amount: number;
  message: string | null;
  sender_name: string;
}

export default function LiveStreamScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [stream, setStream] = useState<any>(null);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showGifts, setShowGifts] = useState(false);
  const commentListRef = useRef<FlatList>(null);

  const loadStream = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('studio_live_streams')
      .select(`
        id, title, creator_id, is_live, viewer_count, stream_url, privacy, started_at,
        creator:user_profiles!studio_live_streams_creator_id_fkey(display_name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) { console.error('Stream load error:', error); return; }
    setStream(data);
    setViewerCount(data?.viewer_count || 0);

    const { data: { user } } = await supabase.auth.getUser();
    setIsHost(user?.id === data?.creator_id);
  }, [id]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('studio_live_comments')
      .select(`
        id, user_id, content, created_at,
        user:user_profiles!studio_live_comments_user_id_fkey(display_name, avatar_url)
      `)
      .eq('stream_id', id)
      .order('created_at', { ascending: true })
      .limit(100);
    setComments((data || []).map((c: any) => ({ ...c, user: Array.isArray(c.user) ? c.user[0] : c.user })));
  }, [id]);

  const joinStream = useCallback(async () => {
    if (!id || isHost) return;
    await supabase.rpc('increment_live_viewers', { stream_id: id });
  }, [id, isHost]);

  const leaveStream = useCallback(async () => {
    if (!id || isHost) return;
    await supabase.rpc('decrement_live_viewers', { stream_id: id });
  }, [id, isHost]);

  useEffect(() => {
    loadStream();
    loadComments();
    joinStream();

    const commentSub = supabase
      .channel(`live-comments-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'studio_live_comments', filter: `stream_id=eq.${id}` }, (payload) => {
        setComments(prev => [...prev, payload.new as LiveComment]);
        setTimeout(() => commentListRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .subscribe();

    const viewerSub = supabase
      .channel(`live-viewers-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'studio_live_streams', filter: `id=eq.${id}` }, (payload) => {
        setViewerCount(payload.new.viewer_count || 0);
      })
      .subscribe();

    return () => {
      commentSub.unsubscribe();
      viewerSub.unsubscribe();
      leaveStream();
    };
  }, [id, loadStream, loadComments, joinStream, leaveStream]);

  const sendComment = async () => {
    if (!commentText.trim() || !id) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase.from('studio_live_comments').insert({
        stream_id: id,
        user_id: user.id,
        content: commentText.trim(),
      });
      setCommentText('');
    } catch (e) {
      console.error('Comment error:', e);
    }
  };

  const endStream = async () => {
    if (!isHost) return;
    Alert.alert('End Stream', 'Are you sure you want to end this live stream?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('studio_live_streams').update({ is_live: false, ended_at: new Date().toISOString() }).eq('id', id);
          router.replace('/streets/studio');
        },
      },
    ]);
  };

  const sendGift = async (amount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !stream?.creator_id) return;

      await supabase.from('wallet_transactions').insert({
        sender_id: user.id,
        recipient_id: stream.creator_id,
        amount,
        currency: 'USD',
        type: 'live_gift',
        status: 'completed',
        description: `Live gift on "${stream.title}"`,
      });

      await supabase.from('studio_live_gifts').insert({
        stream_id: id,
        sender_id: user.id,
        recipient_id: stream.creator_id,
        amount,
      });

      setShowGifts(false);
    } catch (e) {
      Alert.alert('Gift Failed', String(e));
    }
  };

  if (loading && !stream) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Video / Stream Area */}
      <View style={{ width, height: height * 0.55, backgroundColor: '#111' }}>
        {stream?.stream_url ? (
          <Video
            source={{ uri: stream.stream_url }}
            style={{ width, height: height * 0.55 }}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            useNativeControls={false}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="radio" size={64} color="#333" />
            <Text style={{ color: '#666', marginTop: 12 }}>{isHost ? 'Your stream is live' : 'Waiting for stream...'}</Text>
          </View>
        )}

        {/* Top Overlay */}
        <View style={{ position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
            {stream?.creator?.avatar_url ? (
              <Image source={{ uri: stream.creator.avatar_url }} style={{ width: 32, height: 32, borderRadius: 16 }} />
            ) : (
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="person" size={16} color="#fff" />
              </View>
            )}
            <View style={{ marginLeft: 8 }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{stream?.creator?.display_name || 'Creator'}</Text>
              <Text style={{ color: '#ff3040', fontSize: 11, fontWeight: '700' }}>LIVE</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="eye" size={14} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13 }}>{viewerCount}</Text>
            </View>
            {isHost ? (
              <TouchableOpacity onPress={endStream} style={{ backgroundColor: '#ff3040', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>END</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Comments */}
      <View style={{ flex: 1, paddingHorizontal: 12, paddingTop: 8 }}>
        <FlatList
          ref={commentListRef}
          data={comments}
          keyExtractor={c => c.id}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' }}>
              {item.user?.avatar_url ? (
                <Image source={{ uri: item.user.avatar_url }} style={{ width: 28, height: 28, borderRadius: 14 }} />
              ) : (
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="person" size={14} color="#fff" />
                </View>
              )}
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 13 }}>
                  <Text style={{ fontWeight: '700' }}>{item.user?.display_name || 'Unknown'}</Text>{' '}
                  <Text style={{ color: '#ccc' }}>{item.content}</Text>
                </Text>
              </View>
            </View>
          )}
          onContentSizeChange={() => commentListRef.current?.scrollToEnd({ animated: true })}
        />
      </View>

      {/* Bottom Input */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#222' }}>
        <TextInput
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Say something..."
          placeholderTextColor="#666"
          style={{ flex: 1, color: '#fff', fontSize: 14, backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 }}
        />
        <TouchableOpacity onPress={sendComment} disabled={!commentText.trim()} style={{ marginLeft: 10 }}>
          <Ionicons name="send" size={24} color={commentText.trim() ? '#00d4ff' : '#333'} />
        </TouchableOpacity>
        {!isHost && (
          <TouchableOpacity onPress={() => setShowGifts(true)} style={{ marginLeft: 10 }}>
            <Ionicons name="gift" size={24} color="#ffaa00" />
          </TouchableOpacity>
        )}
      </View>

      {/* Gifts Modal */}
      {showGifts && (
        <View style={{ position: 'absolute', bottom: 70, left: 0, right: 0, backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Send Gift</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[1, 5, 10, 20, 50].map(amt => (
              <TouchableOpacity
                key={amt}
                onPress={() => sendGift(amt)}
                style={{ flex: 1, backgroundColor: '#222', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
              >
                <Ionicons name="gift" size={24} color="#ffaa00" />
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 4 }}>${amt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => setShowGifts(false)} style={{ alignItems: 'center', marginTop: 12 }}>
            <Text style={{ color: '#888' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
